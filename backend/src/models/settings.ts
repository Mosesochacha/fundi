import { Sequelize, DataTypes, Model } from 'sequelize';

export class Settings extends Model {
  declare id: string;
  declare userId: string;
  
  declare theme: 'light' | 'dark' | 'system';
  declare language: string;
  declare timezone: string;
  
  declare emailNotifications: {
    applicationUpdates: boolean;
    dailyDigest: boolean;
    deadlineReminders: boolean;
    platformUpdates: boolean;
    weeklyDigest: boolean;
    socialUpdates: boolean;
    newsletterSubscription: boolean;
    featureEducationEmails: boolean;
  };
  
  declare pushNotifications: {
    applicationUpdates: boolean;
    dailyDigest: boolean;
    deadlineReminders: boolean;
    platformUpdates: boolean;
    weeklyDigest: boolean;
    socialUpdates: boolean;
    featureEducationEmails: boolean;
  };
  
  declare smsNotifications: {
    applicationUpdates: boolean;
    dailyDigest: boolean;
    deadlineReminders: boolean;
    platformUpdates: boolean;
    weeklyDigest: boolean;
    socialUpdates: boolean;
  };
  
  declare deadline: {
    enabled: boolean;
    days: number[];
  };
  
  declare digest: {
    enabled: boolean;
    daily: boolean;
    weekly: boolean;
    hour: number;
    weekday: number;
  };
  
  declare highMatch: {
    enabled: boolean;
    threshold: number;
    weeklyCap: number;
  };
  
  declare monthly: {
    enabled: boolean;
  };
  
  declare nudges: {
    enabled: boolean;
    days: number[];
  };
  
  declare privacy: {
    profileVisibility: 'public' | 'private' | 'friends' | 'members';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    showBirthday: boolean;
    allowSearchEngines: boolean;
    allowDataSharing: boolean;
  };
  
  declare admin: {
    enabled: boolean;
  };
  
  declare savedCategories: string[];
  static associate(models: any) {
    Settings.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

export function initModel(sequelize: Sequelize): typeof Settings {
  Settings.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      
      theme: { 
        type: DataTypes.ENUM('light', 'dark', 'system'), 
        allowNull: false, 
        defaultValue: 'system' 
      },
      language: { 
        type: DataTypes.STRING(16), 
        allowNull: false, 
        defaultValue: 'en' 
      },
      timezone: { 
        type: DataTypes.STRING(64), 
        allowNull: false, 
        defaultValue: 'UTC' 
      },
      
      emailNotifications: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          applicationUpdates: true,
          dailyDigest: true,
          deadlineReminders: true,
          platformUpdates: true,
          weeklyDigest: true,
          socialUpdates: true,
          newsletterSubscription: true,
          featureEducationEmails: true
        }
      },
      
      pushNotifications: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          applicationUpdates: true,
          dailyDigest: true,
          deadlineReminders: true,
          platformUpdates: true,
          weeklyDigest: true,
          socialUpdates: true,
          featureEducationEmails: true
        }
      },
      
      smsNotifications: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          applicationUpdates: true,
          dailyDigest: true,
          deadlineReminders: true,
          platformUpdates: true,
          weeklyDigest: true,
          socialUpdates: true
        }
      },
      
      deadline: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          enabled: true,
          days: [2, 1]
        }
      },
      
      digest: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          enabled: true,
          daily: true,
          weekly: true,
          hour: 9,
          weekday: 1
        }
      },
      
      highMatch: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          enabled: true,
          threshold: 0.9,
          weeklyCap: 2
        }
      },
      
      monthly: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          enabled: true
        }
      },
      
      nudges: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          enabled: true,
          days: [2, 1]
        }
      },
      
      privacy: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLocation: true,
          showBirthday: false,
          allowSearchEngines: false,
          allowDataSharing: false
        }
      },
      
      admin: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          enabled: false
        }
      },
      
      savedCategories: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      }
    },
    {
      sequelize,
      modelName: 'Settings',
      tableName: 'Settings',
      timestamps: true,
    }
  );
  return Settings;
}
