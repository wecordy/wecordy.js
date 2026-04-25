/**
 * Base error class for all Wecordy SDK errors.
 * Provides structured error information with error codes.
 */
export class WecordyError extends Error {
  /** A machine-readable error code */
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'WecordyError';

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WecordyError);
    }
  }
}

/**
 * Error thrown when a REST API request fails.
 * Contains HTTP status code and the raw response body for debugging.
 */
export class RESTError extends WecordyError {
  /** HTTP status code (e.g. 404, 401, 500) */
  public readonly httpStatus: number;

  /** The raw response body from the API, if available */
  public readonly rawResponse: unknown;

  /** The HTTP method used (GET, POST, etc.) */
  public readonly method: string;

  /** The URL path that was requested */
  public readonly path: string;

  constructor(
    httpStatus: number,
    message: string,
    method: string,
    path: string,
    rawResponse?: unknown,
  ) {
    super('REST_ERROR', `${method} ${path} — ${httpStatus}: ${message}`);
    this.name = 'RESTError';
    this.httpStatus = httpStatus;
    this.rawResponse = rawResponse;
    this.method = method;
    this.path = path;
  }

  /**
   * Whether this error indicates a rate limit (HTTP 429).
   */
  get isRateLimit(): boolean {
    return this.httpStatus === 429;
  }

  /**
   * Whether this error indicates an authentication failure (HTTP 401).
   */
  get isAuthError(): boolean {
    return this.httpStatus === 401;
  }

  /**
   * Whether this error is a server error (5xx).
   */
  get isServerError(): boolean {
    return this.httpStatus >= 500;
  }
}

/**
 * Error thrown when a WebSocket connection error occurs.
 * Contains the close code and reason for debugging.
 */
export class WebSocketError extends WecordyError {
  /** The WebSocket close code, if applicable */
  public readonly closeCode: number | null;

  /** The WebSocket close reason, if applicable */
  public readonly closeReason: string | null;

  constructor(message: string, closeCode?: number, closeReason?: string) {
    super('WEBSOCKET_ERROR', message);
    this.name = 'WebSocketError';
    this.closeCode = closeCode ?? null;
    this.closeReason = closeReason ?? null;
  }
}

/**
 * Error thrown when a required token is missing or invalid.
 */
export class TokenError extends WecordyError {
  constructor(message: string = 'An invalid or missing token was provided.') {
    super('TOKEN_INVALID', message);
    this.name = 'TokenError';
  }
}

/**
 * Error thrown when a validation error occurs (e.g., invalid command name format).
 */
export class ValidationError extends WecordyError {
  /** The property that failed validation */
  public readonly property: string;

  constructor(property: string, message: string) {
    super('VALIDATION_ERROR', `Validation failed for "${property}": ${message}`);
    this.name = 'ValidationError';
    this.property = property;
  }
}
