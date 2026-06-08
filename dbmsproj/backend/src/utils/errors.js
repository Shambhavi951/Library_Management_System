export class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (message = 'Resource not found') => new AppError(message, 404, 'NOT_FOUND');
export const forbidden = (message = 'You do not have permission for this action') => new AppError(message, 403, 'FORBIDDEN');
export const badRequest = (message = 'Invalid request') => new AppError(message, 400, 'BAD_REQUEST');

