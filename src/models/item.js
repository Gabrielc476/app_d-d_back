const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Item = sequelize.define(
  "Item",
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
    type: {
      type: DataTypes.ENUM(
        "arma",
        "armadura",
        "poção",
        "pergaminho",
        "varinha",
        "anel",
        "bastão",
        "cajado",
        "equipamento",
        "item_maravilhoso"
      ),
      allowNull: false,
    },
    rarity: {
      type: DataTypes.ENUM(
        "comum",
        "incomum",
        "raro",
        "muito raro",
        "lendário",
        "artefato"
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Value in gold pieces
    value: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Weight in pounds
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Requires attunement
    requiresAttunement: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Class restriction for attunement (if any)
    attunementRestriction: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Additional data based on item type
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // Source book
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // For custom items created by users
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

// Add properties based on item type (virtual getters)
Item.prototype.getWeaponProperties = function () {
  if (this.type !== "arma") {
    return null;
  }

  return this.properties || {};
};

Item.prototype.getArmorProperties = function () {
  if (this.type !== "armadura") {
    return null;
  }

  return this.properties || {};
};

module.exports = Item;
