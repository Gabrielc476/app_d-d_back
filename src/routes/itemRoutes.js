const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", itemController.getItems);
router.get("/:id", itemController.getItem);
router.get("/type/:itemType", itemController.getItemsByType);
router.get("/rarity/:rarity", itemController.getItemsByRarity);

// Protected routes for custom items
router.post("/", protect, itemController.createItem);
router.put("/:id", protect, itemController.updateItem);
router.delete("/:id", protect, itemController.deleteItem);

module.exports = router;
