'use strict';

function generateSlug(content, id) {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join('-');
  const prefix = id.split('-')[0];
  return `${words}-${prefix}`;
}

module.exports = {
  async up(queryInterface) {
    const [posts] = await queryInterface.sequelize.query(
      `SELECT id, content FROM "Posts" WHERE slug IS NULL`
    );

    for (const post of posts) {
      const slug = generateSlug(post.content, post.id);
      await queryInterface.sequelize.query(
        `UPDATE "Posts" SET slug = :slug WHERE id = :id`,
        { replacements: { slug, id: post.id } }
      );
    }
  },

  async down() {
  },
};
