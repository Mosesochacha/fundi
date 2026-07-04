import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import db from "../models";
import { JWT_CONFIG, USERNAME_CONFIG, REFRESH_GRACE_MS, normalizeCurrency, DEFAULT_CURRENCY } from "../utils/constants";
import { symbolForCurrency } from "../utils/currencyMap";
import {
  hashString,
  safeCompare,
  formatUserResponse,
  generateJWTPayload,
} from "../utils/helpers";
import logger from "../utils/logger";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  location: string;
  accountType: "employer" | "worker";
  phoneNumber?: string;
  trade?: string;
  interestedTrades?: string[];
  dailyRate?: number;
  currency?: string;
  agreedToTerms?: boolean;
  username?: string;
  role?: "user" | "admin" | "moderator";
}

/**
 * Build a unique, URL-safe username from a person's name. Falls back to a
 * random numeric suffix when the base is taken.
 */
async function generateUniqueUsername(
  firstName: string,
  lastName: string,
  t: any
): Promise<string> {
  const base =
    `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "fundi";
  let candidate = base.length >= 3 ? base : `${base}user`;
  let tries = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await db.Profile.findOne({ where: { username: candidate }, transaction: t })) {
    candidate = `${base.slice(0, 20)}${Math.floor(1000 + Math.random() * 9000)}`;
    if (++tries > 12) {
      candidate = `${base.slice(0, 15)}${Date.now().toString().slice(-6)}`;
      break;
    }
  }
  return candidate;
}

export interface LoginData {
  /** Email address or phone number. */
  identifier: string;
  password: string;
}

/**
 * Normalise an international phone number for storage/matching: strip all
 * formatting (spaces, dashes, parentheses, dots) but preserve a leading "+"
 * country-code marker. Country-agnostic — works for any region.
 * NOTE: national vs international equivalence (e.g. 0712… ≡ +254712…) is NOT
 * resolved here; that needs a real phone library + the user's country.
 */
export function normalizePhone(s: string): string {
  const trimmed = s.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterData) {
    const {
      email, password, firstName, lastName, location, accountType,
      phoneNumber, trade, interestedTrades, dailyRate, currency, agreedToTerms, role,
    } = userData;
    const isWorker = accountType === "worker";
    let currencyCode = DEFAULT_CURRENCY;
    if (currency !== undefined && currency !== null && currency !== "") {
      const normalized = normalizeCurrency(currency);
      if (!normalized) {
        throw new Error("Invalid currency");
      }
      currencyCode = normalized;
    }
    const t = await db.sequelize.transaction();
    try {
      const existingUser = await db.User.findOne({ where: { email }, transaction: t });
      if (existingUser) {
        throw new Error("Email already in use");
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const username = userData.username?.trim() || (await generateUniqueUsername(firstName, lastName, t));

      const user = await db.User.create(
        {
          firstName,
          lastName,
          email,
          passwordHash,
          role: role || 'user',
          accountType,
          phoneNumber: phoneNumber ? normalizePhone(phoneNumber) : null,
          isPhoneVerified: false,
          isProfileComplete: true,
          isOnboarded: true,
          onboardingCompletedAt: new Date(),
          interestedTrades: isWorker ? [] : (interestedTrades || []),
          dailyRate: isWorker ? (dailyRate ?? null) : null,
          currency: currencyCode,
          currencySymbol: symbolForCurrency(currencyCode),
          emailVerified: false,
          status: 'active',
          termsAccepted: !!agreedToTerms,
          termsAcceptedAt: agreedToTerms ? new Date() : null,
        },
        { transaction: t }
      );

      const fullName = `${firstName} ${lastName}`;
      await db.Profile.create(
        {
          userId: user.id,
          username,
          fullName,
          profession: isWorker ? (trade || 'Other') : 'Client',
          location,
          appearInSearch: isWorker,
        },
        { transaction: t }
      );
      await t.commit();
      return { user: formatUserResponse(user) };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Login user and generate tokens
   */
  async login(
    loginData: LoginData,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<{
    user: any;
    profile: any;
    tokens: AuthTokens;
  }> {
    const { identifier, password } = loginData;
    const id = identifier.trim();
    const isEmail = id.includes("@");
    const where = isEmail
      ? { email: id.toLowerCase() }
      : { phoneNumber: normalizePhone(id) };

    try {
      const user = await db.User.findOne({ where });

      if (!user) {
        logger.warn('Login failed: user not found', { identifier: id, ipAddress });
        throw new Error("Invalid credentials");
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new Error(`Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        const attempts = (user.loginAttempts ?? 0) + 1;
        const update: Record<string, any> = { loginAttempts: attempts };
        if (attempts >= 5) {
          update.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
          logger.warn('Account locked after 5 failed attempts', { userId: user.id, ipAddress });
        }
        await user.update(update);
        logger.warn('Login failed: invalid password', { userId: user.id, ipAddress });
        throw new Error("Invalid credentials");
      }

      if (!user.emailVerified) {
        logger.warn('Login failed: email not verified', { userId: user.id, ipAddress });
        throw new Error("Email not verified");
      }

      if (!user.isActive) {
        logger.warn('Login failed: account deactivated', { userId: user.id, ipAddress });
        throw new Error("Account is deactivated");
      }

      if (user.status === 'suspended') {
        logger.warn('Login failed: account suspended', { userId: user.id, ipAddress });
        throw new Error("Your account has been suspended. Contact support.");
      }

      if (user.loginAttempts > 0 || user.lockedUntil) {
        await user.update({ loginAttempts: 0, lockedUntil: null });
      }

      const tokens = await this.generateTokens(user, ipAddress, userAgent);

      await user.update({ lastLoginAt: new Date() });

      try {
        await db.LoginHistory.create({
          userId: user.id,
          ipAddress,
          userAgent,
          status: 'success',
        });
      } catch (historyErr: any) {
        logger.warn('Failed to record login history', { error: historyErr.message });
      }

      logger.info('Login successful', { userId: user.id, ipAddress });

      const profile = await db.Profile.findOne({ where: { userId: user.id } });

      return {
        user: formatUserResponse(user),
        profile: profile ? profile.get({ plain: true }) : null,
        tokens,
      };
    } catch (error: any) {
      if (!['Invalid credentials', 'Email not verified', 'Account is deactivated'].includes(error.message)) {
        logger.error('Login error', { identifier: id, error: error.message, ipAddress });
      }
      throw error;
    }
  }

  /**
   * Sign in (or sign up) a user from a verified Google identity.
   * New accounts are created with `accountType: null` and `isOnboarded: false`
   * so the client routes them through /setup to choose worker/employer.
   */
  async loginWithGoogle(
    googleUser: {
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    },
    ipAddress = '',
    userAgent = ''
  ): Promise<{ user: any; profile: any; tokens: AuthTokens }> {
    const email = googleUser.email.toLowerCase().trim();
    let user = await db.User.findOne({ where: { email } });

    if (!user) {
      const t = await db.sequelize.transaction();
      try {
        const username = await generateUniqueUsername(
          googleUser.firstName,
          googleUser.lastName,
          t
        );
        const passwordHash = await bcrypt.hash(uuidv4(), 12);
        user = await db.User.create(
          {
            firstName: googleUser.firstName || email.split('@')[0],
            lastName: googleUser.lastName || 'User',
            email,
            passwordHash,
            role: 'user',
            accountType: null,
            emailVerified: true,
            isProfileComplete: false,
            isOnboarded: false,
            status: 'active',
          },
          { transaction: t }
        );
        await db.Profile.create(
          {
            userId: user.id,
            username,
            fullName: `${googleUser.firstName} ${googleUser.lastName}`.trim(),
            profession: 'Client',
            location: '',
            avatarUrl: googleUser.avatarUrl ?? null,
            appearInSearch: false,
          },
          { transaction: t }
        );
        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else if (!user.emailVerified) {
      await user.update({ emailVerified: true });
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    if (user.status === 'suspended') {
      throw new Error('Your account has been suspended. Contact support.');
    }

    const tokens = await this.generateTokens(user, ipAddress, userAgent);
    await user.update({ lastLoginAt: new Date() });
    const profile = await db.Profile.findOne({ where: { userId: user.id } });

    return {
      user: formatUserResponse(user),
      profile: profile ? profile.get({ plain: true }) : null,
      tokens,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(
    user: any,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthTokens> {
    try {
      const jti = uuidv4();
      const payload = generateJWTPayload(user);

      const accessToken = jwt.sign(
        { ...payload, jti, ipAddress, userAgent },
        JWT_CONFIG.SECRET,
        { algorithm: "HS256", expiresIn: JWT_CONFIG.ACCESS_EXPIRES } as jwt.SignOptions
      );

      const refreshToken = jwt.sign(
        { email: user.email, id: user.id },
        JWT_CONFIG.REFRESH_SECRET,
        { algorithm: "HS256", expiresIn: `${JWT_CONFIG.REFRESH_EXPIRES_DAYS}d` } as jwt.SignOptions
      );

      const decoded = jwt.decode(refreshToken) as any;
      if (!decoded || !decoded.exp) {
        throw new Error("Failed to decode refresh token to get expiry");
      }
      const tokenExpiresAt = new Date(decoded.exp * 1000);

      const hashedToken = hashString(refreshToken);
      await db.RefreshToken.create({
        userId: user.id,
        tokenHash: hashedToken,
        ipAddress,
        userAgent,
        expiresAt: tokenExpiresAt,
      });

      return { accessToken, refreshToken };
    } catch (error: any) {
      logger.error('Token generation failed', { userId: user.id, error: error.message });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthTokens> {
    let decoded: any;
    
    try {
      decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
      if (!decoded || typeof decoded !== 'object') {
        throw new Error("Invalid refresh token");
      }
      
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        logger.error("Refresh token has expired", {
          tokenExp: decoded.exp,
          currentTime: Math.floor(Date.now() / 1000),
          expiredAt: new Date(decoded.exp * 1000).toISOString()
        });
        throw new Error("Refresh token expired");
      }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        logger.error("Refresh token expired", {
          expiredAt: error.expiredAt,
          currentTime: new Date().toISOString()
        });
      } else if (error.name === 'JsonWebTokenError') {
        logger.error("Invalid refresh token format", {
          message: error.message
        });
      } else {
        logger.error("Refresh token verification failed:", {
          error: error.message,
          name: error.name
        });
      }
      throw new Error("Invalid refresh token");
    }

    const { id: userId, email } = decoded;
    if (!userId || !email) {
      logger.error("Invalid refresh token payload:", decoded);
      throw new Error("Invalid refresh token");
    }

    logger.info("Looking for refresh token in database", { 
      tokenLength: refreshToken.length,
      userId,
      email 
    });
    
    const hashedToken = hashString(refreshToken);
    
    const graceCutoff = new Date(Date.now() - REFRESH_GRACE_MS);
    const userTokens = await db.RefreshToken.findAll({
      where: {
        userId,
        expiresAt: { [Op.gt]: new Date() },
        [Op.or]: [
          { isRevoked: false },
          { rotatedAt: { [Op.gt]: graceCutoff } },
        ],
      },
      include: [{ model: db.User, as: "user" }],
    });
    
    let storedToken = null;
    for (const token of userTokens) {
      if (safeCompare(token.tokenHash, hashedToken)) {
        storedToken = token;
        break;
      }
    }

    if (!storedToken) {
      const allUserTokens = await db.RefreshToken.findAll({
        where: { userId },
        attributes: ['id', 'isRevoked', 'expiresAt', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      logger.error("Refresh token not found in database or expired", {
        tokenLength: refreshToken.length,
        userId,
        email,
        currentTime: new Date().toISOString(),
        userTokenCount: allUserTokens.length,
        recentTokens: allUserTokens.map((t: any) => ({
          id: t.id,
          isRevoked: t.isRevoked,
          expiresAt: t.expiresAt,
          createdAt: t.createdAt,
          isExpired: t.expiresAt < new Date()
        }))
      });
      throw new Error("Invalid refresh token");
    }
    
    logger.info("Refresh token found in database", {
      tokenId: storedToken.id,
      userId: storedToken.userId,
      expiresAt: storedToken.expiresAt
    });

    if (!storedToken.user) {
      logger.error("User not found for refresh token");
      throw new Error("Invalid refresh token");
    }

    if (storedToken.isRevoked) {
      logger.info("Refresh token already rotated within grace window; reissuing", {
        tokenId: storedToken.id,
        userId: storedToken.userId,
        rotatedAt: storedToken.rotatedAt,
      });
      return this.generateTokens(storedToken.user, ipAddress, userAgent);
    }

    await storedToken.update({ isRevoked: true, rotatedAt: new Date() });

    return this.generateTokens(storedToken.user, ipAddress, userAgent);
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    try {
      const decoded: any = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
      if (!decoded || typeof decoded !== 'object' || !decoded.id) {
        return;
      }

      const hashedToken = hashString(refreshToken);
      
      const userTokens = await db.RefreshToken.findAll({
        where: {
          userId: decoded.id,
          isRevoked: false,
          expiresAt: { [Op.gt]: new Date() },
        },
      });
      
      for (const token of userTokens) {
        if (safeCompare(token.tokenHash, hashedToken)) {
          await token.update({ isRevoked: true });
          break;
        }
      }
    } catch (error) {
      logger.warn("Logout: Invalid refresh token provided", { error: error });
    }
  }

  /**
   * Check username availability
   */

  /**
   * Check if user exists by email
   */
  async checkUserExists(email: string): Promise<boolean> {
    const user = await db.User.findOne({ where: { email } });
    return !!user;
  }

  /**
   * Mark email as verified
   */
  async markEmailAsVerified(email: string): Promise<void> {
    await db.User.update({ emailVerified: true }, { where: { email } });
  }

  /**
   * Reset password
   */
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await user.update({ passwordHash });

    await db.RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id } }
    );
  }

  /**
   * Reset password by user id (for token-based reset)
   */
  async resetPasswordByUserId(userId: string, newPassword: string): Promise<void> {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash });

    await db.RefreshToken.update(
      { isRevoked: true },
      { where: { userId } }
    );
  }

  /**
   * Verify JWT token
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, JWT_CONFIG.SECRET);
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return formatUserResponse(user);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }
    return formatUserResponse(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: Partial<RegisterData> & { avatarUrl?: string }
  ) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await db.User.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new Error("Email already in use");
      }
    }

    const { avatarUrl, ...userFields } = updateData as any;

    await user.update(userFields);
    return formatUserResponse(user);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await user.update({ passwordHash: newPasswordHash });

    await db.RefreshToken.update({ isRevoked: true }, { where: { userId } });
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string, reason: string) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const trimmedReason = reason.trim();

    try {
      await db.AccountDeletionLog.create({
        email: user.email,
        reason: trimmedReason,
      });
    } catch (error: any) {
      logger.error("Failed to persist account deletion reason", {
        error: error.message,
        stack: error.stack,
        userId: user.id,
      });
    }

    await db.RefreshToken.update({ isRevoked: true }, { where: { userId } });

    await user.destroy();
  }
}

export default new AuthService();
