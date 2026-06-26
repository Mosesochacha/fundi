"use strict";

/**
 * Columns the admin tools need on existing tables:
 *  - Profiles: ID-verification workflow
 *  - JobRequests: review moderation (reviews are embedded on the job)
 *  - Users: permanent ban + timed suspension metadata
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Profiles", "idVerificationStatus", {
      type: Sequelize.ENUM("unverified", "pending", "verified", "rejected"),
      allowNull: false,
      defaultValue: "unverified",
    });
    await queryInterface.addColumn("Profiles", "idDocUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Profiles", "selfieUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Profiles", "idSelfieMatch", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.addColumn("Profiles", "idRejectionReason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("Profiles", "idSubmittedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("Profiles", "idVerifiedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("JobRequests", "reviewHidden", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("JobRequests", "reviewRemoved", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("JobRequests", "reviewFlagged", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("JobRequests", "reviewFlagReason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("JobRequests", "reviewFlaggedBy", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "bannedAt", {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "Set when permanently banned (cannot re-register).",
    });
    await queryInterface.addColumn("Users", "suspendedUntil", {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "End of a timed suspension (null = indefinite when status=suspended).",
    });
    await queryInterface.addColumn("Users", "suspensionReason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    for (const col of [
      "idVerificationStatus",
      "idDocUrl",
      "selfieUrl",
      "idSelfieMatch",
      "idRejectionReason",
      "idSubmittedAt",
      "idVerifiedAt",
    ]) {
      await queryInterface.removeColumn("Profiles", col);
    }
    for (const col of [
      "reviewHidden",
      "reviewRemoved",
      "reviewFlagged",
      "reviewFlagReason",
      "reviewFlaggedBy",
    ]) {
      await queryInterface.removeColumn("JobRequests", col);
    }
    for (const col of ["bannedAt", "suspendedUntil", "suspensionReason"]) {
      await queryInterface.removeColumn("Users", col);
    }
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Profiles_idVerificationStatus";',
    );
  },
};
