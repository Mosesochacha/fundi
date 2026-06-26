"use strict";

/** Singleton table holding platform-wide settings as JSON groups. */
const SINGLETON_ID = "00000000-0000-4000-8000-000000000001";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PlatformSettings", {
      id: { type: Sequelize.UUID, primaryKey: true },
      general: { type: Sequelize.JSON, allowNull: false },
      commission: { type: Sequelize.JSON, allowNull: false },
      notifications: { type: Sequelize.JSON, allowNull: false },
      verification: { type: Sequelize.JSON, allowNull: false },
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

    const now = new Date();
    await queryInterface.bulkInsert("PlatformSettings", [
      {
        id: SINGLETON_ID,
        general: JSON.stringify({
          platformName: "Tesilix",
          supportEmail: "support@tesilix.com",
          contactPhone: "+254 700 000 000",
          launchDate: "2026-01-15",
          maintenanceMode: false,
          registrationsOpen: true,
        }),
        commission: JSON.stringify({
          transactionFeePct: 10,
          workerSubscription: 0,
          featuredListing: 1500,
        }),
        notifications: JSON.stringify({ email: true, push: true, sms: false }),
        verification: JSON.stringify({
          requireId: true,
          requirePhone: true,
          minProfileStrength: 60,
        }),
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("PlatformSettings");
  },
};

module.exports.SINGLETON_ID = SINGLETON_ID;
