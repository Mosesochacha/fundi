'use strict';

/**
 * `currencySymbol` was never set at registration (and its column default was
 * 'KSh' while `currency` defaults to 'USD'), so most users' symbol did not
 * match their currency. Realign the column default and backfill every row's
 * symbol from its stored currency code.
 */
const SYMBOL_BY_CODE = {
  USD: '$', EUR: '€', GBP: '£', KES: 'KSh', NGN: '₦', GHS: 'GH₵',
  ZAR: 'R', UGX: 'USh', TZS: 'TSh', INR: '₹', AED: 'AED', CAD: 'CA$',
  AUD: 'A$', ETB: 'Br', RWF: 'Fr',
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'currencySymbol', {
      type: Sequelize.STRING(8),
      allowNull: false,
      defaultValue: '$',
    });
    for (const [code, symbol] of Object.entries(SYMBOL_BY_CODE)) {
      await queryInterface.sequelize.query(
        'UPDATE "Users" SET "currencySymbol" = :symbol WHERE UPPER("currency") = :code',
        { replacements: { symbol, code } },
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Only revert the schema default; backfilled data is left as-is.
    await queryInterface.changeColumn('Users', 'currencySymbol', {
      type: Sequelize.STRING(8),
      allowNull: false,
      defaultValue: 'KSh',
    });
  },
};
