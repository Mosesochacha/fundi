'use strict';

/** Adds image/file attachment support to chat messages. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Messages', 'attachmentUrl', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Messages', 'attachmentType', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Messages', 'attachmentType');
    await queryInterface.removeColumn('Messages', 'attachmentUrl');
  },
};
