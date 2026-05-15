const { Sequelize } = require('sequelize');
require('dotenv').config();

const db_url = process.env.DATABASE_URL;
console.log('Connecting to:', db_url.substring(0, 50) + '...');

const sequelize = new Sequelize(db_url, {
  dialect: 'postgres',
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  logging: console.log,
});

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const queryInterface = sequelize.getQueryInterface();

    // Create sequelize_meta table if it doesn't exist
    await queryInterface.createTable('sequelize_meta', {
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      }
    }).catch(() => console.log('sequelize_meta table already exists'));

    console.log('Running migrations...');

    // Get list of migration files
    const fs = require('fs');
    const path = require('path');
    const migrationDir = path.join(__dirname, 'src/migrations');
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.js')).sort();

    for (const file of files) {
      const migrationPath = path.join(migrationDir, file);
      const migration = require(migrationPath);

      // Check if already run
      const ran = await sequelize.query(
        `SELECT COUNT(*) as count FROM sequelize_meta WHERE name = ?`,
        { replacements: [file], type: Sequelize.QueryTypes.SELECT }
      );

      if (ran[0].count === 0) {
        console.log(`Running migration: ${file}`);
        await migration.up(queryInterface, Sequelize.DataTypes);
        await sequelize.query(
          `INSERT INTO sequelize_meta (name) VALUES (?)`,
          { replacements: [file] }
        );
        console.log(`✓ ${file} completed`);
      } else {
        console.log(`Skipping ${file} (already ran)`);
      }
    }

    console.log('✓ All migrations completed');
    await sequelize.close();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
