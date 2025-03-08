const { verifyToken } = require("../utils/jwt");

/**
 * Middleware para verificar se o usuário está autenticado
 */
exports.protect = (req, res, next) => {
  try {
    // Obtém o token do cabeçalho de autorização
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Acesso não autorizado. Token não fornecido.",
      });
    }

    // Extrai o token
    const token = authHeader.split(" ")[1];

    // Verifica o token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou expirado.",
      });
    }

    // Adiciona os dados do usuário ao objeto de requisição
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Erro na autenticação.",
    });
  }
};

/**
 * Middleware para verificar permissões de usuário
 * @param {Array} roles - Array de roles permitidas
 */
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Acesso não autorizado.",
      });
    }

    // Verifica se o usuário tem a role necessária
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permissão negada para este recurso.",
      });
    }

    next();
  };
};
