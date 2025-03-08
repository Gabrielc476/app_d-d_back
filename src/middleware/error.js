/**
 * Middleware para tratamento de erros
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  // Erro do Sequelize
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Erro de validação",
      errors,
    });
  }

  // Erro de chave única
  if (err.name === "SequelizeUniqueConstraintError") {
    const errors = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Dados duplicados",
      errors,
    });
  }

  // Erro de chave estrangeira
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message:
        "Erro de referência. Verifique se todos os IDs fornecidos existem.",
    });
  }

  // Erro de banco de dados
  if (err.name === "SequelizeDatabaseError") {
    return res.status(500).json({
      success: false,
      message: "Erro de banco de dados",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Erro de banco de dados",
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Erro interno do servidor",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
};

module.exports = errorMiddleware;
