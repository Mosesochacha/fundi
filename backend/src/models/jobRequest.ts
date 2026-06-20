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
  declare scheduledEndAt: CreationOptional<Date | null>;
  declare status: CreationOptional<JobRequestStatus>;
  declare agreedRate: CreationOptional<number | null>;
  declare estimatedDuration: CreationOptional<string | null>;
  declare tags: CreationOptional<string[] | null>;
  declare completedAt: CreationOptional<Date | null>;
  declare reviewRating: CreationOptional<number | null>;
  declare reviewText: CreationOptional<string | null>;
  declare reviewedAt: CreationOptional<Date | null>;
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
      scheduledEndAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      agreedRate: { type: DataTypes.INTEGER, allowNull: true },
      estimatedDuration: { type: DataTypes.STRING, allowNull: true },
      tags: { type: DataTypes.JSON, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      reviewRating: { type: DataTypes.INTEGER, allowNull: true },
      reviewText: { type: DataTypes.TEXT, allowNull: true },
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
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
