const { v4: uuidv4 } = require("uuid");
const {
  CombatSession,
  CombatParticipant,
  CombatAction,
} = require("../models/combat-session");
const Character = require("../models/character");
const Campaign = require("../models/campaign").Campaign;
const User = require("../models/user");
const { sequelize } = require("../config/database");

// Criar uma nova sessão de combate
exports.createCombatSession = async (req, res, next) => {
  try {
    const { campaignId, name, description } = req.body;

    // Verificar se a campanha existe
    if (campaignId) {
      const campaign = await Campaign.findByPk(campaignId);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campanha não encontrada",
        });
      }

      // Verificar se o usuário é o mestre da campanha
      if (campaign.dungeonMasterId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Apenas o mestre da campanha pode criar sessões de combate",
        });
      }
    }

    const combatSession = await CombatSession.create({
      campaignId: campaignId || null,
      name,
      description,
      dungeonMasterId: req.user.id,
      status: "preparando",
      round: 0,
      currentTurnIndex: 0,
    });

    res.status(201).json({
      success: true,
      data: combatSession,
    });
  } catch (error) {
    next(error);
  }
};

// Obter uma sessão de combate por ID
exports.getCombatSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const combatSession = await CombatSession.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: "campaign",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "dungeonMaster",
          attributes: ["id", "username"],
        },
        {
          model: CombatParticipant,
          as: "participants",
          include: [
            {
              model: Character,
              as: "character",
              attributes: ["id", "name", "class", "level"],
            },
          ],
        },
      ],
    });

    if (!combatSession) {
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar permissão (apenas DM ou jogadores da campanha)
    const isDM = combatSession.dungeonMasterId === req.user.id;
    let isPlayerInCampaign = false;

    if (combatSession.campaignId) {
      // Aqui deveria verificar se o usuário é um jogador na campanha
      // Isso depende da sua modelagem
      isPlayerInCampaign = true; // Placeholder
    }

    if (!isDM && !isPlayerInCampaign) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para acessar esta sessão de combate",
      });
    }

    res.status(200).json({
      success: true,
      data: combatSession,
    });
  } catch (error) {
    next(error);
  }
};

// Listar sessões de combate (por campanha ou criadas pelo usuário)
exports.listCombatSessions = async (req, res, next) => {
  try {
    const { campaignId } = req.query;
    const userId = req.user.id;

    let whereClause = {};

    if (campaignId) {
      whereClause.campaignId = campaignId;
    } else {
      whereClause.dungeonMasterId = userId;
    }

    const combatSessions = await CombatSession.findAll({
      where: whereClause,
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
      count: combatSessions.length,
      data: combatSessions,
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar participante ao combate
exports.addParticipant = async (req, res, next) => {
  try {
    const { combatSessionId } = req.params;
    const {
      characterId,
      name,
      type,
      armorClass,
      maxHitPoints,
      initiative,
      stats,
      isVisible,
    } = req.body;

    // Buscar a sessão de combate
    const combatSession = await CombatSession.findByPk(combatSessionId);

    if (!combatSession) {
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar se o usuário é o mestre do combate
    if (combatSession.dungeonMasterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre do combate pode adicionar participantes",
      });
    }

    // Verificar o status do combate
    if (
      combatSession.status !== "preparando" &&
      combatSession.status !== "pausado"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Só é possível adicionar participantes em combates em preparação ou pausados",
      });
    }

    // Se fornecido characterId, validar que o personagem existe
    let character = null;
    if (characterId) {
      character = await Character.findByPk(characterId);

      if (!character) {
        return res.status(404).json({
          success: false,
          message: "Personagem não encontrado",
        });
      }
    }

    // Obter o próximo número de ordem
    const participantCount = await CombatParticipant.count({
      where: { combatSessionId },
    });

    // Criar o participante
    const participant = await CombatParticipant.create({
      combatSessionId,
      characterId: characterId || null,
      name: name || (character ? character.name : "Criatura"),
      type: type || (character ? "player" : "monster"),
      armorClass: armorClass || (character ? character.armorClass : 10),
      maxHitPoints: maxHitPoints || (character ? character.maxHitPoints : 10),
      currentHitPoints:
        maxHitPoints || (character ? character.currentHitPoints : 10),
      initiative: initiative || 0,
      stats: stats || {},
      isVisible: isVisible !== undefined ? isVisible : true,
      order: participantCount,
    });

    // Adicionar informações do personagem se existir
    if (character) {
      participant.character = {
        id: character.id,
        name: character.name,
        class: character.class,
        level: character.level,
      };
    }

    // Notificar via websocket se disponível
    if (req.io) {
      req.io.to(`combat-${combatSessionId}`).emit("participantAdded", {
        combatSessionId,
        participant,
      });
    }

    res.status(201).json({
      success: true,
      data: participant,
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar um participante do combate
exports.updateParticipant = async (req, res, next) => {
  try {
    const { combatSessionId, participantId } = req.params;
    const updateData = req.body;

    // Buscar a sessão de combate e o participante
    const combatSession = await CombatSession.findByPk(combatSessionId);

    if (!combatSession) {
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    const participant = await CombatParticipant.findOne({
      where: {
        id: participantId,
        combatSessionId,
      },
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participante não encontrado nesta sessão de combate",
      });
    }

    // Verificar permissão (DM pode atualizar qualquer um, jogador apenas seu personagem)
    const isDM = combatSession.dungeonMasterId === req.user.id;
    let isOwnCharacter = false;

    if (participant.characterId) {
      const character = await Character.findByPk(participant.characterId);
      isOwnCharacter = character && character.userId === req.user.id;
    }

    if (!isDM && !isOwnCharacter) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para atualizar este participante",
      });
    }

    // Jogadores só podem atualizar certas propriedades dos seus personagens
    if (!isDM && isOwnCharacter) {
      const allowedFields = [
        "currentHitPoints",
        "temporaryHitPoints",
        "conditions",
      ];

      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // Atualizar o participante
    await participant.update(updateData);

    // Recarregar para obter relações
    const updatedParticipant = await CombatParticipant.findByPk(participantId, {
      include: [
        {
          model: Character,
          as: "character",
          attributes: ["id", "name", "class", "level"],
        },
      ],
    });

    // Notificar via websocket se disponível
    if (req.io) {
      req.io.to(`combat-${combatSessionId}`).emit("participantUpdated", {
        combatSessionId,
        participant: updatedParticipant,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedParticipant,
    });
  } catch (error) {
    next(error);
  }
};

// Iniciar combate (ordenar iniciativa e definir primeiro turno)
exports.startCombat = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Buscar sessão de combate
    const combatSession = await CombatSession.findByPk(id, { transaction });

    if (!combatSession) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar se o usuário é o mestre do combate
    if (combatSession.dungeonMasterId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre do combate pode iniciá-lo",
      });
    }

    // Verificar se o combate está no estado correto
    if (
      combatSession.status !== "preparando" &&
      combatSession.status !== "pausado"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "O combate já está em andamento ou foi concluído",
      });
    }

    // Buscar todos os participantes
    const participants = await CombatParticipant.findAll({
      where: {
        combatSessionId: id,
        isActive: true,
      },
      transaction,
    });

    if (participants.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Não há participantes ativos no combate",
      });
    }

    // Ordenar participantes por iniciativa (decrescente)
    const sortedParticipants = [...participants].sort(
      (a, b) => b.initiative - a.initiative
    );

    // Atualizar a ordem dos participantes
    for (let i = 0; i < sortedParticipants.length; i++) {
      await sortedParticipants[i].update({ order: i }, { transaction });
    }

    // Atualizar a sessão de combate
    await combatSession.update(
      {
        status: "em_andamento",
        round: 1,
        currentTurnIndex: 0,
      },
      { transaction }
    );

    await transaction.commit();

    // Carregar a sessão atualizada com os participantes ordenados
    const updatedSession = await CombatSession.findByPk(id, {
      include: [
        {
          model: CombatParticipant,
          as: "participants",
          include: [
            {
              model: Character,
              as: "character",
              attributes: ["id", "name", "class", "level"],
            },
          ],
        },
      ],
    });

    // Notificar via websocket se disponível
    if (req.io) {
      req.io.to(`combat-${id}`).emit("combatStarted", {
        combatSession: updatedSession,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Avançar para o próximo turno
exports.nextTurn = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Buscar sessão de combate
    const combatSession = await CombatSession.findByPk(id, {
      include: [
        {
          model: CombatParticipant,
          as: "participants",
          where: { isActive: true },
          required: false,
        },
      ],
      transaction,
    });

    if (!combatSession) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar se o usuário é o mestre do combate
    if (combatSession.dungeonMasterId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre do combate pode avançar o turno",
      });
    }

    // Verificar se o combate está em andamento
    if (combatSession.status !== "em_andamento") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "O combate não está em andamento",
      });
    }

    const activeParticipants = combatSession.participants;

    if (activeParticipants.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Não há participantes ativos no combate",
      });
    }

    // Determinar próximo índice
    let nextIndex = combatSession.currentTurnIndex + 1;
    let newRound = false;

    // Se chegou ao final da ordem, volta para o início e incrementa o round
    if (nextIndex >= activeParticipants.length) {
      nextIndex = 0;
      newRound = true;
    }

    // Atualizar a sessão
    await combatSession.update(
      {
        currentTurnIndex: nextIndex,
        round: newRound ? combatSession.round + 1 : combatSession.round,
      },
      { transaction }
    );

    await transaction.commit();

    // Carregar a sessão atualizada
    const updatedSession = await CombatSession.findByPk(id, {
      include: [
        {
          model: CombatParticipant,
          as: "participants",
          include: [
            {
              model: Character,
              as: "character",
              attributes: ["id", "name", "class", "level"],
            },
          ],
        },
      ],
    });

    // Notificar via websocket se disponível
    if (req.io) {
      req.io.to(`combat-${id}`).emit("turnAdvanced", {
        combatSession: updatedSession,
        newRound,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSession,
      newRound,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Pausar ou retomar combate
exports.toggleCombatStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'pause' ou 'resume'

    if (!["pause", "resume"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Ação inválida. Use "pause" ou "resume"',
      });
    }

    // Buscar sessão de combate
    const combatSession = await CombatSession.findByPk(id);

    if (!combatSession) {
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar se o usuário é o mestre do combate
    if (combatSession.dungeonMasterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre do combate pode pausar ou retomar o combate",
      });
    }

    // Aplicar a ação
    if (action === "pause" && combatSession.status === "em_andamento") {
      await combatSession.update({ status: "pausado" });
    } else if (action === "resume" && combatSession.status === "pausado") {
      await combatSession.update({ status: "em_andamento" });
    } else {
      return res.status(400).json({
        success: false,
        message: `Não é possível ${
          action === "pause" ? "pausar" : "retomar"
        } o combate no estado atual`,
      });
    }

    // Notificar via websocket se disponível
    if (req.io) {
      req.io.to(`combat-${id}`).emit("combatStatusChanged", {
        combatSessionId: id,
        status: combatSession.status,
      });
    }

    res.status(200).json({
      success: true,
      data: combatSession,
    });
  } catch (error) {
    next(error);
  }
};

// Finalizar combate
exports.endCombat = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Buscar sessão de combate
    const combatSession = await CombatSession.findByPk(id);

    if (!combatSession) {
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar se o usuário é o mestre do combate
    if (combatSession.dungeonMasterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre do combate pode finalizá-lo",
      });
    }

    // Verificar se o combate já está concluído
    if (combatSession.status === "concluido") {
      return res.status(400).json({
        success: false,
        message: "O combate já está concluído",
      });
    }

    // Finalizar o combate
    await combatSession.update({ status: "concluido" });

    // Notificar via websocket se disponível
    if (req.io) {
      req.io.to(`combat-${id}`).emit("combatEnded", {
        combatSessionId: id,
      });
    }

    res.status(200).json({
      success: true,
      data: combatSession,
    });
  } catch (error) {
    next(error);
  }
};

// Registrar uma ação no combate
exports.recordAction = async (req, res, next) => {
  try {
    const { combatSessionId } = req.params;
    const {
      actorId,
      targetId,
      actionType,
      actionName,
      description,
      rollData,
      damage,
      damageType,
      success,
      saveType,
      saveDC,
    } = req.body;

    // Buscar sessão de combate
    const combatSession = await CombatSession.findByPk(combatSessionId);

    if (!combatSession) {
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar se o combate está em andamento
    if (combatSession.status !== "em_andamento") {
      return res.status(400).json({
        success: false,
        message: "Só é possível registrar ações em combates em andamento",
      });
    }

    // Verificar se o ator existe
    const actor = await CombatParticipant.findByPk(actorId);

    if (!actor || actor.combatSessionId !== combatSessionId) {
      return res.status(404).json({
        success: false,
        message: "Participante não encontrado nesta sessão de combate",
      });
    }

    // Verificar permissão (DM pode registrar qualquer ação, jogador apenas de seus personagens)
    const isDM = combatSession.dungeonMasterId === req.user.id;
    let isOwnCharacter = false;

    if (actor.characterId) {
      const character = await Character.findByPk(actor.characterId);
      isOwnCharacter = character && character.userId === req.user.id;
    }

    if (!isDM && !isOwnCharacter) {
      return res.status(403).json({
        success: false,
        message:
          "Você não tem permissão para registrar ações deste participante",
      });
    }

    // Verificar se o alvo existe (se fornecido)
    if (targetId) {
      const target = await CombatParticipant.findByPk(targetId);

      if (!target || target.combatSessionId !== combatSessionId) {
        return res.status(404).json({
          success: false,
          message: "Alvo não encontrado nesta sessão de combate",
        });
      }
    }

    // Criar a ação
    const action = await CombatAction.create({
      combatSessionId,
      round: combatSession.round,
      actorId,
      targetId: targetId || null,
      actionType,
      actionName,
      description: description || null,
      rollData: rollData || null,
      damage: damage || null,
      damageType: damageType || null,
      success: success !== undefined ? success : null,
      saveType: saveType || null,
      saveDC: saveDC || null,
    });

    // Se o alvo sofreu dano, atualizar pontos de vida
    if (targetId && damage && damage > 0) {
      const target = await CombatParticipant.findByPk(targetId);

      let newHp = target.currentHitPoints;
      let newTempHp = target.temporaryHitPoints;

      // Primeiro aplicar o dano aos pontos de vida temporários
      if (newTempHp > 0) {
        if (newTempHp >= damage) {
          newTempHp -= damage;
        } else {
          const remainingDamage = damage - newTempHp;
          newTempHp = 0;
          newHp = Math.max(0, newHp - remainingDamage);
        }
      } else {
        newHp = Math.max(0, newHp - damage);
      }

      await target.update({
        currentHitPoints: newHp,
        temporaryHitPoints: newTempHp,
      });
    }

    // Carregar as relações
    const fullAction = await CombatAction.findByPk(action.id, {
      include: [
        {
          model: CombatParticipant,
          as: "actor",
          include: [
            {
              model: Character,
              as: "character",
              attributes: ["id", "name", "class", "level"],
            },
          ],
        },
        {
          model: CombatParticipant,
          as: "target",
          include: [
            {
              model: Character,
              as: "character",
              attributes: ["id", "name", "class", "level"],
            },
          ],
        },
      ],
    });

    // Notificar via websocket se disponível
    if (req.io) {
      req.io.to(`combat-${combatSessionId}`).emit("actionRecorded", {
        combatSessionId,
        action: fullAction,
      });
    }

    res.status(201).json({
      success: true,
      data: fullAction,
    });
  } catch (error) {
    next(error);
  }
};

// Obter histórico de ações de um combate
exports.getCombatActions = async (req, res, next) => {
  try {
    const { combatSessionId } = req.params;
    const { round } = req.query;

    // Buscar sessão de combate
    const combatSession = await CombatSession.findByPk(combatSessionId);

    if (!combatSession) {
      return res.status(404).json({
        success: false,
        message: "Sessão de combate não encontrada",
      });
    }

    // Verificar permissão (DM ou jogador da campanha)
    const isDM = combatSession.dungeonMasterId === req.user.id;
    let isPlayerInCampaign = false;

    if (combatSession.campaignId) {
      // Verificação se o usuário é um jogador na campanha
      // Isso depende da sua modelagem
      isPlayerInCampaign = true; // Placeholder
    }

    if (!isDM && !isPlayerInCampaign) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para ver o histórico deste combate",
      });
    }

    // Configurar cláusula where
    const whereClause = { combatSessionId };

    if (round) {
      whereClause.round = parseInt(round);
    }

    // Obter as ações
    const actions = await CombatAction.findAll({
      where: whereClause,
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: CombatParticipant,
          as: "actor",
          include: [
            {
              model: Character,
              as: "character",
              attributes: ["id", "name", "class", "level"],
            },
          ],
        },
        {
          model: CombatParticipant,
          as: "target",
          include: [
            {
              model: Character,
              as: "character",
              attributes: ["id", "name", "class", "level"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: actions.length,
      data: actions,
    });
  } catch (error) {
    next(error);
  }
};
