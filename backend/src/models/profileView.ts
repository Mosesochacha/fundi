import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class ProfileView extends Model<InferAttributes<ProfileView>, InferCreationAttributes<ProfileView>> {
  declare id: CreationOptional<string>;
  declare profileId: string;
  declare ipHash: string;
  declare referrer: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;

  static associate(models: any) {
    ProfileView.belongsTo(models.Profile, { foreignKey: 'profileId', as: 'profile', onDelete: 'CASCADE' });
  }
}

export function initModel(sequelize: Sequelize): typeof ProfileView {
  ProfileView.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      profileId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      ipHash: { type: DataTypes.STRING(64), allowNull: false },
      referrer: { type: DataTypes.STRING(50), allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'ProfileView',
      tableName: 'ProfileViews',
      timestamps: false,
      indexes: [
        { fields: ['profileId', 'createdAt'] },
        { fields: ['profileId', 'ipHash', 'createdAt'] },
      ],
    }
  );
  return ProfileView;
}
