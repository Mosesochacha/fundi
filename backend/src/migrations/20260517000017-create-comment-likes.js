'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CommentLikes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      commentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Comments', key: 'id' },
        onDelete: 'CASCADE',
      },
      profileId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('CommentLikes', ['commentId', 'profileId'], {
      unique: true,
      name: 'unique_comment_like',
    });
    await queryInterface.addIndex('CommentLikes', ['commentId']);
    await queryInterface.addIndex('CommentLikes', ['profileId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CommentLikes');
  },
};
