// services/events-service/src/errors.js

// Bază pentru erori HTTP
export class HttpError extends Error {
  constructor(statusCode = 500, message = 'Internal Server Error', code = 'ERR_INTERNAL') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// Helper-i simpli pentru aruncat erori din rute/servicii
export function BadRequest(message = 'Bad Request', code = 'ERR_BAD_REQUEST') {
  return new HttpError(400, message, code);
}

export function Unauthorized(message = 'Unauthorized', code = 'ERR_UNAUTHORIZED') {
  return new HttpError(401, message, code);
}

export function Forbidden(message = 'Forbidden', code = 'ERR_FORBIDDEN') {
  return new HttpError(403, message, code);
}

export function NotFound(message = 'Not Found', code = 'ERR_NOT_FOUND') {
  return new HttpError(404, message, code);
}

export function Conflict(message = 'Conflict', code = 'ERR_CONFLICT') {
  return new HttpError(409, message, code);
}

export function Internal(message = 'Internal Server Error', code = 'ERR_INTERNAL') {
  return new HttpError(500, message, code);
}

// Middleware Express pentru tratarea erorilor
// (folosit în src/index.js: app.use(errorHandler))
export function errorHandler(err, req, res, _next) {
  // Erori deja tip HttpError
  if (err instanceof HttpError) {
    const payload = {
      statusCode: err.statusCode,
      code: err.code || 'ERR_HTTP',
      error: err.name || 'HttpError',
      message: err.message || 'Error',
    };
    // poți loga aici dacă vrei
    return res.status(err.statusCode).json(payload);
  }

  // Erori generice (ex: aruncate de prisma sau alte librării)
  const statusCode = Number(err?.statusCode || 500);
  const code = err?.code || 'ERR_INTERNAL';
  const message = err?.message || 'Internal Server Error';

  return res.status(statusCode >= 400 && statusCode <= 599 ? statusCode : 500).json({
    statusCode: statusCode >= 400 && statusCode <= 599 ? statusCode : 500,
    code,
    error: err?.name || 'Error',
    message,
  });
}
