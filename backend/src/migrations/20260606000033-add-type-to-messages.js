'use strict';

/** Distinguish normal chat messages from centred system pills (e.g. "Job accepted by …"). */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `DO $$ BEGIN CREATE TYPE "enum_Messages_type" AS ENUM('text', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "Messages" ADD COLUMN IF NOT EXISTS "type" "enum_Messages_type" NOT NULL DEFAULT 'text';`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Messages', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Messages_type";');
  },
};
