'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Comments', 'parentCommentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Comments', key: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addColumn('Comments', 'likesCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addIndex('Comments', ['parentCommentId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Comments', ['parentCommentId']);
    await queryInterface.removeColumn('Comments', 'parentCommentId');
    await queryInterface.removeColumn('Comments', 'likesCount');
  },
};
