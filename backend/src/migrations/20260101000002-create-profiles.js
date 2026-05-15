'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Profiles', {
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
      username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      fullName: { type: Sequelize.STRING(150), allowNull: false },
      profession: { type: Sequelize.STRING(100), allowNull: false },
      location: { type: Sequelize.STRING(150), allowNull: false },
      bio: { type: Sequelize.TEXT, allowNull: true },
      avatarUrl: { type: Sequelize.TEXT, allowNull: true },
      whatsapp: { type: Sequelize.STRING(30), allowNull: true },
      views: { type: Sequelize.INTEGER, defaultValue: 0 },
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

    await queryInterface.addIndex('Profiles', ['username'], { unique: true });
    await queryInterface.addIndex('Profiles', ['profession']);
    await queryInterface.addIndex('Profiles', ['location']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Profiles');
  },
};
