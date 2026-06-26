import { Sequelize, DataTypes, Model } from "sequelize";

/** Singleton row (id = SINGLETON_ID) holding platform-wide settings. */
export const SINGLETON_ID = "00000000-0000-4000-8000-000000000001";

export interface GeneralSettings {
  platformName: string;
  supportEmail: string;
  contactPhone: string;
  launchDate: string;
  maintenanceMode: boolean;
  registrationsOpen: boolean;
}
export interface CommissionSettings {
  transactionFeePct: number;
  workerSubscription: number;
  featuredListing: number;
}
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}
export interface VerificationSettings {
  requireId: boolean;
  requirePhone: boolean;
  minProfileStrength: number;
}

export class PlatformSetting extends Model {
  declare id: string;
  declare general: GeneralSettings;
  declare commission: CommissionSettings;
  declare notifications: NotificationSettings;
  declare verification: VerificationSettings;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initModel(sequelize: Sequelize): typeof PlatformSetting {
  PlatformSetting.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: SINGLETON_ID },
      general: { type: DataTypes.JSON, allowNull: false },
      commission: { type: DataTypes.JSON, allowNull: false },
      notifications: { type: DataTypes.JSON, allowNull: false },
      verification: { type: DataTypes.JSON, allowNull: false },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: "PlatformSetting",
      tableName: "PlatformSettings",
      timestamps: true,
    },
  );
  return PlatformSetting;
}
