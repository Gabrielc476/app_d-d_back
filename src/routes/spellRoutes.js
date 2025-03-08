const express = require("express");
const router = express.Router();
const spellController = require("../controllers/spellController");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", spellController.getSpells);
router.get("/:id", spellController.getSpell);
router.get("/class/:className", spellController.getSpellsByClass);

// Protected routes for custom spells
router.post("/", protect, spellController.createSpell);
router.put("/:id", protect, spellController.updateSpell);
router.delete("/:id", protect, spellController.deleteSpell);

module.exports = router;
