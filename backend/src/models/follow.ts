import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class Follow extends Model<
  InferAttributes<Follow>,
  InferCreationAttributes<Follow>
> {
  declare id: CreationOptional<string>;
  declare followerId: string;
  declare followingId: string;
  declare createdAt: CreationOptional<Date>;

  static associate(models: any) {
    Follow.belongsTo(models.Profile, { foreignKey: 'followerId', as: 'follower' });
    Follow.belongsTo(models.Profile, { foreignKey: 'followingId', as: 'followingProfile' });
  }
}

export function initModel(sequelize: Sequelize): typeof Follow {
  Follow.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      followerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      followingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Follow',
      tableName: 'Follows',
      timestamps: false,
      indexes: [
        { fields: ['followerId', 'followingId'], unique: true, name: 'unique_follow' },
        { fields: ['followerId'] },
        { fields: ['followingId'] },
      ],
    }
  );
  return Follow;
}
