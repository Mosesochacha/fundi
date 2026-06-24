'use strict';

/**
 * Per-user currency preference. Stored as a 3-letter ISO-ish code (e.g. "USD",
 * "KES", "EUR"); defaults to "USD". The allowed set lives in src/utils/constants
 * (ALLOWED_CURRENCIES) and is enforced at the application layer.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'currency', {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      comment: 'User currency preference (3-letter ISO-ish code, e.g. USD/KES/EUR)',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'currency');
  },
};
