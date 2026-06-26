import { Sequelize, DataTypes, Model } from "sequelize";

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export class Payout extends Model {
  declare id: string;
  declare reference: string;
  declare workerId: string | null;
  declare amount: number;
  declare currency: string;
  declare method: string;
  declare destination: string | null;
  declare status: PayoutStatus;
  declare processedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    Payout.belongsTo(models.User, { foreignKey: "workerId", as: "workerUser" });
  }
}

export function initModel(sequelize: Sequelize): typeof Payout {
  Payout.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      reference: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      workerId: { type: DataTypes.UUID, allowNull: true },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "KES" },
      method: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "M-Pesa" },
      destination: { type: DataTypes.STRING(80), allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "processing", "paid", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      processedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: "Payout", tableName: "Payouts", timestamps: true },
  );
  return Payout;
}
