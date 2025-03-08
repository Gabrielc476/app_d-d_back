const Spell = require("../models/spell");
const { Op } = require("sequelize");

/**
 * @desc    Get all spells with filters
 * @route   GET /api/spells
 * @access  Public
 */
exports.getSpells = async (req, res, next) => {
  try {
    const {
      name,
      level,
      school,
      class: spellClass,
      concentration,
      ritual,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filter
    const filter = {};

    // Filter by name (partial match)
    if (name) {
      filter.name = { [Op.iLike]: `%${name}%` };
    }

    // Filter by level
    if (level) {
      // Handle ranges like 1-3
      if (level.includes("-")) {
        const [min, max] = level.split("-").map(Number);
        filter.level = { [Op.between]: [min, max] };
      } else {
        filter.level = level;
      }
    }

    // Filter by school
    if (school) {
      filter.school = school;
    }

    // Filter by class
    if (spellClass) {
      filter.classes = { [Op.contains]: [spellClass] };
    }

    // Filter by concentration
    if (concentration !== undefined) {
      filter.concentration = concentration === "true";
    }

    // Filter by ritual
    if (ritual !== undefined) {
      filter.ritual = ritual === "true";
    }

    // Include user's custom spells or only show official ones
    if (req.user) {
      filter[Op.or] = [{ isCustom: false }, { createdBy: req.user.id }];
    } else {
      filter.isCustom = false;
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Get spells
    const { count, rows: spells } = await Spell.findAndCountAll({
      where: filter,
      order: [
        ["level", "ASC"],
        ["name", "ASC"],
      ],
      limit,
      offset,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.status(200).json({
      success: true,
      count,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        nextPage,
        prevPage,
        limit,
      },
      data: spells,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get spell by ID
 * @route   GET /api/spells/:id
 * @access  Public
 */
exports.getSpell = async (req, res, next) => {
  try {
    const spell = await Spell.findByPk(req.params.id);

    if (!spell) {
      return res.status(404).json({
        success: false,
        message: "Magia não encontrada",
      });
    }

    // If it's a custom spell, verify access
    if (spell.isCustom) {
      if (!req.user || spell.createdBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Você não tem permissão para acessar esta magia",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: spell,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom spell
 * @route   POST /api/spells
 * @access  Private
 */
exports.createSpell = async (req, res, next) => {
  try {
    // Set custom spell attributes
    const spellData = {
      ...req.body,
      isCustom: true,
      createdBy: req.user.id,
    };

    // Create spell
    const spell = await Spell.create(spellData);

    res.status(201).json({
      success: true,
      data: spell,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a custom spell
 * @route   PUT /api/spells/:id
 * @access  Private
 */
exports.updateSpell = async (req, res, next) => {
  try {
    let spell = await Spell.findByPk(req.params.id);

    if (!spell) {
      return res.status(404).json({
        success: false,
        message: "Magia não encontrada",
      });
    }

    // Verify ownership of custom spell
    if (!spell.isCustom || spell.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para atualizar esta magia",
      });
    }

    // Update spell
    spell = await spell.update(req.body);

    res.status(200).json({
      success: true,
      data: spell,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a custom spell
 * @route   DELETE /api/spells/:id
 * @access  Private
 */
exports.deleteSpell = async (req, res, next) => {
  try {
    const spell = await Spell.findByPk(req.params.id);

    if (!spell) {
      return res.status(404).json({
        success: false,
        message: "Magia não encontrada",
      });
    }

    // Verify ownership of custom spell
    if (!spell.isCustom || spell.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para excluir esta magia",
      });
    }

    // Delete spell
    await spell.destroy();

    res.status(200).json({
      success: true,
      message: "Magia excluída com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get spells by class
 * @route   GET /api/spells/class/:className
 * @access  Public
 */
exports.getSpellsByClass = async (req, res, next) => {
  try {
    const { className } = req.params;
    const { level } = req.query;

    const filter = {
      classes: { [Op.contains]: [className] },
    };

    // Filter by level
    if (level) {
      filter.level = level;
    }

    // Include user's custom spells or only show official ones
    if (req.user) {
      filter[Op.or] = [{ isCustom: false }, { createdBy: req.user.id }];
    } else {
      filter.isCustom = false;
    }

    const spells = await Spell.findAll({
      where: filter,
      order: [
        ["level", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: spells.length,
      data: spells,
    });
  } catch (error) {
    next(error);
  }
};
