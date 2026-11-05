"use strict";

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.url = options.url;
    this.cause = options.cause;
  }
}

export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== "string" || baseUrl.length === 0) {
    throw new TypeError("baseUrl должен быть непустой строкой");
  }
  if (typeof path !== "string" || path.length === 0) {
    throw new TypeError("path должен быть непустой строкой");
  }

  let parsedBase;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL");
  }

  if (parsedBase.protocol !== "http:" && parsedBase.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать http или https");
  }
  if (parsedBase.search !== "" || parsedBase.hash !== "") {
    throw new TypeError("baseUrl не должен содержать query или hash");
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(`${normalizedBase}/${normalizedPath}`);

  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function classifyFetchError(error, url) {
  if (error && error.name === "TimeoutError") {
    return new ApiError("Превышено время ожидания запроса", { kind: "timeout", url, cause: error });
  }
  if (error && error.name === "AbortError") {
    return new ApiError("Запрос был отменён", { kind: "aborted", url, cause: error });
  }
  return new ApiError("Не удалось выполнить сетевой запрос", { kind: "network", url, cause: error });
}

async function httpError(response, url) {
  let code;
  let details;
  let message = `HTTP ${response.status}`;

  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      if (payload && typeof payload === "object" && payload.error) {
        code = payload.error.code;
        details = payload.error.details;
        if (typeof payload.error.message === "string" && payload.error.message.length > 0) {
          message = payload.error.message;
        }
      }
    }
  } catch {
    // тело ошибки может быть недоступно
  }

  return new ApiError(message, { kind: "http", status: response.status, code, details, url });
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 2000 } = {}) {
  if (typeof baseUrl !== "string" || baseUrl.length === 0) {
    throw new TypeError("createApiClient: baseUrl обязателен");
  }
  if (typeof fetchFn !== "function") {
    throw new TypeError("createApiClient: fetchFn должен быть функцией");
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isInteger(timeoutMs)) {
    throw new TypeError("createApiClient: timeoutMs должен быть положительным целым");
  }

  async function requestJson(path, { method = "GET", query, body, signal, timeoutMs: requestTimeout } = {}) {
    const normalizedMethod = String(method).toUpperCase();
    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      throw new TypeError(`Метод ${normalizedMethod} не поддерживается`);
    }
    if (normalizedMethod === "GET" && body !== undefined) {
      throw new TypeError("GET не должен содержать тело");
    }

    const url = buildUrl(baseUrl, path, query);
    const headers = { Accept: "application/json" };

    let payload;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const effectiveTimeout = requestTimeout ?? timeoutMs;
    const timeoutSignal = AbortSignal.timeout(effectiveTimeout);
    const combinedSignal = signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal;

    let response;
    try {
      response = await fetchFn(url, {
        method: normalizedMethod,
        headers,
        body: payload,
        signal: combinedSignal,
      });
    } catch (error) {
      throw classifyFetchError(error, url);
    }

    if (!(response instanceof Response)) {
      throw new ApiError("Источник вернул не Response", { kind: "invalid-response", url });
    }

    if (!response.ok) {
      throw await httpError(response, url);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError("Ожидался JSON Content-Type", { kind: "invalid-response", url });
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("Не удалось разобрать JSON", { kind: "invalid-response", url, cause: error });
    }
  }

  return { requestJson };
}