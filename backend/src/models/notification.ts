import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare type: string;
  declare title: string;
  declare body: CreationOptional<string | null>;
  declare link: CreationOptional<string | null>;
  declare data: CreationOptional<Record<string, unknown> | null>;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: any) {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

export function initModel(sequelize: Sequelize): typeof Notification {
  Notification.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      type: { type: DataTypes.STRING(40), allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      link: { type: DataTypes.STRING, allowNull: true },
      data: { type: DataTypes.JSON, allowNull: true },
      readAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'Notifications',
      timestamps: true,
      indexes: [
        { fields: ['userId', 'createdAt'] },
        { fields: ['userId', 'readAt'] },
      ],
    }
  );
  return Notification;
}
