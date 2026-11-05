"use strict";

export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== "string" || baseUrl.length === 0) {
    throw new Error("baseUrl должен быть непустой строкой");
  }

  let parsedBase;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    throw new Error("baseUrl должен быть абсолютным URL");
  }

  if (parsedBase.protocol !== "http:" && parsedBase.protocol !== "https:") {
    throw new Error("baseUrl должен использовать http или https");
  }

  if (parsedBase.search !== "" || parsedBase.hash !== "") {
    throw new Error("baseUrl не должен содержать query или hash");
  }

  if (typeof path !== "string" || path.length === 0) {
    throw new Error("path должен быть непустой строкой");
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(`${normalizedBase}/${normalizedPath}`);

  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export class ApiError extends Error {
  constructor(kind, message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.url = options.url;
    this.cause = options.cause;
  }
}

function classifyFetchError(error, url) {
  if (error && error.name === "TimeoutError") {
    return new ApiError("timeout", "Превышено время ожидания запроса", {
      url,
      cause: error,
    });
  }

  if (error && error.name === "AbortError") {
    return new ApiError("aborted", "Запрос был отменён", {
      url,
      cause: error,
    });
  }

  return new ApiError("network", "Не удалось выполнить сетевой запрос", {
    url,
    cause: error,
  });
}

async function parseHttpError(response, url) {
  let code;
  let details;

  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      if (payload && typeof payload === "object" && payload.error) {
        code = payload.error.code;
        details = payload.error.details;
      }
    }
  } catch {
    // тело ошибки может быть недоступно или не JSON
  }

  return new ApiError("http", `HTTP ${response.status}`, {
    status: response.status,
    code,
    details,
    url,
  });
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 2000 } = {}) {
  if (typeof baseUrl !== "string" || baseUrl.length === 0) {
    throw new Error("createApiClient: baseUrl обязателен");
  }

  if (typeof fetchFn !== "function") {
    throw new Error("createApiClient: fetchFn должен быть функцией");
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("createApiClient: timeoutMs должен быть положительным числом");
  }

  async function requestJson(path, { query, signal, timeoutMs: requestTimeout } = {}) {
    const url = buildUrl(baseUrl, path, query);

    const effectiveTimeout = requestTimeout ?? timeoutMs;
    const timeoutSignal = AbortSignal.timeout(effectiveTimeout);

    let combinedSignal = timeoutSignal;
    if (signal) {
      combinedSignal = AbortSignal.any([timeoutSignal, signal]);
    }

    let response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: combinedSignal,
      });
    } catch (error) {
      throw classifyFetchError(error, url);
    }

    if (!(response instanceof Response)) {
      throw new ApiError("invalid-response", "fetchFn вернул не Response", { url });
    }

    if (!response.ok) {
      throw await parseHttpError(response, url);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError("invalid-response", "Ожидался JSON Content-Type", { url });
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("invalid-response", "Не удалось разобрать JSON", {
        url,
        cause: error,
      });
    }
  }

  return { requestJson };
}