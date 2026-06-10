'use strict';

/** Link a conversation to a job request (nullable; SET NULL if the job is removed). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Conversations', 'linkedJobId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'JobRequests', key: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Conversations', 'linkedJobId');
  },
};
