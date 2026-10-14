"use strict";

import assert from "node:assert/strict";
import { demoTasks } from "./src/data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./src/task-service.js";

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log("OK:", name);
    passed += 1;
  } catch (error) {
    console.error("FAIL:", name);
    console.error("     ", error.message);
    failed += 1;
  }
}

check("createTask: успех", () => {
  const r = createTask(20, "Новая задача", "high");
  assert.equal(r.ok, true);
  assert.equal(r.task.id, 20);
  assert.equal(r.task.title, "Новая задача");
  assert.equal(r.task.completed, false);
  assert.equal(r.task.priority, "high");
});

check("createTask: приоритет по умолчанию", () => {
  const r = createTask(20, "Задача");
  assert.equal(r.task.priority, "medium");
});

check("createTask: приоритет undefined → medium", () => {
  const r = createTask(20, "Задача", undefined);
  assert.equal(r.task.priority, "medium");
});

check("createTask: trim названия", () => {
  const r = createTask(20, "  Проверить  данные  ");
  assert.equal(r.task.title, "Проверить  данные");
});

check("createTask: длина 1 — успех", () => {
  const r = createTask(20, "A");
  assert.equal(r.ok, true);
});

check("createTask: длина 100 — успех", () => {
  const r = createTask(20, "A".repeat(100));
  assert.equal(r.ok, true);
});

check("createTask: пустая строка — ошибка", () => {
  assert.equal(createTask(20, "").ok, false);
});

check("createTask: пробелы — ошибка", () => {
  assert.equal(createTask(20, "   ").ok, false);
});

check("createTask: длина 101 — ошибка", () => {
  assert.equal(createTask(20, "A".repeat(101)).ok, false);
});

check("createTask: title = 42 — ошибка", () => {
  assert.equal(createTask(20, 42).ok, false);
});

check("createTask: title = null — ошибка", () => {
  assert.equal(createTask(20, null).ok, false);
});

check("createTask: title = undefined — ошибка", () => {
  assert.equal(createTask(20, undefined).ok, false);
});

check("createTask: id = 0 — ошибка", () => {
  assert.equal(createTask(0, "Задача").ok, false);
});

check("createTask: id = -1 — ошибка", () => {
  assert.equal(createTask(-1, "Задача").ok, false);
});

check("createTask: id = 1.5 — ошибка", () => {
  assert.equal(createTask(1.5, "Задача").ok, false);
});

check("createTask: id = \"4\" — ошибка", () => {
  assert.equal(createTask("4", "Задача").ok, false);
});

check("createTask: id = NaN — ошибка", () => {
  assert.equal(createTask(NaN, "Задача").ok, false);
});

check("createTask: id = Infinity — ошибка", () => {
  assert.equal(createTask(Infinity, "Задача").ok, false);
});

check("createTask: id = null — ошибка", () => {
  assert.equal(createTask(null, "Задача").ok, false);
});

check("createTask: id = undefined — ошибка", () => {
  assert.equal(createTask(undefined, "Задача").ok, false);
});

check("createTask: MAX_SAFE_INTEGER — успех", () => {
  const r = createTask(Number.MAX_SAFE_INTEGER, "Задача");
  assert.equal(r.ok, true);
});

check("createTask: MAX_SAFE_INTEGER + 1 — ошибка", () => {
  assert.equal(createTask(Number.MAX_SAFE_INTEGER + 1, "Задача").ok, false);
});

check("createTask: приоритет urgent — ошибка", () => {
  assert.equal(createTask(20, "Задача", "urgent").ok, false);
});

check("createTask: приоритет HIGH — ошибка", () => {
  assert.equal(createTask(20, "Задача", "HIGH").ok, false);
});

check("createTask: два вызова — разные объекты", () => {
  const a = createTask(20, "Задача");
  const b = createTask(20, "Задача");
  assert.equal(a.task === b.task, false);
  assert.deepEqual(a.task, b.task);
});

// ---------- чтение ----------

check("findTaskById: id = 4", () => {
  const t = findTaskById(demoTasks, 4);
  assert.equal(t.id, 4);
});

check("findTaskById: id = 777 → undefined", () => {
  assert.equal(findTaskById(demoTasks, 777), undefined);
});

check("findTaskById: строка \"4\" → undefined", () => {
  assert.equal(findTaskById(demoTasks, "4"), undefined);
});

check("getPendingTasks: [4, 7]", () => {
  const ids = getPendingTasks(demoTasks).map((t) => t.id);
  assert.deepEqual(ids, [4, 7]);
});

check("getPendingTasks: [] → []", () => {
  assert.deepEqual(getPendingTasks([]), []);
});

check("getTaskTitles: 4 названия", () => {
  const titles = getTaskTitles(demoTasks);
  assert.equal(titles.length, 4);
});

check("getTaskStats: demoTasks", () => {
  const s = getTaskStats(demoTasks);
  assert.deepEqual(s, { total: 4, completed: 2, pending: 2, progress: 50 });
});

check("getTaskStats: [] → все 0", () => {
  const s = getTaskStats([]);
  assert.deepEqual(s, { total: 0, completed: 0, pending: 0, progress: 0 });
});

check("addTask: успех", () => {
  const r = addTask(demoTasks, 20, "Новая", "high");
  assert.equal(r.ok, true);
  assert.equal(r.tasks.length, 5);
  assert.equal(r.tasks[4].id, 20);
  assert.equal(demoTasks.length, 4);
});

check("addTask: дубликат id", () => {
  const r = addTask(demoTasks, 4, "Дубликат", "low");
  assert.equal(r.ok, false);
});

check("setTaskCompleted: успех", () => {
  const r = setTaskCompleted(demoTasks, 4, true);
  assert.equal(r.ok, true);
  const updated = r.tasks.find((t) => t.id === 4);
  assert.equal(updated.completed, true);
  assert.equal(demoTasks.find((t) => t.id === 4).completed, false);
});

check("setTaskCompleted: строка \"true\" — ошибка", () => {
  assert.equal(setTaskCompleted(demoTasks, 4, "true").ok, false);
});

check("renameTask: успех с trim", () => {
  const r = renameTask(demoTasks, 10, "  Новое имя  ");
  assert.equal(r.ok, true);
  assert.equal(r.tasks.find((t) => t.id === 10).title, "Новое имя");
});

check("removeTask: id = 7", () => {
  const r = removeTask(demoTasks, 7);
  assert.equal(r.ok, true);
  assert.deepEqual(r.tasks.map((t) => t.id), [1, 4, 10]);
});

check("removeTask: отсутствующая — ошибка", () => {
  assert.equal(removeTask(demoTasks, 999).ok, false);
});

console.log(`\nПройдено: ${passed}, провалено: ${failed}`);
if (failed > 0) {
  process.exit(1);
}