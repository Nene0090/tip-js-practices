"use strict";

import { createServer } from "node:http";
import { tasks, categories } from "./data.js";

const DEFAULT_PORT = 5505;
const port = Number(process.argv[2] ?? process.env.PORT ?? DEFAULT_PORT);

const PRIORITIES = ["low", "medium", "high"];

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    ...extraHeaders,
  });
  res.end(body);
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(text),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(text);
}

function errorPayload(code, message, details) {
  return { error: { code, message, details } };
}

function parseQuery(searchParams) {
  const allowed = new Set(["completed", "priority", "categoryId", "q"]);
  const result = {};

  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) {
      return { ok: false, error: `Неизвестный параметр: ${key}` };
    }
  }

  if (searchParams.has("completed")) {
    const values = searchParams.getAll("completed");
    if (values.length > 1) return { ok: false, error: "Повторный параметр completed" };
    if (values[0] !== "true" && values[0] !== "false") {
      return { ok: false, error: "completed должен быть true или false" };
    }
    result.completed = values[0] === "true";
  }

  if (searchParams.has("priority")) {
    const values = searchParams.getAll("priority");
    if (values.length > 1) return { ok: false, error: "Повторный параметр priority" };
    if (!PRIORITIES.includes(values[0])) {
      return { ok: false, error: "Недопустимый priority" };
    }
    result.priority = values[0];
  }

  if (searchParams.has("categoryId")) {
    const values = searchParams.getAll("categoryId");
    if (values.length > 1) return { ok: false, error: "Повторный параметр categoryId" };
    const number = Number(values[0]);
    if (!Number.isSafeInteger(number) || number <= 0) {
      return { ok: false, error: "categoryId должен быть положительным целым" };
    }
    result.categoryId = number;
  }

  if (searchParams.has("q")) {
    const values = searchParams.getAll("q");
    if (values.length > 1) return { ok: false, error: "Повторный параметр q" };
    const text = values[0];
    if (typeof text !== "string" || text.length > 100) {
      return { ok: false, error: "q должен быть строкой до 100 символов" };
    }
    result.q = text;
  }

  return { ok: true, filters: result };
}

function filterTasks(filters) {
  return tasks.filter((task) => {
    if (filters.completed !== undefined && task.completed !== filters.completed) return false;
    if (filters.priority !== undefined && task.priority !== filters.priority) return false;
    if (filters.categoryId !== undefined && task.categoryId !== filters.categoryId) return false;
    if (filters.q !== undefined && filters.q !== "") {
      const needle = filters.q.toLowerCase();
      if (!task.title.toLowerCase().includes(needle)) return false;
    }
    return true;
  });
}

function handleTasks(req, res, url) {
  const parsed = parseQuery(url.searchParams);
  if (!parsed.ok) {
    sendJson(res, 400, errorPayload("INVALID_QUERY", parsed.error));
    return;
  }

  const list = filterTasks(parsed.filters);
  sendJson(res, 200, {
    data: list,
    meta: {
      total: list.length,
      filters: {
        completed: parsed.filters.completed ?? null,
        priority: parsed.filters.priority ?? null,
        categoryId: parsed.filters.categoryId ?? null,
        q: parsed.filters.q ?? "",
      },
    },
  });
}

function handleTaskById(res, id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    sendJson(res, 404, errorPayload("TASK_NOT_FOUND", `Задача с id ${id} не найдена.`, { id }));
    return;
  }
  sendJson(res, 200, task);
}

function handleCategories(res) {
  sendJson(res, 200, categories);
}

function handleCategoryById(res, id) {
  const category = categories.find((item) => item.id === id);
  if (!category) {
    sendJson(res, 404, errorPayload("CATEGORY_NOT_FOUND", `Категория с id ${id} не найдена.`, { id }));
    return;
  }
  sendJson(res, 200, category);
}

const server = createServer((req, res) => {
  const method = req.method ?? "GET";

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    });
    res.end();
    return;
  }

  if (method !== "GET") {
    sendJson(res, 405, errorPayload("METHOD_NOT_ALLOWED", "Метод не поддерживается"));
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/api/health") {
    sendJson(res, 200, { status: "ok", time: new Date().toISOString() });
    return;
  }

  if (pathname === "/api/tasks") {
    handleTasks(req, res, url);
    return;
  }

  const taskMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
  if (taskMatch) {
    handleTaskById(res, Number(taskMatch[1]));
    return;
  }

  if (pathname === "/api/categories") {
    handleCategories(res);
    return;
  }

  const categoryMatch = pathname.match(/^\/api\/categories\/(\d+)$/);
  if (categoryMatch) {
    handleCategoryById(res, Number(categoryMatch[1]));
    return;
  }

  if (pathname === "/api/debug/error") {
    sendJson(res, 503, errorPayload("SERVICE_UNAVAILABLE", "Сервис временно недоступен"));
    return;
  }

  if (pathname === "/api/debug/invalid-json") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end("{broken-json");
    return;
  }

  if (pathname === "/api/debug/text") {
    sendText(res, 200, "Это не JSON");
    return;
  }

  if (pathname === "/api/debug/delay") {
    const raw = url.searchParams.get("ms");
    const ms = raw === null ? 0 : Number(raw);
    if (!Number.isFinite(ms) || ms < 0 || ms > 5000) {
      sendJson(res, 400, errorPayload("INVALID_QUERY", "ms должен быть от 0 до 5000"));
      return;
    }
    setTimeout(() => {
      sendJson(res, 200, { delayed: true, ms });
    }, ms);
    return;
  }

  sendJson(res, 404, errorPayload("NOT_FOUND", "Маршрут не найден"));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Учебный API запущен: http://127.0.0.1:${port}/api`);
});