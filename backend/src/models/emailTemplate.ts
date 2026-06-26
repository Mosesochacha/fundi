import { Sequelize, DataTypes, Model } from "sequelize";

export class EmailTemplate extends Model {
  declare id: string;
  declare name: string;
  declare subject: string;
  declare body: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initModel(sequelize: Sequelize): typeof EmailTemplate {
  EmailTemplate.init(
    {
      id: { type: DataTypes.STRING(60), primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      subject: { type: DataTypes.STRING(300), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: "EmailTemplate",
      tableName: "EmailTemplates",
      timestamps: true,
    },
  );
  return EmailTemplate;
}
