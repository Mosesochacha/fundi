'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Profiles', ['profession', 'location'], {
      name: 'profiles_profession_location_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Profiles', 'profiles_profession_location_idx');
  },
};
