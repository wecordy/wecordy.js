import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { APIConstants } from '../util/Constants';
import { RESTError, TokenError } from '../errors';

/**
 * Configuration options for the REST client.
 */
export interface RESTOptions {
  /** Base URL for the API (default: http://localhost:3000/api) */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** Maximum number of retries for transient errors (default: 3) */
  maxRetries?: number;
  /** Custom headers to include in every request */
  headers?: Record<string, string>;
}

/**
 * HTTP REST client for communicating with the Wecordy API.
 *
 * Features:
 * - Automatic `Bot <token>` authorization header
 * - Rate limit handling with Retry-After
 * - Automatic retry for transient (5xx) errors with exponential backoff
 * - Structured error wrapping via RESTError
 */
export class RESTClient {
  /** The Axios instance */
  private readonly http: AxiosInstance;

  /** The bot token, set via setToken() */
  private token: string | null = null;

  /** Maximum number of retries for transient errors */
  private readonly maxRetries: number;

  constructor(options: RESTOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;

    this.http = axios.create({
      baseURL: options.baseURL ?? APIConstants.DEFAULT_API_BASE,
      timeout: options.timeout ?? 15000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Request interceptor: attach authorization header
    this.http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.token) {
        config.headers.set('Authorization', `Bot ${this.token}`);
      }
      return config;
    });
  }

  /**
   * Sets the bot token for API authorization.
   * @param token - The bot token
   */
  setToken(token: string): void {
    if (!token || typeof token !== 'string') {
      throw new TokenError('Token must be a non-empty string.');
    }
    this.token = token;
  }

  /**
   * Performs a GET request.
   * @param path - API path (e.g., /v1/servers)
   * @param config - Optional axios config overrides
   */
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', path, undefined, config);
  }

  /**
   * Performs a POST request.
   * @param path - API path
   * @param data - Request body
   * @param config - Optional axios config overrides
   */
  async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', path, data, config);
  }

  /**
   * Performs a PATCH request.
   * @param path - API path
   * @param data - Request body
   * @param config - Optional axios config overrides
   */
  async patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', path, data, config);
  }

  /**
   * Performs a PUT request.
   * @param path - API path
   * @param data - Request body
   * @param config - Optional axios config overrides
   */
  async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', path, data, config);
  }

  /**
   * Performs a DELETE request.
   * @param path - API path
   * @param config - Optional axios config overrides
   */
  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', path, undefined, config);
  }

  /**
   * Core request method with retry and rate limit logic.
   */
  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    attempt: number = 0,
  ): Promise<T> {
    try {
      const response: AxiosResponse = await this.http.request({
        method,
        url: path,
        data,
        ...config,
      });

      // The backend wraps responses in ServiceResponse { data, items, message, success, ... }
      // We extract the inner data or items if the response follows that pattern
      const body = response.data;
      if (body && typeof body === 'object') {
        if ('data' in body) return body.data as T;
        if ('items' in body) return body.items as T;
      }
      return body as T;
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || !error.response) {
        // Network error or timeout — retry if possible
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * 2 ** attempt, 10000);
          await this.sleep(delay);
          return this.request<T>(method, path, data, config, attempt + 1);
        }
        throw new RESTError(
          0,
          error instanceof Error ? error.message : 'Network error',
          method,
          path,
        );
      }

      const status = error.response.status;
      const responseBody = error.response.data;

      // Rate limited (429) — wait and retry
      if (status === 429) {
        const retryAfter = this.parseRetryAfter(error.response);
        await this.sleep(retryAfter);
        return this.request<T>(method, path, data, config, attempt + 1);
      }

      // Server errors (5xx) — retry with backoff
      if (status >= 500 && attempt < this.maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await this.sleep(delay);
        return this.request<T>(method, path, data, config, attempt + 1);
      }

      // Client errors (4xx) — do not retry, throw immediately
      const message = this.extractErrorMessage(responseBody);
      throw new RESTError(status, message, method, path, responseBody);
    }
  }

  /**
   * Extracts the error message from a backend ServiceResponse.
   */
  private extractErrorMessage(body: unknown): string {
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (typeof obj.message === 'string') return obj.message;
      if (Array.isArray(obj.errors) && obj.errors.length > 0) {
        return obj.errors.map((e: { message?: string }) => e.message).join(', ');
      }
    }
    return 'Unknown API error';
  }

  /**
   * Parses the Retry-After header from a 429 response.
   * Returns the delay in milliseconds.
   */
  private parseRetryAfter(response: AxiosResponse): number {
    const retryAfter = response.headers['retry-after'];
    if (retryAfter) {
      const seconds = parseFloat(retryAfter);
      if (!isNaN(seconds)) return seconds * 1000;
    }
    // Default: 5 seconds
    return 5000;
  }

  /**
   * Promise-based sleep utility.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
