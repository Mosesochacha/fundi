'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Profiles', 'bannerUrl', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Profiles', 'tagline', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('Profiles', 'phone', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
    await queryInterface.addColumn('Profiles', 'yearsExperience', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Profiles', 'services', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn('Profiles', 'theme', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'orange',
    });
    await queryInterface.addColumn('Profiles', 'emailProfileViewed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'emailNewFollower', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'emailPostLiked', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'emailPostComment', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'emailWeeklySummary', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'emailProductUpdates', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Profiles', 'profilePublic', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'showPhone', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'showEmail', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Profiles', 'showYearsExperience', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'showProfileViews', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'appearInSearch', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'allowComments', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'allowFollowers', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'language', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'en',
    });
    await queryInterface.addColumn('Profiles', 'country', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'KE',
    });
    await queryInterface.addColumn('Profiles', 'timezone', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'Africa/Nairobi',
    });
    await queryInterface.addColumn('Profiles', 'displayNameFormat', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'full',
    });
    await queryInterface.addColumn('Profiles', 'profileLayout', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'standard',
    });
  },

  async down(queryInterface) {
    const cols = [
      'bannerUrl', 'tagline', 'phone', 'yearsExperience', 'services', 'theme',
      'emailProfileViewed', 'emailNewFollower', 'emailPostLiked', 'emailPostComment',
      'emailWeeklySummary', 'emailProductUpdates',
      'profilePublic', 'showPhone', 'showEmail', 'showYearsExperience', 'showProfileViews',
      'appearInSearch', 'allowComments', 'allowFollowers',
      'language', 'country', 'timezone', 'displayNameFormat', 'profileLayout',
    ];
    for (const col of cols) {
      await queryInterface.removeColumn('Profiles', col);
    }
  },
};
