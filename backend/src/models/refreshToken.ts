import { Sequelize, DataTypes, Model } from 'sequelize';

export class RefreshToken extends Model {
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare ipAddress: string;
  declare userAgent: string;
  declare isRevoked: boolean;
  declare rotatedAt: Date | null;
  declare expiresAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    RefreshToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

export function initModel(sequelize: Sequelize): typeof RefreshToken {
  RefreshToken.init(
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
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rotatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'RefreshTokens',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['isRevoked'] },
        { fields: ['expiresAt'] },
      ],
    }
  );
  return RefreshToken;
}
