import { Sequelize, DataTypes, Model } from "sequelize";

export class User extends Model {
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare passwordHash: string;
  declare role: "user" | "admin" | "moderator";
  declare accountType: "employer" | "worker" | null;
  declare phoneNumber: string | null;
  declare isPhoneVerified: boolean;
  declare isProfileComplete: boolean;
  declare interestedTrades: string[] | null;
  declare dailyRate: number | null;
  declare currency: string;
  declare currencySymbol: string;
  declare status: "active" | "inactive" | "suspended";
  declare emailVerified: boolean;
  declare organizationId: string | null;
  declare isOnboarded: boolean;
  declare onboardingCompletedAt: Date | null;
  declare fcmTokens: string[];
  declare isActive: boolean;
  declare termsAccepted: boolean;
  declare termsAcceptedAt: Date | null;
  declare loginAttempts: number;
  declare lockedUntil: Date | null;
  declare bannedAt: Date | null;
  declare suspendedUntil: Date | null;
  declare suspensionReason: string | null;

  static associate(models: any) {
    User.hasOne(models.Profile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
    User.hasOne(models.Settings, { foreignKey: 'userId', as: 'settings', onDelete: 'CASCADE' });
    User.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }
}

export function initModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("user", "admin", "moderator"),
        allowNull: false,
        defaultValue: "user",
      },
      accountType: {
        type: DataTypes.ENUM("employer", "worker"),
        allowNull: true,
        comment: 'Whether this account hires fundis (employer) or is a fundi (worker)',
      },
      phoneNumber: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'For identity verification — never shown publicly',
      },
      isPhoneVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isProfileComplete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      interestedTrades: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Trades an employer is interested in hiring',
      },
      dailyRate: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Worker daily rate (optional, in KSh)',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
        comment: 'User currency preference (3-letter ISO-ish code, e.g. USD/KES/EUR)',
      },
      currencySymbol: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: '$',
        comment: 'Display symbol for `currency` (kept in sync with `currency`; no FX conversion).',
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "suspended"),
        allowNull: false,
        defaultValue: "active",
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      isOnboarded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      onboardingCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fcmTokens: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of FCM tokens for push notifications'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the user account is active'
      },
      termsAccepted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: 'Whether the user has accepted the Terms & Conditions and Privacy Policy'
      },
      termsAcceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the user accepted the Terms & Conditions and Privacy Policy'
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the organization the user belongs to'
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      bannedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Set when permanently banned (cannot re-register).",
      },
      suspendedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "End of a timed suspension (null = indefinite when status=suspended).",
      },
      suspensionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      timestamps: true,
      underscored: false,
    }
  );

  return User;
}
