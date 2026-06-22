'use strict';

/**
 * Signup redesign: capture employer/worker account type + related fields,
 * and remove the age-verification columns.
 *
 * NOTE: `role` (user/admin/moderator) is left untouched — it governs
 * privilege/moderation. The new employer-vs-worker distinction lives in
 * `accountType`.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // NOTE: Sequelize v6's addColumn() emits malformed SQL for native ENUM
    // columns (the CREATE TYPE DO-block and ALTER TABLE get concatenated with a
    // stray quote). Create the type + column explicitly to avoid that bug.
    await queryInterface.sequelize.query(
      `DO $$ BEGIN CREATE TYPE "enum_Users_accountType" AS ENUM('employer', 'worker'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "accountType" "enum_Users_accountType";`
    );
    await queryInterface.sequelize.query(
      `COMMENT ON COLUMN "Users"."accountType" IS 'Whether this account hires fundis (employer) or is a fundi (worker)';`
    );
    await queryInterface.addColumn('Users', 'phoneNumber', {
      type: Sequelize.STRING(30),
      allowNull: true,
      comment: 'For identity verification — never shown publicly',
    });
    await queryInterface.addColumn('Users', 'isPhoneVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Users', 'isProfileComplete', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('Users', 'interestedTrades', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Trades an employer is interested in hiring',
    });
    await queryInterface.addColumn('Users', 'dailyRate', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Worker daily rate (optional, in KSh)',
    });

    // Remove age-verification fields entirely.
    await queryInterface.removeColumn('Users', 'ageConfirmed');
    await queryInterface.removeColumn('Users', 'ageConfirmedAt');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'ageConfirmed', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn('Users', 'ageConfirmedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.removeColumn('Users', 'dailyRate');
    await queryInterface.removeColumn('Users', 'interestedTrades');
    await queryInterface.removeColumn('Users', 'isProfileComplete');
    await queryInterface.removeColumn('Users', 'isPhoneVerified');
    await queryInterface.removeColumn('Users', 'phoneNumber');
    await queryInterface.removeColumn('Users', 'accountType');
    // Drop the ENUM type created for accountType (Postgres).
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_accountType";');
  },
};
