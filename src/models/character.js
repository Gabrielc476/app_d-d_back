const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./user");

const Character = sequelize.define(
  "Character",
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
          msg: "Nome do personagem não pode estar vazio",
        },
      },
    },
    race: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: 1,
          msg: "Nível deve ser pelo menos 1",
        },
        max: {
          args: 20,
          msg: "Nível não pode exceder 20",
        },
      },
    },
    background: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alignment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: 0,
          msg: "Experiência não pode ser negativa",
        },
      },
    },
    // Atributos
    strength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Atributos devem ser pelo menos 1",
        },
        max: {
          args: 30,
          msg: "Atributos não podem exceder 30",
        },
      },
    },
    dexterity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Atributos devem ser pelo menos 1",
        },
        max: {
          args: 30,
          msg: "Atributos não podem exceder 30",
        },
      },
    },
    constitution: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Atributos devem ser pelo menos 1",
        },
        max: {
          args: 30,
          msg: "Atributos não podem exceder 30",
        },
      },
    },
    intelligence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Atributos devem ser pelo menos 1",
        },
        max: {
          args: 30,
          msg: "Atributos não podem exceder 30",
        },
      },
    },
    wisdom: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Atributos devem ser pelo menos 1",
        },
        max: {
          args: 30,
          msg: "Atributos não podem exceder 30",
        },
      },
    },
    charisma: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Atributos devem ser pelo menos 1",
        },
        max: {
          args: 30,
          msg: "Atributos não podem exceder 30",
        },
      },
    },
    // Status
    maxHitPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Pontos de vida máximos devem ser pelo menos 1",
        },
      },
    },
    currentHitPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 0,
          msg: "Pontos de vida atuais não podem ser negativos",
        },
      },
    },
    temporaryHitPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: 0,
          msg: "Pontos de vida temporários não podem ser negativos",
        },
      },
    },
    armorClass: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    initiativeBonus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    speed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    // Detalhes adicionais
    proficiencies: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    equipment: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    spells: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    appearance: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    backstory: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
  }
);

// Relacionamento: Um usuário pode ter vários personagens
Character.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

User.hasMany(Character, {
  foreignKey: "userId",
});

module.exports = Character;
