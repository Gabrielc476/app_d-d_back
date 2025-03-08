const { Campaign, CampaignCharacter } = require("../models/campaign");
const Character = require("../models/character");
const User = require("../models/user");
const { sequelize } = require("../config/database");

/**
 * @desc    Create new campaign
 * @route   POST /api/campaigns
 * @access  Private
 */
exports.createCampaign = async (req, res, next) => {
  try {
    // Add dungeon master ID to campaign data
    const campaignData = {
      ...req.body,
      dungeonMasterId: req.user.id,
    };

    // Create campaign
    const campaign = await Campaign.create(campaignData);

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all campaigns for current user (as DM or player)
 * @route   GET /api/campaigns
 * @access  Private
 */
exports.getCampaigns = async (req, res, next) => {
  try {
    // Find campaigns where user is the DM
    const dmCampaigns = await Campaign.findAll({
      where: { dungeonMasterId: req.user.id },
      include: [
        {
          model: User,
          as: "dungeonMaster",
          attributes: ["id", "username"],
        },
      ],
    });

    // Find campaigns where user is a player
    const playerCharacters = await Character.findAll({
      where: { userId: req.user.id, isActive: true },
      include: [
        {
          model: Campaign,
          through: {
            model: CampaignCharacter,
            where: { status: "ativo" },
          },
          include: [
            {
              model: User,
              as: "dungeonMaster",
              attributes: ["id", "username"],
            },
          ],
        },
      ],
    });

    // Extract player campaigns
    const playerCampaigns = [];
    playerCharacters.forEach((character) => {
      character.Campaigns.forEach((campaign) => {
        playerCampaigns.push({
          ...campaign.toJSON(),
          characterId: character.id,
        });
      });
    });

    // Combine all campaigns
    const allCampaigns = [...dmCampaigns, ...playerCampaigns];

    res.status(200).json({
      success: true,
      count: allCampaigns.length,
      data: allCampaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single campaign
 * @route   GET /api/campaigns/:id
 * @access  Private
 */
exports.getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "dungeonMaster",
          attributes: ["id", "username"],
        },
        {
          model: Character,
          through: {
            model: CampaignCharacter,
            attributes: ["status", "joinDate", "notes"],
          },
          include: [
            {
              model: User,
              attributes: ["id", "username"],
            },
          ],
        },
      ],
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    // Check if user is authorized to access this campaign
    const isDM = campaign.dungeonMasterId === req.user.id;
    let isPlayer = false;

    // Check if user is a player in the campaign
    if (campaign.Characters) {
      isPlayer = campaign.Characters.some(
        (character) => character.userId === req.user.id
      );
    }

    // If campaign is private, only DM and players can access
    if (campaign.isPrivate && !isDM && !isPlayer) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para acessar esta campanha",
      });
    }

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/campaigns/:id
 * @access  Private (DM only)
 */
exports.updateCampaign = async (req, res, next) => {
  try {
    let campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    // Check if user is the DM
    if (campaign.dungeonMasterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre da campanha pode atualizá-la",
      });
    }

    // Update campaign
    campaign = await campaign.update(req.body);

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/campaigns/:id
 * @access  Private (DM only)
 */
exports.deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    // Check if user is the DM
    if (campaign.dungeonMasterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre da campanha pode excluí-la",
      });
    }

    // Delete campaign
    await campaign.destroy();

    res.status(200).json({
      success: true,
      message: "Campanha excluída com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add character to campaign
 * @route   POST /api/campaigns/:id/characters
 * @access  Private (DM only)
 */
exports.addCharacterToCampaign = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { characterId } = req.body;

    const campaign = await Campaign.findByPk(req.params.id, { transaction });

    if (!campaign) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    // Check if user is the DM
    if (campaign.dungeonMasterId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre da campanha pode adicionar personagens",
      });
    }

    // Verify the character exists
    const character = await Character.findOne({
      where: { id: characterId, isActive: true },
      transaction,
    });

    if (!character) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado",
      });
    }

    // Check if character is already in the campaign
    const existingMembership = await CampaignCharacter.findOne({
      where: {
        campaignId: campaign.id,
        characterId: character.id,
      },
      transaction,
    });

    if (existingMembership) {
      // If inactive, reactivate
      if (existingMembership.status !== "ativo") {
        await existingMembership.update({ status: "ativo" }, { transaction });
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Personagem já participa desta campanha",
        });
      }
    } else {
      // Add character to campaign
      await CampaignCharacter.create(
        {
          campaignId: campaign.id,
          characterId: character.id,
          status: "ativo",
        },
        { transaction }
      );
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Personagem adicionado à campanha com sucesso",
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Remove character from campaign
 * @route   DELETE /api/campaigns/:id/characters/:characterId
 * @access  Private (DM only)
 */
exports.removeCharacterFromCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    // Check if user is the DM
    if (campaign.dungeonMasterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Apenas o mestre da campanha pode remover personagens",
      });
    }

    // Find the membership
    const membership = await CampaignCharacter.findOne({
      where: {
        campaignId: campaign.id,
        characterId: req.params.characterId,
      },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado nesta campanha",
      });
    }

    // Set character status to inactive
    await membership.update({ status: "inativo" });

    res.status(200).json({
      success: true,
      message: "Personagem removido da campanha com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update character status in campaign
 * @route   PUT /api/campaigns/:id/characters/:characterId
 * @access  Private (DM only)
 */
exports.updateCharacterStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const campaign = await Campaign.findByPk(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    // Check if user is the DM
    if (campaign.dungeonMasterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message:
          "Apenas o mestre da campanha pode atualizar o status dos personagens",
      });
    }

    // Find the membership
    const membership = await CampaignCharacter.findOne({
      where: {
        campaignId: campaign.id,
        characterId: req.params.characterId,
      },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado nesta campanha",
      });
    }

    // Update membership
    await membership.update({
      status: status || membership.status,
      notes: notes !== undefined ? notes : membership.notes,
    });

    res.status(200).json({
      success: true,
      message: "Status do personagem atualizado com sucesso",
    });
  } catch (error) {
    next(error);
  }
};
