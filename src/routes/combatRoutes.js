const express = require("express");
const router = express.Router();
const combatController = require("../controllers/combatController");
const { protect } = require("../middleware/auth");

// Proteger todas as rotas
router.use(protect);

// CRUD para sessões de combate
router.post("/", combatController.createCombatSession);
router.get("/", combatController.listCombatSessions);
router.get("/:id", combatController.getCombatSession);

// Gerenciamento de participantes
router.post("/:combatSessionId/participants", combatController.addParticipant);
router.put(
  "/:combatSessionId/participants/:participantId",
  combatController.updateParticipant
);

// Controle de combate
router.post("/:id/start", combatController.startCombat);
router.post("/:id/next-turn", combatController.nextTurn);
router.post("/:id/toggle-status", combatController.toggleCombatStatus);
router.post("/:id/end", combatController.endCombat);

// Ações de combate
router.post("/:combatSessionId/actions", combatController.recordAction);
router.get("/:combatSessionId/actions", combatController.getCombatActions);

module.exports = router;
