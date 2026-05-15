import { Sequelize, DataTypes, Model } from 'sequelize';

export class PasswordResetToken extends Model {
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare isUsed: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    PasswordResetToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

export function initModel(sequelize: Sequelize): typeof PasswordResetToken {
  PasswordResetToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'PasswordResetToken',
      tableName: 'PasswordResetTokens',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['expiresAt'] },
      ],
    }
  );
  return PasswordResetToken;
}
