import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export class Profile extends Model<
  InferAttributes<Profile>,
  InferCreationAttributes<Profile>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare username: string;
  declare fullName: string;
  declare profession: string;
  declare location: string;
  declare bio: CreationOptional<string | null>;
  declare avatarUrl: CreationOptional<string | null>;
  declare bannerUrl: CreationOptional<string | null>;
  declare tagline: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare yearsExperience: CreationOptional<number | null>;
  declare services: CreationOptional<string[] | null>;
  declare theme: CreationOptional<string>;
  declare whatsapp: CreationOptional<string | null>;
  declare views: CreationOptional<number>;
  declare workPhotos: CreationOptional<string[] | null>;
  declare education: CreationOptional<object[] | null>;
  declare experience: CreationOptional<object[] | null>;
  declare portfolio: CreationOptional<object[] | null>;
  declare certifications: CreationOptional<object[] | null>;
  declare serviceAreas: CreationOptional<string[] | null>;
  declare isAvailable: CreationOptional<boolean>;
  // Notification preferences
  declare emailProfileViewed: CreationOptional<boolean>;
  declare emailNewFollower: CreationOptional<boolean>;
  declare emailPostLiked: CreationOptional<boolean>;
  declare emailPostComment: CreationOptional<boolean>;
  declare emailWeeklySummary: CreationOptional<boolean>;
  declare emailProductUpdates: CreationOptional<boolean>;
  // Privacy settings
  declare profilePublic: CreationOptional<boolean>;
  declare showPhone: CreationOptional<boolean>;
  declare showEmail: CreationOptional<boolean>;
  declare showYearsExperience: CreationOptional<boolean>;
  declare showProfileViews: CreationOptional<boolean>;
  declare appearInSearch: CreationOptional<boolean>;
  declare allowComments: CreationOptional<boolean>;
  declare allowFollowers: CreationOptional<boolean>;
  // Preferences
  declare language: CreationOptional<string>;
  declare country: CreationOptional<string>;
  declare timezone: CreationOptional<string>;
  declare displayNameFormat: CreationOptional<string>;
  declare profileLayout: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: any) {
    Profile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Profile.hasMany(models.Post, { foreignKey: 'authorId', as: 'posts' });
    Profile.hasMany(models.PostLike, { foreignKey: 'profileId', as: 'postLikes' });
    Profile.hasMany(models.Comment, { foreignKey: 'authorId', as: 'comments' });
    Profile.hasMany(models.Follow, { foreignKey: 'followerId', as: 'following' });
    Profile.hasMany(models.Follow, { foreignKey: 'followingId', as: 'followers' });
  }
}

export function initModel(sequelize: Sequelize): typeof Profile {
  Profile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      } as any,
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      fullName: { type: DataTypes.STRING(150), allowNull: false },
      profession: { type: DataTypes.STRING(100), allowNull: false },
      location: { type: DataTypes.STRING(150), allowNull: false },
      bio: { type: DataTypes.TEXT, allowNull: true },
      avatarUrl: { type: DataTypes.TEXT, allowNull: true },
      bannerUrl: { type: DataTypes.TEXT, allowNull: true },
      tagline: { type: DataTypes.STRING(100), allowNull: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      yearsExperience: { type: DataTypes.INTEGER, allowNull: true },
      services: { type: DataTypes.JSON, allowNull: true },
      theme: { type: DataTypes.STRING(20), defaultValue: 'orange' },
      whatsapp: { type: DataTypes.STRING(30), allowNull: true },
      views: { type: DataTypes.INTEGER, defaultValue: 0 },
      workPhotos: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      education:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      experience: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      portfolio:  { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      certifications: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      serviceAreas: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      // Notification preferences
      emailProfileViewed: { type: DataTypes.BOOLEAN, defaultValue: true },
      emailNewFollower: { type: DataTypes.BOOLEAN, defaultValue: true },
      emailPostLiked: { type: DataTypes.BOOLEAN, defaultValue: true },
      emailPostComment: { type: DataTypes.BOOLEAN, defaultValue: true },
      emailWeeklySummary: { type: DataTypes.BOOLEAN, defaultValue: true },
      emailProductUpdates: { type: DataTypes.BOOLEAN, defaultValue: false },
      // Privacy settings
      profilePublic: { type: DataTypes.BOOLEAN, defaultValue: true },
      showPhone: { type: DataTypes.BOOLEAN, defaultValue: true },
      showEmail: { type: DataTypes.BOOLEAN, defaultValue: false },
      showYearsExperience: { type: DataTypes.BOOLEAN, defaultValue: true },
      showProfileViews: { type: DataTypes.BOOLEAN, defaultValue: true },
      appearInSearch: { type: DataTypes.BOOLEAN, defaultValue: true },
      allowComments: { type: DataTypes.BOOLEAN, defaultValue: true },
      allowFollowers: { type: DataTypes.BOOLEAN, defaultValue: true },
      // Preferences
      language: { type: DataTypes.STRING(10), defaultValue: 'en' },
      country: { type: DataTypes.STRING(10), defaultValue: 'KE' },
      timezone: { type: DataTypes.STRING(50), defaultValue: 'Africa/Nairobi' },
      displayNameFormat: { type: DataTypes.STRING(20), defaultValue: 'full' },
      profileLayout: { type: DataTypes.STRING(20), defaultValue: 'standard' },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Profile',
      tableName: 'Profiles',
      timestamps: true,
      indexes: [
        { fields: ['username'], unique: true },
        { fields: ['profession'] },
        { fields: ['location'] },
      ],
    }
  );
  return Profile;
}
