const express = require("express");
const router = express.Router();
const characterController = require("../controllers/characterController");
const { protect } = require("../middleware/auth");

// Protect all routes
router.use(protect);

// CRUD routes
router.post("/", characterController.createCharacter);
router.get("/", characterController.getCharacters);
router.get("/:id", characterController.getCharacter);
router.put("/:id", characterController.updateCharacter);
router.delete("/:id", characterController.deleteCharacter);

// Special routes
router.put("/:id/level-up", characterController.levelUpCharacter);
router.put("/:id/hit-points", characterController.updateHitPoints);

module.exports = router;
