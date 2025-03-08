/**
 * Validation utility functions for the API
 */

/**
 * Validates an email string
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password string
 * @param {string} password - Password to validate
 * @returns {object} - Validation result and error message
 */
exports.validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: "Senha é obrigatória",
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Senha deve ter pelo menos 6 caracteres",
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - Whether the UUID is valid
 */
exports.isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates a date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - Whether the date is valid
 */
exports.isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Sanitizes a string for use in a database
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
exports.sanitizeString = (str) => {
  if (!str) return "";
  return str
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validates character level
 * @param {number} level - Level to validate
 * @returns {boolean} - Whether the level is valid
 */
exports.isValidLevel = (level) => {
  if (typeof level !== "number") return false;
  return level >= 1 && level <= 20;
};

/**
 * Validates ability score
 * @param {number} score - Score to validate
 * @returns {boolean} - Whether the score is valid
 */
exports.isValidAbilityScore = (score) => {
  if (typeof score !== "number") return false;
  return score >= 1 && score <= 30;
};

/**
 * Validates character hit points
 * @param {number} hp - Hit points to validate
 * @returns {boolean} - Whether the hit points value is valid
 */
exports.isValidHitPoints = (hp) => {
  if (typeof hp !== "number") return false;
  return hp >= 0 && hp <= 1000; // Upper limit is arbitrary but reasonable
};

/**
 * Creates an error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {object} - Error object
 */
exports.createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
