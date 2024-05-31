class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.statusCode = code;
    this.message = message;
  }
}

module.exports = AppError;
