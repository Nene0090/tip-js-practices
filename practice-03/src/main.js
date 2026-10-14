"use strict";

import { demoTasks, variantTasks } from "./data.js";
import {
  findTaskById,
  setTaskCompleted,
  removeTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import {
  renderTaskList,
  renderSummary,
  renderEmptyState,
} from "./task-view.js";

const params = new URLSearchParams(location.search);
const initialTasks = params.get("dataset") === "variant" ? variantTasks : demoTasks;

let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";

const listElement = document.querySelector("#task-list");
const summaryElement = document.querySelector("#task-summary");
const emptyMessage = document.querySelector("#empty-message");
const operationMessage = document.querySelector("#operation-message");
const filterContainer = document.querySelector("#task-filters");

function clearOperationMessage() {
  operationMessage.textContent = "";
  operationMessage.hidden = true;
}

function showOperationMessage(text) {
  operationMessage.textContent = text;
  operationMessage.hidden = false;
}

function updateFilterButtons() {
  for (const button of filterContainer.querySelectorAll("button[data-filter]")) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

export function renderApp() {
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

export function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !listElement.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

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

  let result;
  if (action === "toggle") {
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    result = removeTask(currentTasks, id);
  }

  if (!result.ok) {
    showOperationMessage(`Ошибка: ${result.error}`);
    return;
  }

  currentTasks = result.tasks;
  clearOperationMessage();
  renderApp();
  restoreTaskFocus(id, action);
}

export function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (!button || !filterContainer.contains(button)) return;

  const filter = button.dataset.filter;
  if (filter !== "all" && filter !== "pending" && filter !== "completed") return;

  currentFilter = filter;
  clearOperationMessage();
  renderApp();
}

listElement.addEventListener("click", handleTaskListClick);
filterContainer.addEventListener("click", handleFilterClick);

renderApp();