/**
 * Common Service - Handles common utility functions
 */

class CommonService {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  validateEmail(email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {boolean} Whether password is strong enough
   */
  validatePassword(password) {
    return password && password.length >= 6;
  }

  /**
   * Format success response
   * @param {any} data - Data to include in response
   * @param {string} message - Success message
   * @returns {Object} Success response object
   */
  formatSuccessResponse(data, message = "Success") {
    return {
      success: true,
      message,
      data
    };
  }

  /**
   * Format error response
   * @param {string} error - Error message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Error response object
   */
  formatErrorResponse(error, statusCode = 500) {
    return {
      success: false,
      error,
      statusCode
    };
  }

  /**
   * Paginate results
   * @param {Array} data - Data to paginate
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @returns {Object} Paginated results
   */
  paginateResults(data, page = 1, limit = 10, total) {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
      }
    };
  }

  /**
   * Generate unique token
   * @param {number} length - Length of token to generate
   * @returns {string} Generated token
   */
  generateToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }
}

export default new CommonService();