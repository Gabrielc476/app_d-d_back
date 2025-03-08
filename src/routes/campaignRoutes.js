const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const { protect } = require("../middleware/auth");

// Protect all routes
router.use(protect);

// Main CRUD routes
router.post("/", campaignController.createCampaign);
router.get("/", campaignController.getCampaigns);
router.get("/:id", campaignController.getCampaign);
router.put("/:id", campaignController.updateCampaign);
router.delete("/:id", campaignController.deleteCampaign);

// Character management in campaigns
router.post("/:id/characters", campaignController.addCharacterToCampaign);
router.delete(
  "/:id/characters/:characterId",
  campaignController.removeCharacterFromCampaign
);
router.put(
  "/:id/characters/:characterId",
  campaignController.updateCharacterStatus
);

module.exports = router;
