import { Sequelize, DataTypes, Model } from "sequelize";

export type PaymentStatus = "completed" | "pending" | "refunded" | "failed";

export class Payment extends Model {
  declare id: string;
  declare reference: string;
  declare employerId: string | null;
  declare workerId: string | null;
  declare jobId: string | null;
  declare amount: number;
  declare fee: number;
  declare currency: string;
  declare method: string;
  declare status: PaymentStatus;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    Payment.belongsTo(models.User, { foreignKey: "employerId", as: "employerUser" });
    Payment.belongsTo(models.User, { foreignKey: "workerId", as: "workerUser" });
    Payment.belongsTo(models.JobRequest, { foreignKey: "jobId", as: "job" });
  }
}

export function initModel(sequelize: Sequelize): typeof Payment {
  Payment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      reference: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      employerId: { type: DataTypes.UUID, allowNull: true },
      workerId: { type: DataTypes.UUID, allowNull: true },
      jobId: { type: DataTypes.UUID, allowNull: true },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      fee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "KES" },
      method: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "M-Pesa" },
      status: {
        type: DataTypes.ENUM("completed", "pending", "refunded", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: "Payment", tableName: "Payments", timestamps: true },
  );
  return Payment;
}
