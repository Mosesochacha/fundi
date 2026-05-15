import { Sequelize, DataTypes, Model } from 'sequelize';

export class AccountDeletionLog extends Model {
  declare id: string;
  declare email: string;
  declare reason: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initModel(sequelize: Sequelize): typeof AccountDeletionLog {
  AccountDeletionLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'AccountDeletionLog',
      tableName: 'AccountDeletionLogs',
      timestamps: true,
    }
  );
  return AccountDeletionLog;
}
