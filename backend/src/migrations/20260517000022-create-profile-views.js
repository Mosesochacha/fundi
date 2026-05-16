'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProfileViews', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      profileId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      ipHash: { type: Sequelize.STRING(64), allowNull: false },
      referrer: { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('ProfileViews', ['profileId', 'createdAt']);
    await queryInterface.addIndex('ProfileViews', ['profileId', 'ipHash', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ProfileViews');
  },
};
