"use strict";

import { demoTasks, variantTasks } from "./data.js";
import {
  addTask,
  updateTask,
  setTaskCompleted,
  removeTask,
  findTaskById,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import {
  renderTaskList,
  renderSummary,
  renderEmptyState,
} from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, saveTasks, removeSavedTasks } from "./task-storage.js";

const params = new URLSearchParams(location.search);
const dataset = params.get("dataset") === "variant" ? "variant" : "demo";
const mode = params.get("mode");

const STORAGE_PREFIX = "tip-js-practice-04";
const storageKey =
  mode === "check"
    ? `${STORAGE_PREFIX}:checks:${params.get("checkId") ?? "default"}`
    : `${STORAGE_PREFIX}:${dataset}`;

const initialTasksSource = dataset === "variant" ? variantTasks : demoTasks;

const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyMessage = document.querySelector("#empty-message");
const operationMessage = document.querySelector("#operation-message");
const filterContainer = document.querySelector("#task-filters");

const form = document.querySelector("#task-form");
const idInput = form.querySelector('input[name="id"]');
const titleInput = form.querySelector('input[name="title"]');
const priorityInput = form.querySelector('select[name="priority"]');
const formTitleElement = document.querySelector("#form-title");
const submitButton = form.querySelector('button[type="submit"]');
const cancelButton = document.querySelector("#form-cancel");
const resetStorageButton = document.querySelector("#storage-reset");
const errorBoxes = {
  id: document.querySelector('[data-error-for="id"]'),
  title: document.querySelector('[data-error-for="title"]'),
  priority: document.querySelector('[data-error-for="priority"]'),
};

let currentTasks = [];
let currentFilter = "all";
let editingId = null;

function clearOperationMessage() {
  operationMessage.textContent = "";
  operationMessage.hidden = true;
}

function showOperationMessage(text) {
  operationMessage.textContent = text;
  operationMessage.hidden = false;
}

function clearFieldError(field) {
  const box = errorBoxes[field];
  if (box) box.textContent = "";
}

function clearAllFieldErrors() {
  for (const field of Object.keys(errorBoxes)) clearFieldError(field);
}

function showFormErrors(errors) {
  clearAllFieldErrors();
  for (const [field, message] of Object.entries(errors)) {
    const box = errorBoxes[field];
    if (box) box.textContent = message;
  }
}

function setFormMode(id) {
  clearAllFieldErrors();
  form.reset();

  if (id === null) {
    editingId = null;
    idInput.disabled = false;
    formTitleElement.textContent = "Добавление задачи";
    submitButton.textContent = "Добавить задачу";
    cancelButton.hidden = true;
    idInput.focus();
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) {
    showOperationMessage(`Не удалось перейти в режим редактирования: задача с id ${id} не найдена.`);
    return;
  }

  editingId = task.id;
  idInput.value = String(task.id);
  idInput.disabled = true;
  titleInput.value = task.title;
  priorityInput.value = task.priority;
  formTitleElement.textContent = "Редактирование задачи";
  submitButton.textContent = "Сохранить изменения";
  cancelButton.hidden = false;
  titleInput.focus();
}

function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(form);
  const draft = {
    id: formData.get("id"),
    title: formData.get("title"),
    priority: formData.get("priority"),
  };

  const validation = validateTaskDraft(draft, currentTasks, editingId);
  if (!validation.ok) {
    showFormErrors(validation.errors);
    return;
  }

  const { id, title, priority } = validation.value;
  const result =
    editingId === null
      ? addTask(currentTasks, id, title, priority)
      : updateTask(currentTasks, editingId, title, priority);

  if (!result.ok) {
    showOperationMessage(`Ошибка: ${result.error}`);
    return;
  }

  currentTasks = result.tasks;
  clearOperationMessage();

  const saved = saveTasks(localStorage, storageKey, currentTasks);
  if (!saved.ok) {
    showOperationMessage(`${saved.error} Изменение останется только в этой вкладке.`);
  }

  setFormMode(null);
  renderApp();
}

function updateFilterButtons() {
  for (const button of filterContainer.querySelectorAll("button[data-filter]")) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function renderApp() {
  const visible = getVisibleTasks(currentTasks, currentFilter);
  renderTaskList(listElement, visible);
  renderSummary(summaryElement, currentTasks, visible.length);
  renderEmptyState(emptyMessage, currentTasks.length, visible.length);
  updateFilterButtons();
}

function restoreTaskFocus(id, action) {
  const card = listElement.querySelector(`li[data-task-id="${id}"]`);
  if (card) {
    const button = card.querySelector(`button[data-action="${action}"]`);
    if (button) {
      button.focus();
      return;
    }
  }
  const activeFilter = filterContainer.querySelector("button.is-active");
  if (activeFilter) activeFilter.focus();
}

function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !listElement.contains(button)) return;

  const action = button.dataset.action;

  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    showOperationMessage("Некорректный идентификатор задачи.");
    return;
  }

  const task = findTaskById(currentTasks, id);
  if (!task) {
    showOperationMessage(`Задача с id ${id} не найдена.`);
    return;
  }

  if (action === "edit") {
    clearOperationMessage();
    setFormMode(id); // Без записи в storage
    return;
  }

  let result;
  if (action === "toggle") {
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else if (action === "delete") {
    result = removeTask(currentTasks, id);
  } else {
    return;
  }

  if (!result.ok) {
    showOperationMessage(`Ошибка: ${result.error}`);
    return;
  }

  currentTasks = result.tasks;

  if (action === "delete" && editingId === id) {
    setFormMode(null);
  }

  const saved = saveTasks(localStorage, storageKey, currentTasks);
  if (!saved.ok) {
    showOperationMessage(`${saved.error} Изменение останется только в этой вкладке.`);
  } else {
    clearOperationMessage();
  }

  renderApp();
  restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (!button || !filterContainer.contains(button)) return;

  const filter = button.dataset.filter;
  if (filter !== "all" && filter !== "pending" && filter !== "completed") return;

  currentFilter = filter;
  clearOperationMessage();
  renderApp(); // storage не трогаем
}

function handleFormInput(event) {
  if (!(event.target instanceof Element)) return;
  const field = event.target.getAttribute("name");
  if (field && Object.prototype.hasOwnProperty.call(errorBoxes, field)) {
    clearFieldError(field);
  }
}

// ---------- Сброс ----------
function handleResetStorage() {
  const removed = removeSavedTasks(localStorage, storageKey);
  if (!removed.ok) {
    showOperationMessage(removed.error);
  } else {
    showOperationMessage("Сохранённые данные удалены. Восстановлен исходный набор.");
  }

  currentTasks = initialTasksSource.map((task) => ({ ...task }));
  currentFilter = "all";
  setFormMode(null);
  renderApp();
}

function init() {
  const loaded = loadTasks(localStorage, storageKey, initialTasksSource);
  currentTasks = loaded.tasks;

  if (!loaded.ok) {
    showOperationMessage(`Данные не загружены: ${loaded.error}. Используется исходный набор.`);
  } else if (loaded.source === "storage") {
    showOperationMessage("Данные восстановлены из localStorage.");
  } else {
    clearOperationMessage();
  }

  form.addEventListener("submit", handleFormSubmit);
  form.addEventListener("input", handleFormInput);
  cancelButton.addEventListener("click", () => setFormMode(null));
  listElement.addEventListener("click", handleTaskListClick);
  filterContainer.addEventListener("click", handleFilterClick);
  resetStorageButton.addEventListener("click", handleResetStorage);

  setFormMode(null);
  renderApp();
}

init();