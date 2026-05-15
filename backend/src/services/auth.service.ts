import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import db from "../models";
import { JWT_CONFIG, USERNAME_CONFIG } from "../utils/constants";
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
  username: string;
  firstName: string;
  lastName: string;
  profession: string;
  location: string;
  termsAccepted?: boolean;
  ageConfirmed?: boolean;
  role?: "user" | "admin" | "moderator";
}

export interface LoginData {
  email: string;
  password: string;
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
    const { email, password, username, firstName, lastName, profession, location, termsAccepted, ageConfirmed, role } = userData;
    const t = await db.sequelize.transaction();
    try {
      const existingUser = await db.User.findOne({ where: { email }, transaction: t });
      if (existingUser) {
        throw new Error("Email already in use");
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await db.User.create(
        {
          firstName,
          lastName,
          email,
          passwordHash,
          role: role || 'user',
          emailVerified: true,
          status: 'active',
          termsAccepted: !!termsAccepted,
          termsAcceptedAt: termsAccepted ? new Date() : null,
          ageConfirmed: !!ageConfirmed,
          ageConfirmedAt: ageConfirmed ? new Date() : null,
        },
        { transaction: t }
      );
      const fullName = `${firstName} ${lastName}`;
      await db.Profile.create(
        {
          userId: user.id,
          username,
          fullName,
          profession,
          location,
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
    const { email, password } = loginData;

    logger.info(`AuthService: Starting login process for email: ${email}`, {
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    });

    try {
      // Find user by email
      logger.info(`AuthService: Looking up user with email: ${email}`);
      const user = await db.User.findOne({ where: { email } });
      
      if (!user) {
        logger.warn(`AuthService: User not found for email: ${email}`, {
          ipAddress,
          userAgent
        });
        throw new Error("Invalid credentials");
      }

      logger.info(`AuthService: User found - ID: ${user.id}, Email: ${user.email}`, {
        userId: user.id,
        emailVerified: user.emailVerified,
        isActive: user.isActive
      });

      // Check if email is verified
      if (!user.emailVerified) {
        logger.warn(`AuthService: Email not verified for user: ${email}`, {
          userId: user.id,
          ipAddress,
          userAgent
        });
        throw new Error("Email not verified");
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn(`AuthService: Inactive user attempted login: ${email}`, {
          userId: user.id,
          ipAddress,
          userAgent
        });
        throw new Error("Account is deactivated");
      }

      // Verify password
      logger.info(`AuthService: Verifying password for user: ${email}`);
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        logger.warn(`AuthService: Invalid password for user: ${email}`, {
          userId: user.id,
          ipAddress,
          userAgent
        });
        throw new Error("Invalid credentials");
      }

      logger.info(`AuthService: Password verified for user: ${email}`);

      // Generate tokens
      logger.info(`AuthService: Generating tokens for user: ${email}`);
      const tokens = await this.generateTokens(user, ipAddress, userAgent);
      logger.info(`AuthService: Tokens generated successfully for user: ${email}`);

      // Update last login
      logger.info(`AuthService: Updating last login for user: ${email}`);
      await user.update({ lastLoginAt: new Date() });
      logger.info(`AuthService: Last login updated for user: ${email}`);

      // Record successful login history
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

      logger.info(`AuthService: Login successful for user: ${email}`, {
        userId: user.id,
        ipAddress,
        userAgent
      });

      const profile = await db.Profile.findOne({ where: { userId: user.id } });

      return {
        user: formatUserResponse(user),
        profile: profile ? profile.get({ plain: true }) : null,
        tokens,
      };
    } catch (error: any) {
      logger.error(`AuthService: Login failed for email: ${email}`, {
        error: error.message,
        stack: error.stack,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(
    user: any,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthTokens> {
    logger.info(`AuthService: Starting token generation for user: ${user.email}`, {
      userId: user.id,
      ipAddress,
      userAgent
    });

    try {
      logger.info(`AuthService: Generating JWT payload for user: ${user.email}`);
      const jti = uuidv4();
      const payload = generateJWTPayload(user);
      logger.info(`AuthService: JWT payload generated for user: ${user.email}`, {
        userId: user.id,
        jti,
        payloadKeys: Object.keys(payload)
      });

      // Generate access token
      logger.info(`AuthService: Generating access token for user: ${user.email}`);
      const accessToken = jwt.sign(
        {
          ...payload,
          jti,
          ipAddress,
          userAgent,
        },
        JWT_CONFIG.SECRET,
        {
          algorithm: "HS256",
          expiresIn: JWT_CONFIG.ACCESS_EXPIRES,
        } as jwt.SignOptions
      );
      logger.info(`AuthService: Access token generated for user: ${user.email}`);

      // Generate refresh token
      logger.info(`AuthService: Generating refresh token for user: ${user.email}`);
      const refreshToken = jwt.sign(
        { email: user.email, id: user.id },
        JWT_CONFIG.REFRESH_SECRET,
        {
          algorithm: "HS256",
          expiresIn: `${JWT_CONFIG.REFRESH_EXPIRES_DAYS}d`,
        } as jwt.SignOptions
      );
      logger.info(`AuthService: Refresh token generated for user: ${user.email}`);

      // Decode the token to get the exact expiry date that JWT library calculated
      // This ensures database expiry matches JWT expiry exactly
      const decoded = jwt.decode(refreshToken) as any;
      if (!decoded || !decoded.exp) {
        throw new Error("Failed to decode refresh token to get expiry");
      }
      const tokenExpiresAt = new Date(decoded.exp * 1000); // JWT exp is in seconds, convert to milliseconds
      
      logger.info(`AuthService: Refresh token expiry calculated`, {
        userId: user.id,
        jwtExpiry: decoded.exp,
        expiresAt: tokenExpiresAt.toISOString(),
        expiresInDays: JWT_CONFIG.REFRESH_EXPIRES_DAYS
      });

      // Store refresh token in database (hash the token for security)
      logger.info(`AuthService: Storing refresh token in database for user: ${user.email}`);
      const hashedToken = hashString(refreshToken);
      await db.RefreshToken.create({
        userId: user.id,
        tokenHash: hashedToken, // Store hashed token for security
        ipAddress,
        userAgent,
        expiresAt: tokenExpiresAt, // Use the exact expiry from JWT token
      });
      logger.info(`AuthService: Refresh token stored in database for user: ${user.email}`);

      logger.info(`AuthService: Token generation completed for user: ${user.email}`, {
        userId: user.id,
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length
      });

      return {
        accessToken,
        refreshToken: refreshToken,
      };
    } catch (error: any) {
      logger.error(`AuthService: Token generation failed for user: ${user.email}`, {
        userId: user.id,
        error: error.message,
        stack: error.stack,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      });
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
    
    // Verify the refresh token first
    try {
      decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
      if (!decoded || typeof decoded !== 'object') {
        throw new Error("Invalid refresh token");
      }
      
      // Check if token is expired (additional check)
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

    // Extract user info from decoded token
    const { id: userId, email } = decoded;
    if (!userId || !email) {
      logger.error("Invalid refresh token payload:", decoded);
      throw new Error("Invalid refresh token");
    }

    // Find refresh token in database (compare hashed token)
    logger.info("Looking for refresh token in database", { 
      tokenLength: refreshToken.length,
      userId,
      email 
    });
    
    // Hash the provided token to compare with stored hash
    const hashedToken = hashString(refreshToken);
    
    // First, find all non-revoked tokens for this user
    const userTokens = await db.RefreshToken.findAll({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{ model: db.User, as: "user" }],
    });
    
    // Find the matching token using safe comparison
    let storedToken = null;
    for (const token of userTokens) {
      if (safeCompare(token.tokenHash, hashedToken)) {
        storedToken = token;
        break;
      }
    }

    if (!storedToken) {
      // Check if there are any tokens for this user to provide better error message
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

    // Verify the user still exists and is active
    if (!storedToken.user) {
      logger.error("User not found for refresh token");
      throw new Error("Invalid refresh token");
    }

    // Revoke old token
    await storedToken.update({ isRevoked: true });

    // Generate new tokens
    return this.generateTokens(storedToken.user, ipAddress, userAgent);
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    try {
      // Verify the refresh token to get user ID
      const decoded: any = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
      if (!decoded || typeof decoded !== 'object' || !decoded.id) {
        return; // Invalid token, nothing to revoke
      }

      // Hash the token to find and revoke it
      const hashedToken = hashString(refreshToken);
      
      // Find tokens for this specific user only (more efficient)
      const userTokens = await db.RefreshToken.findAll({
        where: {
          userId: decoded.id,
          isRevoked: false,
          expiresAt: { [Op.gt]: new Date() },
        },
      });
      
      // Find and revoke the matching token
      for (const token of userTokens) {
        if (safeCompare(token.tokenHash, hashedToken)) {
          await token.update({ isRevoked: true });
          break;
        }
      }
    } catch (error) {
      // If token verification fails, silently return (token is already invalid)
      logger.warn("Logout: Invalid refresh token provided", { error: error });
    }
  }

  /**
   * Check username availability
   */
  // Username logic removed in new model

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

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ passwordHash });

    // Revoke all refresh tokens to force re-login
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

    // Revoke all refresh tokens to force re-login
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

    // Check if email is being changed and is unique
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await db.User.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new Error("Email already in use");
      }
    }

    // Exclude non-user fields (e.g., avatarUrl is not stored on users table)
    const { avatarUrl, ...userFields } = updateData as any;

    // Update user
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

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ passwordHash: newPasswordHash });

    // Revoke all refresh tokens to force re-login
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

    // Store deletion reason in dedicated audit table
    try {
      await db.AccountDeletionLog.create({
        email: user.email,
        reason: trimmedReason,
      });
    } catch (error: any) {
      // If logging fails, don't block account deletion
      logger.error("Failed to persist account deletion reason", {
        error: error.message,
        stack: error.stack,
        userId: user.id,
      });
    }

    // Revoke all refresh tokens
    await db.RefreshToken.update({ isRevoked: true }, { where: { userId } });

    // Delete user
    await user.destroy();
  }
}

export default new AuthService();
