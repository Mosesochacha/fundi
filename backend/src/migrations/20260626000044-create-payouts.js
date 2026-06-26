"use strict";

/** Worker withdrawal requests. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payouts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      reference: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      workerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: "KES" },
      method: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "M-Pesa" },
      destination: { type: Sequelize.STRING(80), allowNull: true },
      status: {
        type: Sequelize.ENUM("pending", "processing", "paid", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      processedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex("Payouts", ["status"]);
    await queryInterface.addIndex("Payouts", ["workerId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Payouts");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Payouts_status";',
    );
  },
};
