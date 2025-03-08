const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./user");
const Character = require("./character");

const Campaign = sequelize.define(
  "Campaign",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Nome da campanha não pode estar vazio",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    setting: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "planejamento",
        "em_progresso",
        "concluida",
        "pausada"
      ),
      defaultValue: "planejamento",
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    level: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        min: 1,
        max: 20,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    meetingSchedule: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Relacionamento: Uma campanha pertence a um DM (usuário)
Campaign.belongsTo(User, {
  as: "dungeonMaster",
  foreignKey: {
    name: "dungeonMasterId",
    allowNull: false,
  },
});

// Tabela pivot para campanhas e personagens
const CampaignCharacter = sequelize.define(
  "CampaignCharacter",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    joinDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("ativo", "inativo", "morto", "ausente"),
      defaultValue: "ativo",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Relacionamento N:M entre campanhas e personagens
Campaign.belongsToMany(Character, {
  through: CampaignCharacter,
  foreignKey: "campaignId",
});

Character.belongsToMany(Campaign, {
  through: CampaignCharacter,
  foreignKey: "characterId",
});

module.exports = {
  Campaign,
  CampaignCharacter,
};
