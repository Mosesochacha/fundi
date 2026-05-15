// backend/sequelize.config.js
require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';

// Register ts-node for dev
if (!isProduction) {
  try {
    require('ts-node/register');
    require('tsconfig-paths/register');
  } catch (e) {
    // Ignore if not available
  }
}

const config = isProduction
  ? require('./dist/config/sequelize').default
  : require('./src/config/sequelize').default;

// Cloud databases (Neon, Heroku, etc.) require SSL with rejectUnauthorized: false
const databaseUrl = process.env.DATABASE_URL || '';
const isLocalDatabase =
  databaseUrl.includes('localhost') ||
  databaseUrl.includes('127.0.0.1') ||
  databaseUrl.includes('@postgres:') ||
  databaseUrl.includes('@postgres-prod:');

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: isLocalDatabase
      ? {}
      : {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
    migrationsPath: './src/migrations',
    seederStorage: 'sequelize',
    seedersPath: isProduction ? './dist/seeders' : './src/seeders',
  },

  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: isLocalDatabase
      ? {}
      : {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
    migrationsPath: './src/migrations',
    seederStorage: 'sequelize',
    seedersPath: './dist/seeders',
  },
};
