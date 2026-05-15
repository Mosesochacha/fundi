import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class PostLike extends Model<
  InferAttributes<PostLike>,
  InferCreationAttributes<PostLike>
> {
  declare id: CreationOptional<string>;
  declare postId: string;
  declare profileId: string;
  declare createdAt: CreationOptional<Date>;

  static associate(models: any) {
    PostLike.belongsTo(models.Post, { foreignKey: 'postId', as: 'post' });
    PostLike.belongsTo(models.Profile, { foreignKey: 'profileId', as: 'profile' });
  }
}

export function initModel(sequelize: Sequelize): typeof PostLike {
  PostLike.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      postId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Posts', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      profileId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
      } as any,
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'PostLike',
      tableName: 'PostLikes',
      timestamps: false,
      indexes: [
        { fields: ['postId', 'profileId'], unique: true, name: 'unique_post_like' },
        { fields: ['postId'] },
        { fields: ['profileId'] },
      ],
    }
  );
  return PostLike;
}
