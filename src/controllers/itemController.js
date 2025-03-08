const Item = require("../models/item");
const { Op } = require("sequelize");

/**
 * @desc    Get all items with filters
 * @route   GET /api/items
 * @access  Public
 */
exports.getItems = async (req, res, next) => {
  try {
    const {
      name,
      type,
      rarity,
      requiresAttunement,
      minValue,
      maxValue,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filter
    const filter = {};

    // Filter by name (partial match)
    if (name) {
      filter.name = { [Op.iLike]: `%${name}%` };
    }

    // Filter by type
    if (type) {
      filter.type = type;
    }

    // Filter by rarity
    if (rarity) {
      filter.rarity = rarity;
    }

    // Filter by attunement requirement
    if (requiresAttunement !== undefined) {
      filter.requiresAttunement = requiresAttunement === "true";
    }

    // Filter by value range
    if (minValue || maxValue) {
      filter.value = {};
      if (minValue) {
        filter.value[Op.gte] = parseInt(minValue);
      }
      if (maxValue) {
        filter.value[Op.lte] = parseInt(maxValue);
      }
    }

    // Include user's custom items or only show official ones
    if (req.user) {
      filter[Op.or] = [{ isCustom: false }, { createdBy: req.user.id }];
    } else {
      filter.isCustom = false;
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Get items
    const { count, rows: items } = await Item.findAndCountAll({
      where: filter,
      order: [
        ["type", "ASC"],
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
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get item by ID
 * @route   GET /api/items/:id
 * @access  Public
 */
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item não encontrado",
      });
    }

    // If it's a custom item, verify access
    if (item.isCustom) {
      if (!req.user || item.createdBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Você não tem permissão para acessar este item",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom item
 * @route   POST /api/items
 * @access  Private
 */
exports.createItem = async (req, res, next) => {
  try {
    // Set custom item attributes
    const itemData = {
      ...req.body,
      isCustom: true,
      createdBy: req.user.id,
    };

    // Create item
    const item = await Item.create(itemData);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a custom item
 * @route   PUT /api/items/:id
 * @access  Private
 */
exports.updateItem = async (req, res, next) => {
  try {
    let item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item não encontrado",
      });
    }

    // Verify ownership of custom item
    if (!item.isCustom || item.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para atualizar este item",
      });
    }

    // Update item
    item = await item.update(req.body);

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a custom item
 * @route   DELETE /api/items/:id
 * @access  Private
 */
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item não encontrado",
      });
    }

    // Verify ownership of custom item
    if (!item.isCustom || item.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para excluir este item",
      });
    }

    // Delete item
    await item.destroy();

    res.status(200).json({
      success: true,
      message: "Item excluído com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get items by type
 * @route   GET /api/items/type/:itemType
 * @access  Public
 */
exports.getItemsByType = async (req, res, next) => {
  try {
    const { itemType } = req.params;
    const { rarity } = req.query;

    const filter = {
      type: itemType,
    };

    // Filter by rarity
    if (rarity) {
      filter.rarity = rarity;
    }

    // Include user's custom items or only show official ones
    if (req.user) {
      filter[Op.or] = [{ isCustom: false }, { createdBy: req.user.id }];
    } else {
      filter.isCustom = false;
    }

    const items = await Item.findAll({
      where: filter,
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get items by rarity
 * @route   GET /api/items/rarity/:rarity
 * @access  Public
 */
exports.getItemsByRarity = async (req, res, next) => {
  try {
    const { rarity } = req.params;
    const { type } = req.query;

    const filter = {
      rarity: rarity,
    };

    // Filter by type
    if (type) {
      filter.type = type;
    }

    // Include user's custom items or only show official ones
    if (req.user) {
      filter[Op.or] = [{ isCustom: false }, { createdBy: req.user.id }];
    } else {
      filter.isCustom = false;
    }

    const items = await Item.findAll({
      where: filter,
      order: [
        ["type", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};
