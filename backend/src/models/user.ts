// src/models/user.ts
import { Sequelize, DataTypes, Model } from "sequelize";

export class User extends Model {
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare passwordHash: string;
  declare role: "user" | "admin" | "moderator";
  declare status: "active" | "inactive" | "suspended";
  declare emailVerified: boolean;
  declare organizationId: string | null;
  declare isOnboarded: boolean;
  declare onboardingCompletedAt: Date | null;
  declare fcmTokens: string[];
  declare isActive: boolean;
  declare termsAccepted: boolean;
  declare termsAcceptedAt: Date | null;
  declare ageConfirmed: boolean;
  declare ageConfirmedAt: Date | null;

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
      ageConfirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: 'Whether the user has confirmed they are 18+'
      },
      ageConfirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the user confirmed their age'
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the organization the user belongs to'
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
