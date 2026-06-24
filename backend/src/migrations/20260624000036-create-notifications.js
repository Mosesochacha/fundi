'use strict';

/**
 * In-app notifications. One row per notification, addressed to a User (not a
 * Profile) so the bell works regardless of role. `type` drives the icon/copy,
 * `link` is where clicking navigates, and `data` carries any extra context
 * (actor name, conversation/job ids) the dropdown needs to render.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        comment: 'Recipient User id (the bell owner).',
      },
      type: {
        type: Sequelize.STRING(40),
        allowNull: false,
        comment: 'new_message | new_request | job_accepted | … — drives copy/icon.',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      link: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Relative app path the notification deep-links to.',
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Extra render context (actorName, conversationId, jobId …).',
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Newest-first listing per user, and a cheap unread count.
    await queryInterface.addIndex('Notifications', ['userId', 'createdAt']);
    await queryInterface.addIndex('Notifications', ['userId', 'readAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Notifications');
  },
};
