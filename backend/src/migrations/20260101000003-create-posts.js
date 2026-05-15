'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Posts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      authorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      postType: {
        type: Sequelize.ENUM('SHOWCASE', 'TIP', 'QUESTION', 'HIRING'),
        allowNull: false,
        defaultValue: 'SHOWCASE',
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
      },
      likesCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      commentsCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('Posts', ['authorId']);
    await queryInterface.addIndex('Posts', ['postType']);
    await queryInterface.addIndex('Posts', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Posts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Posts_postType";');
  },
};
