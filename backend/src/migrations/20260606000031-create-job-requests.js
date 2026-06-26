'use strict';

/**
 * Minimal job-request subsystem. A JobRequest links an employer to a worker and
 * powers the job-context banner shown inside the linked conversation.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_JobRequests_status";');

    await queryInterface.createTable('JobRequests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      workerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      location: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      scheduledAt: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('JobRequests', ['employerId']);
    await queryInterface.addIndex('JobRequests', ['workerId']);
    await queryInterface.addIndex('JobRequests', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('JobRequests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_JobRequests_status";');
  },
};
