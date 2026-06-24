'use strict';

/**
 * Track when the "24 hours before a scheduled job" reminder was sent, so the
 * reminder cron only fires once per job.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('JobRequests', 'reminderSentAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the 24h-before reminder notification was sent (dedupe).',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('JobRequests', 'reminderSentAt');
  },
};
