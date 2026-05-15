import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class LoginHistory extends Model<
  InferAttributes<LoginHistory>,
  InferCreationAttributes<LoginHistory>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare ipAddress: CreationOptional<string | null>;
  declare userAgent: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare country: CreationOptional<string | null>;
  declare status: 'success' | 'failed';
  declare createdAt: CreationOptional<Date>;

  static associate(models: any) {
    LoginHistory.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

export function initModel(sequelize: Sequelize): typeof LoginHistory {
  LoginHistory.init(
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
      ipAddress: { type: DataTypes.STRING(100), allowNull: true },
      userAgent: { type: DataTypes.STRING(500), allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: true },
      status: {
        type: DataTypes.ENUM('success', 'failed'),
        allowNull: false,
        defaultValue: 'success',
      },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'LoginHistory',
      tableName: 'LoginHistory',
      timestamps: false,
      indexes: [
        { fields: ['userId'] },
        { fields: ['createdAt'] },
      ],
    }
  );
  return LoginHistory;
}
