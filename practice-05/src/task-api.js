"use strict";

import { ApiError } from "./api-client.js";

const PRIORITIES = ["low", "medium", "high"];

function isValidTask(task) {
  if (!task || typeof task !== "object") return false;
  if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
  if (typeof task.title !== "string") return false;
  const title = task.title.trim();
  if (title.length < 1 || title.length > 100) return false;
  if (typeof task.completed !== "boolean") return false;
  if (!PRIORITIES.includes(task.priority)) return false;
  if (!Number.isSafeInteger(task.categoryId) || task.categoryId <= 0) return false;
  return true;
}

function isValidCategory(category) {
  if (!category || typeof category !== "object") return false;
  if (!Number.isSafeInteger(category.id) || category.id <= 0) return false;
  if (typeof category.name !== "string") return false;
  if (category.name.trim().length === 0) return false;
  return true;
}

function assertTaskList(payload, url) {
  if (!payload || typeof payload !== "object") {
    throw new ApiError("invalid-response", "Ответ не является объектом", { url });
  }

  if (!Array.isArray(payload.data)) {
    throw new ApiError("invalid-response", "data должен быть массивом", { url });
  }

  const seen = new Set();
  for (const task of payload.data) {
    if (!isValidTask(task)) {
      throw new ApiError("invalid-response", "Некорректная задача в ответе", { url });
    }
    if (seen.has(task.id)) {
      throw new ApiError("invalid-response", "Повторяющийся id задачи", { url });
    }
    seen.add(task.id);
  }

  if (!payload.meta || typeof payload.meta !== "object") {
    throw new ApiError("invalid-response", "meta отсутствует", { url });
  }

  if (payload.meta.total !== payload.data.length) {
    throw new ApiError("invalid-response", "meta.total не совпадает с длиной data", { url });
  }

  return payload.data;
}

function assertTask(task, url) {
  if (!isValidTask(task)) {
    throw new ApiError("invalid-response", "Некорректная задача", { url });
  }
  return task;
}

function assertCategoryList(payload, url) {
  if (!Array.isArray(payload)) {
    throw new ApiError("invalid-response", "Список категорий должен быть массивом", { url });
  }

  const seen = new Set();
  for (const category of payload) {
    if (!isValidCategory(category)) {
      throw new ApiError("invalid-response", "Некорректная категория", { url });
    }
    if (seen.has(category.id)) {
      throw new ApiError("invalid-response", "Повторяющийся id категории", { url });
    }
    seen.add(category.id);
  }

  return payload;
}

function normalizeFilters(filters = {}) {
  const normalized = {};

  if (filters.completed !== undefined) {
    if (typeof filters.completed !== "boolean") {
      throw new ApiError("invalid-response", "completed должен быть boolean");
    }
    normalized.completed = filters.completed;
  }

  if (filters.priority !== undefined) {
    if (!PRIORITIES.includes(filters.priority)) {
      throw new ApiError("invalid-response", "Недопустимый priority");
    }
    normalized.priority = filters.priority;
  }

  if (filters.categoryId !== undefined) {
    if (!Number.isSafeInteger(filters.categoryId) || filters.categoryId <= 0) {
      throw new ApiError("invalid-response", "categoryId должен быть положительным целым");
    }
    normalized.categoryId = filters.categoryId;
  }

  if (filters.q !== undefined) {
    if (typeof filters.q !== "string") {
      throw new ApiError("invalid-response", "q должен быть строкой");
    }
    if (filters.q.length <= 100) {
      normalized.q = filters.q;
    }
  }

  return normalized;
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new Error("createTaskApi: клиент должен содержать requestJson");
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const url = "/tasks";

    let payload;
    try {
      payload = await client.requestJson(url, { query });
    } catch (error) {
      throw error;
    }

    const tasks = assertTaskList(payload, url);
    return { tasks, meta: payload.meta };
  }

  async function getTaskById(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new ApiError("invalid-response", "id должен быть положительным целым");
    }

    const url = `/tasks/${id}`;
    const payload = await client.requestJson(url);
    return assertTask(payload, url);
  }

  async function getCategories() {
    const url = "/categories";
    const payload = await client.requestJson(url);
    return assertCategoryList(payload, url);
  }

  async function loadInitialData(filters = {}) {
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();

    const [tasksResult, categories] = await Promise.all([tasksPromise, categoriesPromise]);

    return {
      tasks: tasksResult.tasks,
      categories,
      meta: tasksResult.meta,
    };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}