import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class Comment extends Model<
  InferAttributes<Comment>,
  InferCreationAttributes<Comment>
> {
  declare id: CreationOptional<string>;
  declare postId: string;
  declare authorId: string;
  declare content: string;
  declare parentCommentId: CreationOptional<string | null>;
  declare likesCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: any) {
    Comment.belongsTo(models.Post, { foreignKey: 'postId', as: 'post' });
    Comment.belongsTo(models.Profile, { foreignKey: 'authorId', as: 'author' });
    Comment.hasMany(models.Comment, { foreignKey: 'parentCommentId', as: 'replies' });
    Comment.belongsTo(models.Comment, { foreignKey: 'parentCommentId', as: 'parent' });
    Comment.hasMany(models.CommentLike, { foreignKey: 'commentId', as: 'commentLikes' });
  }
}

export function initModel(sequelize: Sequelize): typeof Comment {
  Comment.init(
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
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
      } as any,
      content: { type: DataTypes.TEXT, allowNull: false },
      parentCommentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Comments', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      likesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Comment',
      tableName: 'Comments',
      timestamps: true,
      indexes: [
        { fields: ['postId'] },
        { fields: ['authorId'] },
        { fields: ['createdAt'] },
      ],
    }
  );
  return Comment;
}
