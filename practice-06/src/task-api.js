"use strict";

import { ApiError } from "./api-client.js";

const PRIORITIES = ["low", "medium", "high"];
const FILTER_KEYS = new Set(["completed", "priority", "categoryId", "q"]);

function isPositiveInt(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function normalizeFilters(filters) {
  if (filters === undefined || filters === null) return {};
  if (typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("filters должен быть обычным объектом");
  }

  const normalized = {};
  for (const key of Object.keys(filters)) {
    if (!FILTER_KEYS.has(key)) throw new TypeError(`Неизвестный фильтр: ${key}`);
  }

  if (filters.completed !== undefined) {
    if (typeof filters.completed !== "boolean") {
      throw new TypeError("completed должен быть boolean");
    }
    normalized.completed = filters.completed;
  }

  if (filters.priority !== undefined) {
    if (!PRIORITIES.includes(filters.priority)) {
      throw new TypeError("priority должен быть low, medium или high");
    }
    normalized.priority = filters.priority;
  }

  if (filters.categoryId !== undefined) {
    if (!isPositiveInt(filters.categoryId)) {
      throw new TypeError("categoryId должен быть положительным целым");
    }
    normalized.categoryId = filters.categoryId;
  }

  if (filters.q !== undefined) {
    if (typeof filters.q !== "string") throw new TypeError("q должен быть строкой");
    const trimmed = filters.q.trim();
    if (trimmed.length > 100) throw new TypeError("q не должен быть длиннее 100 символов");
    normalized.q = trimmed;
  }

  return normalized;
}

function assertTask(task) {
  if (!task || typeof task !== "object") {
    throw new ApiError("Некорректная задача", { kind: "invalid-response" });
  }
  if (!isPositiveInt(task.id)) {
    throw new ApiError("Некорректный id задачи", { kind: "invalid-response" });
  }
  if (typeof task.title !== "string") {
    throw new ApiError("Некорректное название задачи", { kind: "invalid-response" });
  }
  const trimmed = task.title.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new ApiError("Недопустимая длина названия", { kind: "invalid-response" });
  }
  if (typeof task.completed !== "boolean") {
    throw new ApiError("Некорректный completed", { kind: "invalid-response" });
  }
  if (!PRIORITIES.includes(task.priority)) {
    throw new ApiError("Некорректный priority", { kind: "invalid-response" });
  }
  if (!isPositiveInt(task.categoryId)) {
    throw new ApiError("Некорректный categoryId", { kind: "invalid-response" });
  }
  return task;
}

function assertTaskList(payload) {
  if (!payload || typeof payload !== "object") {
    throw new ApiError("Ответ списка задач некорректен", { kind: "invalid-response" });
  }
  if (!Array.isArray(payload.data)) {
    throw new ApiError("data должен быть массивом", { kind: "invalid-response" });
  }
  const seen = new Set();
  for (const task of payload.data) {
    assertTask(task);
    if (seen.has(task.id)) {
      throw new ApiError("Повторяющийся id задачи", { kind: "invalid-response" });
    }
    seen.add(task.id);
  }
  if (!payload.meta || typeof payload.meta !== "object") {
    throw new ApiError("meta отсутствует", { kind: "invalid-response" });
  }
  if (payload.meta.total !== payload.data.length) {
    throw new ApiError("meta.total не совпадает с длиной data", { kind: "invalid-response" });
  }
  return payload.data;
}

function assertCategory(category) {
  if (!category || typeof category !== "object") {
    throw new ApiError("Некорректная категория", { kind: "invalid-response" });
  }
  if (!isPositiveInt(category.id)) {
    throw new ApiError("Некорректный id категории", { kind: "invalid-response" });
  }
  if (typeof category.name !== "string" || category.name.trim().length === 0) {
    throw new ApiError("Некорректное имя категории", { kind: "invalid-response" });
  }
  return category;
}

function assertCategoryList(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw new ApiError("Ответ категорий некорректен", { kind: "invalid-response" });
  }
  const seen = new Set();
  for (const category of payload.data) {
    assertCategory(category);
    if (seen.has(category.id)) {
      throw new ApiError("Повторяющийся id категории", { kind: "invalid-response" });
    }
    seen.add(category.id);
  }
  return payload.data;
}

function assertDeleteResult(value) {
  if (value !== null) {
    throw new ApiError("DELETE должен возвращать 204 без тела", { kind: "invalid-response" });
  }
  return null;
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi: клиент должен содержать requestJson");
  }

  async function getTasks(filters = {}, options = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, signal: options.signal });
    const tasks = assertTaskList(payload);
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id, options = {}) {
    if (!isPositiveInt(id)) throw new TypeError("id должен быть положительным целым");
    const payload = await client.requestJson(`/tasks/${id}`, { signal: options.signal });
    if (!payload || typeof payload !== "object" || !("data" in payload)) {
      throw new ApiError("Ответ одной задачи некорректен", { kind: "invalid-response" });
    }
    return assertTask(payload.data);
  }

  async function getCategories(options = {}) {
    const payload = await client.requestJson("/categories", { signal: options.signal });
    const categories = assertCategoryList(payload);
    return categories;
  }

  async function createTask(draft, options = {}) {
    const body = normalizeFilters ? { ...draft } : draft;
    const payload = await client.requestJson("/tasks", {
      method: "POST",
      body: {
        title: body.title,
        priority: body.priority,
        categoryId: body.categoryId,
      },
      signal: options.signal,
    });
    if (!payload || typeof payload !== "object" || !("data" in payload)) {
      throw new ApiError("Ответ создания задачи некорректен", { kind: "invalid-response" });
    }
    return assertTask(payload.data);
  }

  async function updateTask(id, changes, options = {}) {
    if (!isPositiveInt(id)) throw new TypeError("id должен быть положительным целым");
    if (!changes || typeof changes !== "object") {
      throw new TypeError("changes должен быть объектом");
    }
    const body = { ...changes };
    if ("title" in body) body.title = String(body.title);
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body,
      signal: options.signal,
    });
    if (!payload || typeof payload !== "object" || !("data" in payload)) {
      throw new ApiError("Ответ обновления задачи некорректен", { kind: "invalid-response" });
    }
    return assertTask(payload.data);
  }

  async function setTaskCompleted(id, completed, options = {}) {
    if (!isPositiveInt(id)) throw new TypeError("id должен быть положительным целым");
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть boolean");
    }
    return updateTask(id, { completed }, options);
  }

  async function deleteTask(id, options = {}) {
    if (!isPositiveInt(id)) throw new TypeError("id должен быть положительным целым");
    const result = await client.requestJson(`/tasks/${id}`, {
      method: "DELETE",
      signal: options.signal,
    });
    return assertDeleteResult(result);
  }

  async function resetDemoData(options = {}) {
    const payload = await client.requestJson("/debug/reset", {
      method: "POST",
      signal: options.signal,
    });
    if (!payload || typeof payload !== "object" || !payload.data
        || payload.data.reset !== true
        || !Number.isSafeInteger(payload.data.total)) {
      throw new ApiError("Ответ сброса некорректен", { kind: "invalid-response" });
    }
    return { reset: true, total: payload.data.total };
  }

  async function loadInitialData(filters = {}, options = {}) {
    const [tasksResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return {
      tasks: tasksResult.tasks,
      categories,
      meta: tasksResult.meta,
    };
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
    loadInitialData,
  };
}