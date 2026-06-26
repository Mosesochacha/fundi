"use strict";

/** Completed-job payments ledger (employer → platform → worker). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      reference: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      employerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      workerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      jobId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "JobRequests", key: "id" },
        onDelete: "SET NULL",
      },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      fee: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: "KES" },
      method: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "M-Pesa" },
      status: {
        type: Sequelize.ENUM("completed", "pending", "refunded", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
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

    await queryInterface.addIndex("Payments", ["status"]);
    await queryInterface.addIndex("Payments", ["employerId"]);
    await queryInterface.addIndex("Payments", ["workerId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Payments");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Payments_status";',
    );
  },
};
