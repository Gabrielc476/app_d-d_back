const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./user");
const Campaign = require("./campaign").Campaign;

const DiceRoll = sequelize.define(
  "DiceRoll",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Campaign,
        key: "id",
      },
    },
    characterName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diceType: {
      type: DataTypes.ENUM("d4", "d6", "d8", "d10", "d12", "d20", "d100"),
      allowNull: false,
    },
    diceCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 100, // Limite máximo razoável
      },
    },
    modifier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    results: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rollType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rollLabel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    advantage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    disadvantage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
  }
);

// Relacionamento com usuário
DiceRoll.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Relacionamento com campanha (opcional)
DiceRoll.belongsTo(Campaign, {
  foreignKey: "campaignId",
  as: "campaign",
});

module.exports = DiceRoll;
