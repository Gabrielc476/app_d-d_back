const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./user");
const Campaign = require("./campaign").Campaign;
const Character = require("./character");

// Modelo para sessão de combate
const CombatSession = sequelize.define(
  "CombatSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Campaign,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "preparando",
        "em_andamento",
        "pausado",
        "concluido"
      ),
      defaultValue: "preparando",
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    currentTurnIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    dungeonMasterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
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

// Modelo para participantes do combate (personagens, NPCs e monstros)
const CombatParticipant = sequelize.define(
  "CombatParticipant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    combatSessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: CombatSession,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    characterId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Character,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("player", "npc", "monster"),
      allowNull: false,
      defaultValue: "monster",
    },
    initiative: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    initiativeRoll: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    armorClass: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    maxHitPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    currentHitPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    temporaryHitPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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

// Modelo para ataques e ações durante o combate
const CombatAction = sequelize.define(
  "CombatAction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    combatSessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: CombatSession,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: CombatParticipant,
        key: "id",
      },
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: CombatParticipant,
        key: "id",
      },
    },
    actionType: {
      type: DataTypes.ENUM(
        "attack",
        "spell",
        "ability",
        "movement",
        "item",
        "other"
      ),
      allowNull: false,
    },
    actionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rollData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    damage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    damageType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    saveType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    saveDC: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Relacionamentos
CombatSession.belongsTo(Campaign, {
  foreignKey: "campaignId",
  as: "campaign",
});

CombatSession.belongsTo(User, {
  foreignKey: "dungeonMasterId",
  as: "dungeonMaster",
});

CombatSession.hasMany(CombatParticipant, {
  foreignKey: "combatSessionId",
  as: "participants",
});

CombatParticipant.belongsTo(CombatSession, {
  foreignKey: "combatSessionId",
  as: "combatSession",
});

CombatParticipant.belongsTo(Character, {
  foreignKey: "characterId",
  as: "character",
});

CombatAction.belongsTo(CombatSession, {
  foreignKey: "combatSessionId",
  as: "combatSession",
});

CombatAction.belongsTo(CombatParticipant, {
  foreignKey: "actorId",
  as: "actor",
});

CombatAction.belongsTo(CombatParticipant, {
  foreignKey: "targetId",
  as: "target",
});

module.exports = {
  CombatSession,
  CombatParticipant,
  CombatAction,
};
