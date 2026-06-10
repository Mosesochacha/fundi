import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export type JobRequestStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export class JobRequest extends Model<InferAttributes<JobRequest>, InferCreationAttributes<JobRequest>> {
  declare id: CreationOptional<string>;
  declare employerId: string;
  declare workerId: string;
  declare title: string;
  declare location: string;
  declare description: CreationOptional<string | null>;
  declare scheduledAt: CreationOptional<Date | null>;
  declare status: CreationOptional<JobRequestStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: any) {
    JobRequest.belongsTo(models.Profile, { foreignKey: 'employerId', as: 'employer' });
    JobRequest.belongsTo(models.Profile, { foreignKey: 'workerId', as: 'worker' });
    JobRequest.hasMany(models.Conversation, { foreignKey: 'linkedJobId', as: 'conversations' });
  }
}

export function initModel(sequelize: Sequelize): typeof JobRequest {
  JobRequest.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      employerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      workerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      title: { type: DataTypes.STRING, allowNull: false },
      location: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      scheduledAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'JobRequest',
      tableName: 'JobRequests',
      timestamps: true,
      indexes: [{ fields: ['employerId'] }, { fields: ['workerId'] }, { fields: ['status'] }],
    }
  );
  return JobRequest;
}
