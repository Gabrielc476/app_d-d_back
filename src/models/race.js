const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Race = sequelize.define(
  "Race",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    abilityScoreIncrease: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    age: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    alignment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    speed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    traits: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    subraces: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // For custom races created by users
    isCustom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Race;
