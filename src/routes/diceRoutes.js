const express = require("express");
const router = express.Router();
const diceController = require("../controllers/diceController");
const { protect } = require("../middleware/auth");

// Proteger todas as rotas
router.use(protect);

// Criar um novo lançamento de dados
router.post("/", diceController.createDiceRoll);

// Obter histórico de lançamentos de dados por usuário
router.get("/history", diceController.getUserDiceRolls);

// Obter histórico de lançamentos de dados por campanha
router.get("/campaign/:campaignId", diceController.getCampaignDiceRolls);

// Realizar rolagem rápida (apenas cálculo, sem persistência)
router.post("/quick", diceController.quickRoll);

module.exports = router;
