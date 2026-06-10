import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Conversation extends Model<InferAttributes<Conversation>, InferCreationAttributes<Conversation>> {
  declare id: CreationOptional<string>;
  declare participant1Id: string;
  declare participant2Id: string;
  declare linkedJobId: CreationOptional<string | null>;
  declare lastMessageAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: any) {
    Conversation.belongsTo(models.Profile, { foreignKey: 'participant1Id', as: 'participant1' });
    Conversation.belongsTo(models.Profile, { foreignKey: 'participant2Id', as: 'participant2' });
    Conversation.belongsTo(models.JobRequest, { foreignKey: 'linkedJobId', as: 'linkedJob' });
    Conversation.hasMany(models.Message, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
  }
}

export function initModel(sequelize: Sequelize): typeof Conversation {
  Conversation.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      participant1Id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      participant2Id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      linkedJobId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'JobRequests', key: 'id' },
        onDelete: 'SET NULL',
      } as any,
      lastMessageAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Conversation',
      tableName: 'Conversations',
      timestamps: true,
      indexes: [
        { fields: ['participant1Id', 'participant2Id'], unique: true },
        { fields: ['lastMessageAt'] },
      ],
    }
  );
  return Conversation;
}
