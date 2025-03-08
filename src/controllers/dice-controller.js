const { v4: uuidv4 } = require("uuid");
const DiceRoll = require("../models/dice");
const User = require("../models/user");
const Campaign = require("../models/campaign").Campaign;

// Função utilitária para rolar dados
const rollDice = (diceType, count = 1) => {
  const results = [];
  const sides = parseInt(diceType.substring(1));

  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * sides) + 1);
  }

  return results;
};

// Criar um novo lançamento de dados
exports.createDiceRoll = async (req, res, next) => {
  try {
    const {
      diceType,
      diceCount,
      modifier = 0,
      rollType,
      rollLabel,
      advantage = false,
      disadvantage = false,
      isPrivate = false,
      campaignId,
      characterName,
    } = req.body;

    const userId = req.user.id;

    // Validação básica
    if (!diceType || !diceCount) {
      return res.status(400).json({
        success: false,
        message: "É necessário fornecer o tipo e quantidade de dados",
      });
    }

    // Validar tipo de dado
    const validDiceTypes = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
    if (!validDiceTypes.includes(diceType)) {
      return res.status(400).json({
        success: false,
        message:
          "Tipo de dado inválido. Deve ser d4, d6, d8, d10, d12, d20 ou d100",
      });
    }

    // Realizar a rolagem com base nas condições
    let results = [];
    let total = 0;

    if (advantage || disadvantage) {
      if (diceType !== "d20") {
        return res.status(400).json({
          success: false,
          message: "Vantagem e desvantagem só podem ser usadas com d20",
        });
      }

      const roll1 = rollDice(diceType, 1)[0];
      const roll2 = rollDice(diceType, 1)[0];

      results = [roll1, roll2];

      if (advantage) {
        total = Math.max(roll1, roll2) + parseInt(modifier);
      } else {
        total = Math.min(roll1, roll2) + parseInt(modifier);
      }
    } else {
      results = rollDice(diceType, diceCount);
      total =
        results.reduce((sum, value) => sum + value, 0) + parseInt(modifier);
    }

    // Criar registro da rolagem
    const diceRoll = await DiceRoll.create({
      userId,
      campaignId: campaignId || null,
      characterName: characterName || null,
      diceType,
      diceCount,
      modifier,
      results,
      total,
      rollType: rollType || null,
      rollLabel: rollLabel || null,
      advantage,
      disadvantage,
      isPrivate,
    });

    // Se a rolagem estiver associada a uma campanha e não for privada, emitir evento via socket
    if (campaignId && !isPrivate && req.io) {
      const user = await User.findByPk(userId, {
        attributes: ["id", "username", "email", "role"],
      });

      req.io.to(`campaign-${campaignId}`).emit("diceRoll", {
        diceRoll: {
          ...diceRoll.toJSON(),
          user: {
            id: user.id,
            username: user.username,
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      data: diceRoll,
    });
  } catch (error) {
    next(error);
  }
};

// Obter histórico de lançamentos de dados por usuário
exports.getUserDiceRolls = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const diceRolls = await DiceRoll.findAll({
      where: { userId },
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Campaign,
          as: "campaign",
          attributes: ["id", "name"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: diceRolls.length,
      data: diceRolls,
    });
  } catch (error) {
    next(error);
  }
};

// Obter histórico de lançamentos de dados por campanha
exports.getCampaignDiceRolls = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Verificar se o usuário tem acesso à campanha
    const campaign = await Campaign.findByPk(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    // Se não for o mestre, verificar se o usuário é um jogador da campanha
    if (campaign.dungeonMasterId !== req.user.id) {
      // Aqui deveria ter uma lógica para verificar se o usuário é um jogador na campanha
      // Isso depende de como você modelou essa relação
    }

    // Obter todas as rolagens públicas da campanha e as rolagens privadas do usuário
    const diceRolls = await DiceRoll.findAll({
      where: {
        campaignId,
        [sequelize.Op.or]: [{ isPrivate: false }, { userId: req.user.id }],
      },
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: diceRolls.length,
      data: diceRolls,
    });
  } catch (error) {
    next(error);
  }
};

// Realizar rolagem rápida (apenas cálculo, sem persistência)
exports.quickRoll = async (req, res, next) => {
  try {
    const { diceType, diceCount, modifier = 0 } = req.body;

    // Validação básica
    if (!diceType || !diceCount) {
      return res.status(400).json({
        success: false,
        message: "É necessário fornecer o tipo e quantidade de dados",
      });
    }

    // Validar tipo de dado
    const validDiceTypes = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
    if (!validDiceTypes.includes(diceType)) {
      return res.status(400).json({
        success: false,
        message:
          "Tipo de dado inválido. Deve ser d4, d6, d8, d10, d12, d20 ou d100",
      });
    }

    // Realizar a rolagem
    const results = rollDice(diceType, diceCount);
    const total =
      results.reduce((sum, value) => sum + value, 0) + parseInt(modifier);

    res.status(200).json({
      success: true,
      data: {
        id: uuidv4(),
        diceType,
        diceCount,
        modifier,
        results,
        total,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};
