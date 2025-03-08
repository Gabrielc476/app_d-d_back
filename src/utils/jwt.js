const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");

/**
 * Gera um token JWT para o usuário
 * @param {Object} user - Objeto do usuário
 * @returns {String} Token JWT
 */
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn }
  );
};

/**
 * Verifica e decodifica um token JWT
 * @param {String} token - Token JWT
 * @returns {Object} - Payload decodificado ou null se inválido
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwtSecret);
  } catch (error) {
    return null;
  }
};
