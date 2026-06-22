'use strict';

/**
 * Extend JobRequests with the richer fields the worker /requests page needs:
 * an agreed rate, an estimated-duration label, free-form tags, an optional
 * end date (multi-day jobs), a completion timestamp, and the employer's
 * post-completion review.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('JobRequests', 'agreedRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Agreed pay for the job, in whole currency units.',
    });
    await queryInterface.addColumn('JobRequests', 'estimatedDuration', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Human label, e.g. "About 4 hours" or "2 days".',
    });
    await queryInterface.addColumn('JobRequests', 'tags', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Free-form tags (job type, property type, urgency …).',
    });
    await queryInterface.addColumn('JobRequests', 'scheduledEndAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'End of a multi-day job; null for single-day jobs.',
    });
    await queryInterface.addColumn('JobRequests', 'completedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('JobRequests', 'reviewRating', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Employer's 1–5 rating left on a completed job.",
    });
    await queryInterface.addColumn('JobRequests', 'reviewText', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('JobRequests', 'reviewedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('JobRequests', 'agreedRate');
    await queryInterface.removeColumn('JobRequests', 'estimatedDuration');
    await queryInterface.removeColumn('JobRequests', 'tags');
    await queryInterface.removeColumn('JobRequests', 'scheduledEndAt');
    await queryInterface.removeColumn('JobRequests', 'completedAt');
    await queryInterface.removeColumn('JobRequests', 'reviewRating');
    await queryInterface.removeColumn('JobRequests', 'reviewText');
    await queryInterface.removeColumn('JobRequests', 'reviewedAt');
  },
};
