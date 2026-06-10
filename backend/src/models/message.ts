import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
  declare id: CreationOptional<string>;
  declare conversationId: string;
  declare senderId: string;
  declare content: string;
  declare type: CreationOptional<'text' | 'system'>;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;

  static associate(models: any) {
    Message.belongsTo(models.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
    Message.belongsTo(models.Profile, { foreignKey: 'senderId', as: 'sender' });
  }
}

export function initModel(sequelize: Sequelize): typeof Message {
  Message.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Conversations', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      content: { type: DataTypes.TEXT, allowNull: false },
      type: {
        type: DataTypes.ENUM('text', 'system'),
        allowNull: false,
        defaultValue: 'text',
      },
      readAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'Messages',
      timestamps: false,
      indexes: [
        { fields: ['conversationId', 'createdAt'] },
        { fields: ['senderId'] },
      ],
    }
  );
  return Message;
}
