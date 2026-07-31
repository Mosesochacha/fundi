'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex('Users', ['lastLoginAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Users', ['lastLoginAt']);
    await queryInterface.removeColumn('Users', 'lastLoginAt');
  },
};
