'use strict';

/**
 * Adds RefreshTokens.rotatedAt — set only when a token is revoked by rotation
 * (not by logout/password-change/theft revocations). Used to grant a short grace
 * window so concurrent/duplicate refresh calls don't fail. See REFRESH_GRACE_MS.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('RefreshTokens', 'rotatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp set when this token was rotated (revoked + replaced) on refresh',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('RefreshTokens', 'rotatedAt');
  },
};
