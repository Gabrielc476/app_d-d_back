const Character = require("../models/character");
const { sequelize } = require("../config/database");

/**
 * @desc    Create new character
 * @route   POST /api/characters
 * @access  Private
 */
exports.createCharacter = async (req, res, next) => {
  try {
    // Add user ID to character data
    const characterData = {
      ...req.body,
      userId: req.user.id,
    };

    // Create character
    const character = await Character.create(characterData);

    res.status(201).json({
      success: true,
      data: character,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all characters for current user
 * @route   GET /api/characters
 * @access  Private
 */
exports.getCharacters = async (req, res, next) => {
  try {
    const characters = await Character.findAll({
      where: { userId: req.user.id, isActive: true },
      order: [["updatedAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: characters.length,
      data: characters,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single character
 * @route   GET /api/characters/:id
 * @access  Private
 */
exports.getCharacter = async (req, res, next) => {
  try {
    const character = await Character.findOne({
      where: { id: req.params.id, isActive: true },
    });

    if (!character) {
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado",
      });
    }

    // Check if user is authorized to access this character
    if (character.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para acessar este personagem",
      });
    }

    res.status(200).json({
      success: true,
      data: character,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update character
 * @route   PUT /api/characters/:id
 * @access  Private
 */
exports.updateCharacter = async (req, res, next) => {
  try {
    let character = await Character.findOne({
      where: { id: req.params.id, isActive: true },
    });

    if (!character) {
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado",
      });
    }

    // Check if user is authorized to update this character
    if (character.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para atualizar este personagem",
      });
    }

    // Update character
    character = await character.update(req.body);

    res.status(200).json({
      success: true,
      data: character,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete character (soft delete)
 * @route   DELETE /api/characters/:id
 * @access  Private
 */
exports.deleteCharacter = async (req, res, next) => {
  try {
    const character = await Character.findOne({
      where: { id: req.params.id, isActive: true },
    });

    if (!character) {
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado",
      });
    }

    // Check if user is authorized to delete this character
    if (character.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para excluir este personagem",
      });
    }

    // Soft delete
    await character.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: "Personagem excluído com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Level up character
 * @route   PUT /api/characters/:id/level-up
 * @access  Private
 */
exports.levelUpCharacter = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const character = await Character.findOne({
      where: { id: req.params.id, isActive: true },
      transaction,
    });

    if (!character) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado",
      });
    }

    // Check if user is authorized to update this character
    if (character.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para atualizar este personagem",
      });
    }

    // Check if character can level up
    if (character.level >= 20) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "O personagem já está no nível máximo (20)",
      });
    }

    // Update level and other level-dependent attributes
    const updates = {
      level: character.level + 1,
      experience: req.body.experience || character.experience,
      maxHitPoints:
        req.body.maxHitPoints ||
        character.maxHitPoints + req.body.hitPointsIncrease ||
        character.maxHitPoints,
    };

    // Apply updates
    const updatedCharacter = await character.update(updates, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: updatedCharacter,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Update character hit points
 * @route   PUT /api/characters/:id/hit-points
 * @access  Private
 */
exports.updateHitPoints = async (req, res, next) => {
  try {
    const { currentHitPoints, temporaryHitPoints } = req.body;

    const character = await Character.findOne({
      where: { id: req.params.id, isActive: true },
    });

    if (!character) {
      return res.status(404).json({
        success: false,
        message: "Personagem não encontrado",
      });
    }

    // Check if user is authorized to update this character
    if (character.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para atualizar este personagem",
      });
    }

    // Update hit points
    await character.update({
      currentHitPoints:
        currentHitPoints !== undefined
          ? currentHitPoints
          : character.currentHitPoints,
      temporaryHitPoints:
        temporaryHitPoints !== undefined
          ? temporaryHitPoints
          : character.temporaryHitPoints,
    });

    res.status(200).json({
      success: true,
      data: character,
    });
  } catch (error) {
    next(error);
  }
};
