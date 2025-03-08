const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { sequelize } = require("./config/database");
const jwt = require("jsonwebtoken");
const authConfig = require("./config/auth");

// Importação das rotas
const authRoutes = require("./routes/authRoutes");
const characterRoutes = require("./routes/characterRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const spellRoutes = require("./routes/spellRoutes");
const itemRoutes = require("./routes/itemRoutes");
const combatRoutes = require("./routes/combatRoutes");
const diceRoutes = require("./routes/diceRoutes");

// Middleware de erro
const errorMiddleware = require("./middleware/error");

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa o app Express
const app = express();
const httpServer = createServer(app);

// Configuração do Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware Socket.IO para autenticação
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Autenticação necessária"));
  }

  try {
    // Verificar o token JWT
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error("Token inválido"));
  }
});

// Middleware para disponibilizar io para controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/spells", spellRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/combat", combatRoutes);
app.use("/api/dice", diceRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API D&D funcionando!" });
});

// Middleware de tratamento de erros
app.use(errorMiddleware);

// Configuração Socket.IO para salas e eventos
io.on("connection", (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);

  // Entrar em uma sala de campanha
  socket.on("joinCampaign", (campaignId) => {
    socket.join(`campaign-${campaignId}`);
    console.log(
      `Cliente ${socket.id} entrou na sala da campanha ${campaignId}`
    );
  });

  // Entrar em uma sala de combate
  socket.on("joinCombat", (combatSessionId) => {
    socket.join(`combat-${combatSessionId}`);
    console.log(
      `Cliente ${socket.id} entrou na sala de combate ${combatSessionId}`
    );
  });

  // Evento de rolar dados para uma campanha
  socket.on("rollDice", async (data) => {
    const {
      campaignId,
      diceType,
      diceCount,
      modifier,
      rollType,
      rollLabel,
      advantage,
      disadvantage,
    } = data;

    // Implementar a lógica de rolagem
    const sides = parseInt(diceType.substring(1));
    let results = [];
    let total = 0;

    if (advantage || disadvantage) {
      const roll1 = Math.floor(Math.random() * sides) + 1;
      const roll2 = Math.floor(Math.random() * sides) + 1;

      results = [roll1, roll2];

      if (advantage) {
        total = Math.max(roll1, roll2) + (modifier || 0);
      } else {
        total = Math.min(roll1, roll2) + (modifier || 0);
      }
    } else {
      for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        results.push(roll);
        total += roll;
      }

      total += modifier || 0;
    }

    const rollResult = {
      userId: socket.user.id,
      username: socket.user.username,
      diceType,
      diceCount,
      modifier: modifier || 0,
      results,
      total,
      rollType,
      rollLabel,
      advantage,
      disadvantage,
      timestamp: new Date(),
    };

    // Emitir o resultado para todos na sala da campanha
    io.to(`campaign-${campaignId}`).emit("diceRollResult", rollResult);
  });

  // Evento de desconexão
  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Porta do servidor
const PORT = process.env.PORT || 3001;

// Inicia o servidor
const startServer = async () => {
  try {
    // Sincroniza o banco de dados
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");

    // Opcionalmente, sincronize os modelos com o banco de dados
    // Em produção, é recomendado usar migrations em vez disso
    // await sequelize.sync({ force: false });

    httpServer.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Socket.IO inicializado`);
    });
  } catch (error) {
    console.error("Não foi possível conectar ao banco de dados:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
