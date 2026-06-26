"use strict";

/** Admin action audit trail. Every mutating /api/v1/admin/* call writes one row. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("AuditLogs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      adminId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
        comment: "Admin who performed the action.",
      },
      action: {
        type: Sequelize.STRING(80),
        allowNull: false,
        comment: "e.g. user_suspended, worker_verified, report_resolved.",
      },
      resourceType: {
        type: Sequelize.STRING(40),
        allowNull: false,
        comment: "user | worker | employer | job | review | report | payout | settings",
      },
      resourceId: { type: Sequelize.STRING, allowNull: true },
      changes: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Arbitrary context / before-after values.",
      },
      ipAddress: { type: Sequelize.STRING(64), allowNull: true },
      userAgent: { type: Sequelize.STRING, allowNull: true },
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

    await queryInterface.addIndex("AuditLogs", ["adminId"]);
    await queryInterface.addIndex("AuditLogs", ["resourceType", "resourceId"]);
    await queryInterface.addIndex("AuditLogs", ["createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("AuditLogs");
  },
};
