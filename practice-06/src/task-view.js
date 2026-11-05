"use strict";

const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

function findCategoryName(categories, categoryId) {
  if (!Array.isArray(categories)) return "";
  const found = categories.find((category) => category.id === categoryId);
  return found ? found.name : "";
}

export function createTaskElement(task, categories) {
  const li = document.createElement("li");
  li.classList.add("task-card");
  li.dataset.taskId = String(task.id);
  if (task.completed) li.classList.add("is-completed");

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

  const category = document.createElement("p");
  category.classList.add("task-category");
  category.textContent = findCategoryName(categories, task.categoryId);
  li.append(category);

  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  toggleButton.setAttribute("aria-pressed", String(task.completed));
  const toggleLabel = document.createElement("span");
  toggleLabel.classList.add("action-label");
  toggleLabel.textContent = task.completed ? "Вернуть в работу" : "Выполнена";
  toggleButton.append(toggleLabel);
  actions.append(toggleButton);

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.dataset.action = "edit";
  const editLabel = document.createElement("span");
  editLabel.classList.add("action-label");
  editLabel.textContent = "Изменить";
  editButton.append(editLabel);
  actions.append(editButton);

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

export function renderTaskList(listElement, tasks, categories) {
  const cards = (Array.isArray(tasks) ? tasks : [])
    .map((task) => createTaskElement(task, categories));
  listElement.replaceChildren(...cards);
}