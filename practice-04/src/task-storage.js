"use strict";

export const STORAGE_VERSION = 1;

const PRIORITIES = ["low", "medium", "high"];
const TITLE_MAX = 100;

function isValidTask(value) {
  if (!value || typeof value !== "object") return false;
  const { id, title, completed, priority } = value;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) return false;
  if (typeof title !== "string") return false;
  const normalized = title.trim();
  if (normalized.length < 1 || normalized.length > TITLE_MAX) return false;
  if (normalized !== title) return false; // в storage уже должно быть нормализовано
  if (typeof completed !== "boolean") return false;
  if (!PRIORITIES.includes(priority)) return false;
  return true;
}

/** Проверяет весь массив и уникальность id. Не исправляет значение. */
export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const seen = new Set();
  for (const item of value) {
    if (!isValidTask(item)) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
  }
  return true;
}

function cloneTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

/**
 * @returns {{ok:true, tasks:Array, source:"initial"|"storage"}
 *         | {ok:false, tasks:Array, source:"fallback", error:string}}
 */
export function loadTasks(storage, key, fallbackTasks) {
  const fallback = cloneTasks(Array.isArray(fallbackTasks) ? fallbackTasks : []);

  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return {
      ok: false,
      tasks: fallback,
      source: "fallback",
      error: `Не удалось прочитать хранилище: ${error && error.message ? error.message : "неизвестная ошибка"}`,
    };
  }

  if (raw === null || raw === undefined) {
    return { ok: true, tasks: fallback, source: "initial" };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      tasks: fallback,
      source: "fallback",
      error: "Сохранённые данные повреждены: некорректный JSON.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      tasks: fallback,
      source: "fallback",
      error: "Сохранённые данные имеют неверную структуру.",
    };
  }

  if (parsed.version !== STORAGE_VERSION) {
    return {
      ok: false,
      tasks: fallback,
      source: "fallback",
      error: `Неподдерживаемая версия данных: ${parsed.version}.`,
    };
  }

  if (!isValidTaskList(parsed.tasks)) {
    return {
      ok: false,
      tasks: fallback,
      source: "fallback",
      error: "Сохранённый список задач не соответствует схеме.",
    };
  }

  return { ok: true, tasks: cloneTasks(parsed.tasks), source: "storage" };
}

/** @returns {{ok:true} | {ok:false, error:string}} */
export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Некорректный список задач: запись отменена." };
  }
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Не удалось сохранить данные: ${error && error.message ? error.message : "неизвестная ошибка"}`,
    };
  }
}

/** @returns {{ok:true} | {ok:false, error:string}} */
export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Не удалось удалить сохранённые данные: ${error && error.message ? error.message : "неизвестная ошибка"}`,
    };
  }
}