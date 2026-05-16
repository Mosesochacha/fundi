import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class CommentLike extends Model<
  InferAttributes<CommentLike>,
  InferCreationAttributes<CommentLike>
> {
  declare id: CreationOptional<string>;
  declare commentId: string;
  declare profileId: string;
  declare createdAt: CreationOptional<Date>;

  static associate(models: any) {
    CommentLike.belongsTo(models.Comment, { foreignKey: 'commentId', as: 'comment' });
    CommentLike.belongsTo(models.Profile, { foreignKey: 'profileId', as: 'profile' });
  }
}

export function initModel(sequelize: Sequelize): typeof CommentLike {
  CommentLike.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Comments', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      profileId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'CommentLike',
      tableName: 'CommentLikes',
      timestamps: false,
      indexes: [
        { fields: ['commentId', 'profileId'], unique: true, name: 'unique_comment_like' },
        { fields: ['commentId'] },
        { fields: ['profileId'] },
      ],
    }
  );
  return CommentLike;
}
