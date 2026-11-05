"use strict";

import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (error instanceof ApiError) {
    if (error.kind === "network") return "Нет соединения с сервером.";
    if (error.kind === "timeout") return "Сервер не ответил вовремя.";
    if (error.kind === "aborted") return "Запрос отменён.";
    if (error.kind === "http") {
      if (error.status === 404) return "Ресурс не найден.";
      if (error.status === 400) {
        return error.message || "Данные не прошли проверку.";
      }
      if (error.status === 503) return "Сервис временно недоступен.";
      return error.message || `Ошибка сервера (${error.status}).`;
    }
    if (error.kind === "invalid-response") return "Сервер вернул неверный ответ.";
    return error.message || "Не удалось выполнить операцию.";
  }
  return "Не удалось выполнить операцию.";
}

function isAborted(error) {
  return error instanceof ApiError && error.kind === "aborted";
}

export function createAppController({ api, view } = {}) {
  if (!api || typeof api.loadInitialData !== "function" || typeof api.getTasks !== "function") {
    throw new TypeError("createAppController: api обязателен");
  }
  if (!view || typeof view.setListState !== "function" || typeof view.setTasks !== "function") {
    throw new TypeError("createAppController: view обязателен");
  }

  let currentFilters = {};
  let categories = [];
  let lastTasks = [];
  let editingId = null;
  let activeController = null;
  let requestSequence = 0;
  let categoriesLoaded = false;

  function beginRequest() {
    requestSequence += 1;
    const sequence = requestSequence;
    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;
    return { sequence, signal: controller.signal };
  }

  function isCurrent(sequence) {
    return sequence === requestSequence;
  }

  function applyResult(tasks, meta) {
    lastTasks = tasks;
    view.setTasks(tasks, categories);
    view.setTotal(meta && Number.isSafeInteger(meta.total) ? meta.total : tasks.length);
    if (tasks.length === 0) {
      view.setListState("empty", "Нет задач по выбранному фильтру.");
    } else {
      view.setListState("ready", "");
    }
  }

  async function loadInitial(filters, sequence) {
    const result = await api.loadInitialData(filters, { signal: activeController.signal });
    if (!isCurrent(sequence)) return;
    categories = result.categories;
    categoriesLoaded = true;
    view.setCategories(categories);
    applyResult(result.tasks, result.meta);
  }

  async function loadList(filters, sequence) {
    const result = await api.getTasks(filters, { signal: activeController.signal });
    if (!isCurrent(sequence)) return;
    applyResult(result.tasks, result.meta);
  }

  async function reload(filters) {
    const { sequence, signal } = beginRequest();
    view.setListState("loading", "Загрузка…");
    try {
      if (!categoriesLoaded) {
        await loadInitial(filters, sequence);
      } else {
        await loadList(filters, sequence);
      }
    } catch (error) {
      if (!isCurrent(sequence)) return;
      if (isAborted(error) || (signal.aborted && isAborted(error))) return;
      view.setListState("error", messageForError(error));
    }
  }

  async function start(filters = {}) {
    currentFilters = { ...filters };
    editingId = null;
    view.setFormTask(null);
    await reload(currentFilters);
  }

  async function applyFilters(filters = {}) {
    currentFilters = { ...filters };
    editingId = null;
    view.setFormTask(null);
    await reload(currentFilters);
  }

  async function refresh() {
    await reload(currentFilters);
  }

  function beginEdit(id) {
    const task = lastTasks.find((item) => item.id === id);
    if (!task) return false;
    editingId = id;
    view.setFormTask(task);
    return true;
  }

  function cancelEdit() {
    editingId = null;
    view.setFormTask(null);
  }

  async function submit(draft) {
    const validation = validateTaskDraft(draft, categories);
    if (!validation.valid) {
      view.showFormErrors(validation.errors);
      return;
    }
    view.showFormErrors({});
    view.setMutationPending(true);
    try {
      if (editingId === null) {
        await api.createTask(validation.value);
        view.notify("Задача добавлена.", "success");
        view.setFormTask(null);
      } else {
        await api.updateTask(editingId, validation.value);
        view.notify("Задача обновлена.", "success");
        editingId = null;
        view.setFormTask(null);
      }
      await loadList(currentFilters, requestSequence);
    } catch (error) {
      if (isAborted(error)) return;
      view.notify(messageForError(error), "error");
    } finally {
      view.setMutationPending(false);
    }
  }

  async function toggleTask(id) {
    const task = lastTasks.find((item) => item.id === id);
    if (!task) return;
    view.setMutationPending(true);
    try {
      await api.setTaskCompleted(id, !task.completed);
      view.notify("Статус изменён.", "success");
      await loadList(currentFilters, requestSequence);
    } catch (error) {
      if (isAborted(error)) return;
      view.notify(messageForError(error), "error");
    } finally {
      view.setMutationPending(false);
    }
  }

  async function deleteTask(id) {
    view.setMutationPending(true);
    try {
      await api.deleteTask(id);
      view.notify("Задача удалена.", "success");
      if (editingId === id) {
        editingId = null;
        view.setFormTask(null);
      }
      await loadList(currentFilters, requestSequence);
    } catch (error) {
      if (isAborted(error)) return;
      view.notify(messageForError(error), "error");
    } finally {
      view.setMutationPending(false);
    }
  }

  async function resetData() {
    view.setMutationPending(true);
    try {
      await api.resetDemoData();
      view.notify("Данные восстановлены.", "success");
      await reload(currentFilters);
    } catch (error) {
      if (isAborted(error)) return;
      view.notify(messageForError(error), "error");
    } finally {
      view.setMutationPending(false);
    }
  }

  function destroy() {
    requestSequence += 1;
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  return {
    start,
    applyFilters,
    refresh,
    submit,
    beginEdit,
    cancelEdit,
    toggleTask,
    deleteTask,
    resetData,
    destroy,
    getEditingId: () => editingId,
    getTasks: () => lastTasks,
    getCategories: () => categories,
    getFilters: () => ({ ...currentFilters }),
  };
}