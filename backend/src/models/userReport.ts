import { Sequelize, DataTypes, Model } from "sequelize";

export type ReportType =
  | "fake_profile"
  | "harassment"
  | "inappropriate_review"
  | "payment_dispute"
  | "spam"
  | "other";
export type ReportSeverity = "high" | "medium" | "low";
export type ReportStatus = "open" | "in_review" | "resolved";

export interface ReportNote {
  id: string;
  admin: string;
  at: string;
  text: string;
}

export class UserReport extends Model {
  declare id: string;
  declare type: ReportType;
  declare severity: ReportSeverity;
  declare status: ReportStatus;
  declare reportedUserId: string;
  declare filedById: string | null;
  declare description: string;
  declare evidence: string[] | null;
  declare relatedContent: string | null;
  declare resolution: string | null;
  declare resolutionAction: string | null;
  declare notes: ReportNote[] | null;
  declare resolvedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    UserReport.belongsTo(models.User, {
      foreignKey: "reportedUserId",
      as: "reportedUser",
    });
    UserReport.belongsTo(models.User, {
      foreignKey: "filedById",
      as: "filedByUser",
    });
  }
}

export function initModel(sequelize: Sequelize): typeof UserReport {
  UserReport.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      type: {
        type: DataTypes.ENUM(
          "fake_profile",
          "harassment",
          "inappropriate_review",
          "payment_dispute",
          "spam",
          "other",
        ),
        allowNull: false,
        defaultValue: "other",
      },
      severity: {
        type: DataTypes.ENUM("high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: DataTypes.ENUM("open", "in_review", "resolved"),
        allowNull: false,
        defaultValue: "open",
      },
      reportedUserId: { type: DataTypes.UUID, allowNull: false },
      filedById: { type: DataTypes.UUID, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      evidence: { type: DataTypes.JSON, allowNull: true },
      relatedContent: { type: DataTypes.STRING, allowNull: true },
      resolution: { type: DataTypes.TEXT, allowNull: true },
      resolutionAction: { type: DataTypes.STRING(40), allowNull: true },
      notes: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: "UserReport",
      tableName: "UserReports",
      timestamps: true,
    },
  );
  return UserReport;
}
