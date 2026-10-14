"use strict";

import { getTaskStats } from "./task-service.js";

const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export function createTaskElement(task) {
  const li = document.createElement("li");
  li.classList.add("task-card");
  li.dataset.taskId = String(task.id);
  if (task.completed) {
    li.classList.add("is-completed");
  }

  const title = document.createElement("h3");
  title.classList.add("task-title");
  title.textContent = task.title;
  li.append(title);

  const status = document.createElement("p");
  status.classList.add("task-status");
  status.textContent = task.completed ? "Выполнена" : "В работе";
  li.append(status);

  const priority = document.createElement("p");
  priority.classList.add("task-priority");
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;
  li.append(priority);

  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  toggleButton.setAttribute("aria-pressed", String(task.completed));
  const toggleLabel = document.createElement("span");
  toggleLabel.classList.add("action-label");
  toggleLabel.textContent = "Выполнена";
  toggleButton.append(toggleLabel);
  actions.append(toggleButton);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  const deleteLabel = document.createElement("span");
  deleteLabel.classList.add("action-label");
  deleteLabel.textContent = "Удалить";
  deleteButton.append(deleteLabel);
  actions.append(deleteButton);

  li.append(actions);

  return li;
}

export function renderTaskList(listElement, tasks) {
  const cards = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...cards);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const { total, completed, pending, progress } = getTaskStats(tasks);

  summaryElement.querySelector('[data-stat="total"]').textContent = String(total);
  summaryElement.querySelector('[data-stat="completed"]').textContent = String(completed);
  summaryElement.querySelector('[data-stat="pending"]').textContent = String(pending);
  summaryElement.querySelector('[data-stat="progress"]').textContent =
    total === 0 ? "0.0%" : `${progress.toFixed(1)}%`;
  summaryElement.querySelector('[data-stat="visible"]').textContent = String(visibleCount);
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
    return;
  }
  if (total === 0) {
    messageElement.textContent = "Список задач пуст.";
  } else {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
  }
  messageElement.hidden = false;
}