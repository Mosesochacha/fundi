'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('Profiles');
    if (!tableDesc.workPhotos) {
      await queryInterface.addColumn('Profiles', 'workPhotos', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Profiles', 'workPhotos');
  },
};
