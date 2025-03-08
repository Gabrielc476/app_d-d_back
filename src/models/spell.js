const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Spell = sequelize.define(
  "Spell",
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
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 9,
      },
    },
    school: {
      type: DataTypes.ENUM(
        "abjuracao",
        "adivinhacao",
        "conjuracao",
        "encantamento",
        "evocacao",
        "ilusao",
        "necromancia",
        "transmutacao"
      ),
      allowNull: false,
    },
    castingTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    range: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    components: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    higherLevels: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    concentration: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ritual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Classes that can cast this spell
    classes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // For custom spells created by users
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

module.exports = Spell;
