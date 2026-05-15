'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LoginHistory', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      ipAddress: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('success', 'failed'),
        allowNull: false,
        defaultValue: 'success',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('LoginHistory', ['userId']);
    await queryInterface.addIndex('LoginHistory', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LoginHistory');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LoginHistory_status";');
  },
};
