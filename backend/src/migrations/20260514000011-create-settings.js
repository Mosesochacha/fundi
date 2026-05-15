'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      theme: {
        type: Sequelize.ENUM('light', 'dark', 'system'),
        allowNull: false,
        defaultValue: 'system',
      },
      language: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'en',
      },
      timezone: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'UTC',
      },
      emailNotifications: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      pushNotifications: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      smsNotifications: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      deadline: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      digest: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      highMatch: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      monthly: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      nudges: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      privacy: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      admin: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      savedCategories: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Settings');
  },
};
