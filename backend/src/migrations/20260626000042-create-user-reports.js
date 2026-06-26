"use strict";

/** User-vs-user moderation reports (distinct from support Tickets). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("UserReports", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM(
          "fake_profile",
          "harassment",
          "inappropriate_review",
          "payment_dispute",
          "spam",
          "other",
        ),
        allowNull: false,
        defaultValue: "other",
      },
      severity: {
        type: Sequelize.ENUM("high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: Sequelize.ENUM("open", "in_review", "resolved"),
        allowNull: false,
        defaultValue: "open",
      },
      reportedUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      filedById: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      description: { type: Sequelize.TEXT, allowNull: false },
      evidence: { type: Sequelize.JSON, allowNull: true, comment: "Array of evidence URLs." },
      relatedContent: { type: Sequelize.STRING, allowNull: true },
      resolution: { type: Sequelize.TEXT, allowNull: true },
      resolutionAction: {
        type: Sequelize.STRING(40),
        allowNull: true,
        comment: "none | warning | content_removed | suspended_7 | suspended_30 | banned",
      },
      notes: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: "Array of { id, admin, at, text } internal investigation notes.",
      },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex("UserReports", ["status"]);
    await queryInterface.addIndex("UserReports", ["severity"]);
    await queryInterface.addIndex("UserReports", ["reportedUserId"]);
    await queryInterface.addIndex("UserReports", ["filedById"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("UserReports");
    // Drop the ENUM types Postgres leaves behind.
    const q = queryInterface.sequelize;
    await q.query('DROP TYPE IF EXISTS "enum_UserReports_type";');
    await q.query('DROP TYPE IF EXISTS "enum_UserReports_severity";');
    await q.query('DROP TYPE IF EXISTS "enum_UserReports_status";');
  },
};
