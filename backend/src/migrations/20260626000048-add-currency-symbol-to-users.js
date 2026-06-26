"use strict";

/** Display symbol for the user's currency (e.g. "KSh"). Paired with `currency`. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "currencySymbol", {
      type: Sequelize.STRING(8),
      allowNull: false,
      defaultValue: "KSh",
      comment: "Display symbol for `currency` (no FX conversion).",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "currencySymbol");
  },
};
