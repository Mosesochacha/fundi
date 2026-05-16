'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Conversations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      participant1Id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      participant2Id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      lastMessageAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('Conversations', ['participant1Id', 'participant2Id'], { unique: true });
    await queryInterface.addIndex('Conversations', ['lastMessageAt']);

    await queryInterface.createTable('Messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Conversations', key: 'id' },
        onDelete: 'CASCADE',
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      readAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('Messages', ['conversationId', 'createdAt']);
    await queryInterface.addIndex('Messages', ['senderId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Messages');
    await queryInterface.dropTable('Conversations');
  },
};
