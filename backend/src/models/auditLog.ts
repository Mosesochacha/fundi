import { Sequelize, DataTypes, Model } from "sequelize";

export class AuditLog extends Model {
  declare id: string;
  declare adminId: string | null;
  declare action: string;
  declare resourceType: string;
  declare resourceId: string | null;
  declare changes: Record<string, unknown> | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    AuditLog.belongsTo(models.User, { foreignKey: "adminId", as: "admin" });
  }
}

export function initModel(sequelize: Sequelize): typeof AuditLog {
  AuditLog.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      adminId: { type: DataTypes.UUID, allowNull: true },
      action: { type: DataTypes.STRING(80), allowNull: false },
      resourceType: { type: DataTypes.STRING(40), allowNull: false },
      resourceId: { type: DataTypes.STRING, allowNull: true },
      changes: { type: DataTypes.JSON, allowNull: true },
      ipAddress: { type: DataTypes.STRING(64), allowNull: true },
      userAgent: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: "AuditLog", tableName: "AuditLogs", timestamps: true },
  );
  return AuditLog;
}
