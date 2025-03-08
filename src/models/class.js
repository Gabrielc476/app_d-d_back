const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Class = sequelize.define(
  "Class",
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
    hitDie: {
      type: DataTypes.STRING, // e.g. "d8", "d10", etc.
      allowNull: false,
    },
    primaryAbility: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    savingThrows: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    armorProficiencies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    weaponProficiencies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    toolProficiencies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    skillChoices: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    startingEquipment: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    classFeatures: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    subclasses: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    spellcasting: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // For custom classes created by users
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

module.exports = Class;
