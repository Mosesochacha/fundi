'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Posts', 'slug', {
      type: Sequelize.STRING(300),
      allowNull: true,
    });

    await queryInterface.addIndex('Posts', ['slug'], {
      unique: true,
      name: 'unique_post_slug',
      where: { slug: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Posts', 'unique_post_slug');
    await queryInterface.removeColumn('Posts', 'slug');
  },
};
