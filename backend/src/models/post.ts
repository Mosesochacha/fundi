import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export type PostType = 'SHOWCASE' | 'TIP' | 'QUESTION' | 'HIRING';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';

export class Post extends Model<
  InferAttributes<Post>,
  InferCreationAttributes<Post>
> {
  declare id: CreationOptional<string>;
  declare authorId: string;
  declare content: string;
  declare postType: PostType;
  declare images: CreationOptional<string[]>;
  declare likesCount: CreationOptional<number>;
  declare commentsCount: CreationOptional<number>;
  declare slug: CreationOptional<string | null>;
  declare status: CreationOptional<PostStatus>;
  declare scheduledAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: any) {
    Post.belongsTo(models.Profile, { foreignKey: 'authorId', as: 'author' });
    Post.hasMany(models.PostLike, { foreignKey: 'postId', as: 'likes' });
    Post.hasMany(models.Comment, { foreignKey: 'postId', as: 'comments' });
  }
}

export function initModel(sequelize: Sequelize): typeof Post {
  Post.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
      } as any,
      content: { type: DataTypes.TEXT, allowNull: false },
      postType: {
        type: DataTypes.ENUM('SHOWCASE', 'TIP', 'QUESTION', 'HIRING'),
        allowNull: false,
        defaultValue: 'SHOWCASE',
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      likesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      commentsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      slug: { type: DataTypes.STRING(300), allowNull: true, unique: true },
      status: {
        type: DataTypes.ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED'),
        allowNull: false,
        defaultValue: 'PUBLISHED',
      },
      scheduledAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Post',
      tableName: 'Posts',
      timestamps: true,
      indexes: [
        { fields: ['authorId'] },
        { fields: ['postType'] },
        { fields: ['createdAt'] },
      ],
    }
  );
  return Post;
}
