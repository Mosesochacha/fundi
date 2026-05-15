'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Follows', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      followerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      followingId: {
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

    await queryInterface.addIndex('Follows', ['followerId', 'followingId'], {
      unique: true,
      name: 'unique_follow',
    });
    await queryInterface.addIndex('Follows', ['followerId']);
    await queryInterface.addIndex('Follows', ['followingId']);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Follows"
      ADD CONSTRAINT check_no_self_follow
      CHECK ("followerId" != "followingId")
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Follows');
  },
};
