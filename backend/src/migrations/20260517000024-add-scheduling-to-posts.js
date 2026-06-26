'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Posts', 'status', {
      type: Sequelize.ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED'),
      allowNull: false,
      defaultValue: 'PUBLISHED',
    });
    await queryInterface.addColumn('Posts', 'scheduledAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      `UPDATE "Posts" SET status = 'PUBLISHED' WHERE status IS NULL`
    );
    await queryInterface.addIndex('Posts', ['status']);
    await queryInterface.addIndex('Posts', ['scheduledAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Posts', ['scheduledAt']);
    await queryInterface.removeIndex('Posts', ['status']);
    await queryInterface.removeColumn('Posts', 'scheduledAt');
    await queryInterface.removeColumn('Posts', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Posts_status"');
  },
};
