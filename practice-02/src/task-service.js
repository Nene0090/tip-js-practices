"use strict";

function checkId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  return { ok: true };
}

function normalizeTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const clean = title.trim();
  if (clean.length === 0) {
    return { ok: false, error: "Название не должно быть пустым" };
  }
  if (clean.length > 100) {
    return { ok: false, error: "Название не должно превышать 100 символов" };
  }
  return { ok: true, title: clean };
}

function checkPriority(priority) {
  if (priority !== "low" && priority !== "medium" && priority !== "high") {
    return { ok: false, error: "Приоритет должен быть low, medium или high" };
  }
  return { ok: true };
}

export function createTask(id, title, priority = "medium") {
  const idCheck = checkId(id);
  if (!idCheck.ok) return idCheck;

  const titleCheck = normalizeTitle(title);
  if (!titleCheck.ok) return titleCheck;

  const priorityCheck = checkPriority(priority);
  if (!priorityCheck.ok) return priorityCheck;

  return {
    ok: true,
    task: {
      id,
      title: titleCheck.title,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  let completed = 0;
  for (const task of tasks) {
    if (task.completed === true) {
      completed += 1;
    }
  }
  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const idCheck = checkId(id);
  if (!idCheck.ok) return idCheck;

  if (tasks.some((task) => task.id === id)) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }

  const created = createTask(id, title, priority);
  if (!created.ok) return created;

  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idCheck = checkId(id);
  if (!idCheck.ok) return idCheck;

  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть true или false" };
  }

  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );

  return { ok: true, tasks: updatedTasks };
}

export function renameTask(tasks, id, title) {
  const idCheck = checkId(id);
  if (!idCheck.ok) return idCheck;

  const titleCheck = normalizeTitle(title);
  if (!titleCheck.ok) return titleCheck;

  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, title: titleCheck.title } : task
  );

  return { ok: true, tasks: updatedTasks };
}

export function removeTask(tasks, id) {
  const idCheck = checkId(id);
  if (!idCheck.ok) return idCheck;

  const exists = tasks.some((task) => task.id === id);
  if (!exists) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const updatedTasks = tasks.filter((task) => task.id !== id);

  return { ok: true, tasks: updatedTasks };
}