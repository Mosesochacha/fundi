import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";
import process from "process";
import configAll from "../config/sequelize";

const env = process.env.NODE_ENV || "development";
const config = configAll[env];
const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable]!, config.options)
  : new Sequelize(
      config.database!,
      config.username!,
      config.password,
      config.options
    );

const models: Record<
  string,
  ReturnType<any> & { associate?: (models: Record<string, any>) => void }
> = {};

const isTsRuntime = __filename.endsWith('.ts') || process.env.TS_NODE_DEV === 'true';
const fileExt = isTsRuntime ? '.ts' : '.js';

fs.readdirSync(__dirname)
  .filter((file) => {
    if (file === `index${fileExt}`) return false;
    const isModelFile = file.endsWith(fileExt) && !file.endsWith(`.test${fileExt}`);
    return isModelFile;
  })
  .forEach((file) => {
    const modelPath = path.join(__dirname, file);
    const modelModule = require(modelPath);
    const initModel = modelModule.initModel || modelModule.default?.initModel;
    if (typeof initModel === "function") {
      const model = initModel(sequelize);
      models[model.name] = model;
    }
  });

Object.values(models).forEach((model: any) => {
  if (typeof model.associate === "function") {
    model.associate(models);
  }
});

const db = {
  sequelize,
  Sequelize,
  ...models,
} as typeof models & {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
};

export type DB = typeof db;
export default db;