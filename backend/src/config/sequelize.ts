
import { Options as SequelizeOptions } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

interface DBConfig {
  username?: string;
  password?: string;
  database?: string;
  use_env_variable?: string;
  options: SequelizeOptions;
}

const isProduction = process.env.NODE_ENV === "production";

const databaseUrl = process.env.DATABASE_URL || "";
const isLocalDatabase =
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1") ||
  databaseUrl.includes("@postgres:") ||
  databaseUrl.includes("@postgres-prod:");

const dialectOptions = isLocalDatabase
  ? {}
  : {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };

const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || "5", 10),
  min: parseInt(process.env.DB_POOL_MIN || "0", 10),
  acquire: 60000,
  idle: 10000,
  evict: 1000,
};

const config: { [key: string]: DBConfig } = {
  development: {
    use_env_variable: "DATABASE_URL",
    options: {
      dialect: "postgres",
      logging: false,
      dialectOptions,
      pool: poolConfig,
    },
  },
  production: {
    use_env_variable: "DATABASE_URL",
    options: {
      dialect: "postgres",
      logging: false,
      dialectOptions,
      pool: poolConfig,
    },
  },
};

export default config;
module.exports = config;
