import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL environment variable is required");
  console.error("Please set DATABASE_URL in your environment variables");
  process.exit(1);
}

// Load CA certificate from NODE_EXTRA_CA_CERTS if available
let caCertificate: string | undefined;

const caCertPath = process.env.NODE_EXTRA_CA_CERTS;
if (caCertPath && fs.existsSync(caCertPath)) {
  caCertificate = fs.readFileSync(caCertPath, "utf8");
}

// Determine if this is a local database (no SSL needed)
const isLocalDatabase =
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1") ||
  databaseUrl.includes("@postgres:") ||
  databaseUrl.includes("@postgres-prod:");

// SSL configuration - only use SSL for remote databases
const sslConfig: any = isLocalDatabase
  ? false
  : {
      require: true,
      rejectUnauthorized: !!caCertificate, // verify only if CA cert exists
      ...(caCertificate ? { ca: caCertificate } : {}),
    };
    

// Initialize Sequelize
const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: isLocalDatabase ? {} : { ssl: sslConfig },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || "5", 10),
    min: parseInt(process.env.DB_POOL_MIN || "0", 10),
    acquire: 60000,
    idle: 10000,
    evict: 1000,
  },
});

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Close database connection
 * @returns {Promise<void>}
 */
export const closeConnection = async (): Promise<void> => {
  await sequelize.close();
};

export default sequelize;
