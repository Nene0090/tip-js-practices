"use strict";

import { getVisibleTasks } from "../src/task-selectors.js";
import {
  createTaskElement,
  renderTaskList,
  renderSummary,
  renderEmptyState,
} from "../src/task-view.js";
import { demoTasks } from "../src/data.js";

let passed = 0;
let failed = 0;
const results = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    results.push(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    results.push(`FAIL: ${name} — ${error.message}`);
  }
}

function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`${message} ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${message} ожидалось ${b}, получено ${a}`);
  }
}

check("getVisibleTasks: all возвращает копию", () => {
  const r = getVisibleTasks(demoTasks, "all");
  assertEqual(r.length, 4);
  if (r === demoTasks) throw new Error("должна быть копия, а не тот же массив");
});

check("getVisibleTasks: pending", () => {
  const ids = getVisibleTasks(demoTasks, "pending").map((t) => t.id);
  assertDeepEqual(ids, [4, 7]);
});

check("getVisibleTasks: completed", () => {
  const ids = getVisibleTasks(demoTasks, "completed").map((t) => t.id);
  assertDeepEqual(ids, [1, 10]);
});

check("getVisibleTasks: по умолчанию all", () => {
  assertEqual(getVisibleTasks(demoTasks).length, 4);
});

check("getVisibleTasks: пустой массив", () => {
  assertEqual(getVisibleTasks([], "pending").length, 0);
});

check("getVisibleTasks: порядок сохранён", () => {
  const ids = getVisibleTasks(demoTasks, "all").map((t) => t.id);
  assertDeepEqual(ids, [1, 4, 7, 10]);
});

check("getVisibleTasks: не мутирует исходный массив", () => {
  const before = demoTasks.length;
  getVisibleTasks(demoTasks, "completed");
  assertEqual(demoTasks.length, before);
});

check("getVisibleTasks: неизвестный фильтр → все задачи", () => {
  const r = getVisibleTasks(demoTasks, "unknown");
  assertEqual(r.length, 4);
  if (r === demoTasks) throw new Error("должна быть копия");
});

check("createTaskElement: корневой li", () => {
  const el = createTaskElement(demoTasks[1]);
  assertEqual(el.tagName, "LI");
  assertEqual(el.classList.contains("task-card"), true);
  assertEqual(el.dataset.taskId, "4");
});

check("createTaskElement: класс is-completed для выполненной", () => {
  const el = createTaskElement(demoTasks[0]);
  assertEqual(el.classList.contains("is-completed"), true);
});

check("createTaskElement: нет класса is-completed у невыполненной", () => {
  const el = createTaskElement(demoTasks[1]);
  assertEqual(el.classList.contains("is-completed"), false);
});

check("createTaskElement: заголовок как текст", () => {
  const el = createTaskElement({
    id: 99,
    title: "<strong>Проверка</strong>",
    completed: false,
    priority: "low",
  });
  const title = el.querySelector(".task-title");
  assertEqual(title.textContent, "<strong>Проверка</strong>");
  assertEqual(title.querySelector("strong"), null);
});

check("createTaskElement: статус «В работе»", () => {
  const el = createTaskElement(demoTasks[1]);
  assertEqual(el.querySelector(".task-status").textContent, "В работе");
});

check("createTaskElement: статус «Выполнена»", () => {
  const el = createTaskElement(demoTasks[0]);
  assertEqual(el.querySelector(".task-status").textContent, "Выполнена");
});

check("createTaskElement: приоритет low → Низкий", () => {
  const el = createTaskElement(demoTasks[2]);
  assertEqual(el.querySelector(".task-priority").textContent, "Низкий");
});

check("createTaskElement: приоритет medium → Средний", () => {
  const el = createTaskElement(demoTasks[0]);
  assertEqual(el.querySelector(".task-priority").textContent, "Средний");
});

check("createTaskElement: приоритет high → Высокий", () => {
  const el = createTaskElement(demoTasks[1]);
  assertEqual(el.querySelector(".task-priority").textContent, "Высокий");
});

check("createTaskElement: кнопка toggle с aria-pressed=true", () => {
  const el = createTaskElement(demoTasks[0]);
  const btn = el.querySelector('button[data-action="toggle"]');
  assertEqual(btn.getAttribute("aria-pressed"), "true");
  assertEqual(btn.querySelector(".action-label").textContent, "Выполнена");
});

check("createTaskElement: кнопка toggle с aria-pressed=false", () => {
  const el = createTaskElement(demoTasks[1]);
  const btn = el.querySelector('button[data-action="toggle"]');
  assertEqual(btn.getAttribute("aria-pressed"), "false");
});

check("createTaskElement: кнопка delete", () => {
  const el = createTaskElement(demoTasks[0]);
  const btn = el.querySelector('button[data-action="delete"]');
  assertEqual(btn.querySelector(".action-label").textContent, "Удалить");
});

check("createTaskElement: кнопки type=button", () => {
  const el = createTaskElement(demoTasks[0]);
  const buttons = el.querySelectorAll("button");
  for (const b of buttons) {
    assertEqual(b.type, "button");
  }
});

function makeList() {
  const ul = document.createElement("ul");
  document.body.append(ul);
  return ul;
}

check("renderTaskList: 4 карточки", () => {
  const ul = makeList();
  renderTaskList(ul, demoTasks);
  assertEqual(ul.children.length, 4);
  ul.remove();
});

check("renderTaskList: повторный вызов не дублирует", () => {
  const ul = makeList();
  renderTaskList(ul, demoTasks);
  renderTaskList(ul, demoTasks);
  assertEqual(ul.children.length, 4);
  ul.remove();
});

check("renderTaskList: пустой массив очищает", () => {
  const ul = makeList();
  renderTaskList(ul, demoTasks);
  renderTaskList(ul, []);
  assertEqual(ul.children.length, 0);
  ul.remove();
});

check("renderTaskList: сам ul остаётся в документе", () => {
  const ul = makeList();
  renderTaskList(ul, demoTasks);
  renderTaskList(ul, []);
  assertEqual(document.body.contains(ul), true);
  ul.remove();
});

check("renderTaskList: порядок id сохранён", () => {
  const ul = makeList();
  renderTaskList(ul, demoTasks);
  const ids = [...ul.children].map((li) => li.dataset.taskId);
  assertDeepEqual(ids, ["1", "4", "7", "10"]);
  ul.remove();
});

check("renderTaskList: 10 повторных вызовов — всё ещё 4 карточки", () => {
  const ul = makeList();
  for (let i = 0; i < 10; i += 1) {
    renderTaskList(ul, demoTasks);
  }
  assertEqual(ul.children.length, 4);
  ul.remove();
});

function makeSummary() {
  const div = document.createElement("div");
  div.innerHTML = `
    <span data-stat="total"></span>
    <span data-stat="completed"></span>
    <span data-stat="pending"></span>
    <span data-stat="progress"></span>
    <span data-stat="visible"></span>`;
  return div;
}

check("renderSummary: demoTasks", () => {
  const s = makeSummary();
  renderSummary(s, demoTasks, 4);
  assertEqual(s.querySelector('[data-stat="total"]').textContent, "4");
  assertEqual(s.querySelector('[data-stat="completed"]').textContent, "2");
  assertEqual(s.querySelector('[data-stat="pending"]').textContent, "2");
  assertEqual(s.querySelector('[data-stat="progress"]').textContent, "50.0%");
  assertEqual(s.querySelector('[data-stat="visible"]').textContent, "4");
});

check("renderSummary: пустой массив → 0.0%", () => {
  const s = makeSummary();
  renderSummary(s, [], 0);
  assertEqual(s.querySelector('[data-stat="total"]').textContent, "0");
  assertEqual(s.querySelector('[data-stat="progress"]').textContent, "0.0%");
});

check("renderSummary: 1 из 3 → 33.3%", () => {
  const tasks = [
    { id: 1, title: "a", completed: true, priority: "low" },
    { id: 2, title: "b", completed: false, priority: "low" },
    { id: 3, title: "c", completed: false, priority: "low" },
  ];
  const s = makeSummary();
  renderSummary(s, tasks, 3);
  assertEqual(s.querySelector('[data-stat="progress"]').textContent, "33.3%");
});

check("renderSummary: visible отдельно от total", () => {
  const s = makeSummary();
  renderSummary(s, demoTasks, 2);
  assertEqual(s.querySelector('[data-stat="total"]').textContent, "4");
  assertEqual(s.querySelector('[data-stat="visible"]').textContent, "2");
});

check("renderSummary: 100% при всех выполненных", () => {
  const tasks = [
    { id: 1, title: "a", completed: true, priority: "low" },
    { id: 2, title: "b", completed: true, priority: "low" },
  ];
  const s = makeSummary();
  renderSummary(s, tasks, 2);
  assertEqual(s.querySelector('[data-stat="progress"]').textContent, "100.0%");
});

check("renderEmptyState: visible > 0 → скрыто", () => {
  const p = document.createElement("p");
  renderEmptyState(p, 4, 2);
  assertEqual(p.hidden, true);
  assertEqual(p.textContent, "");
});

check("renderEmptyState: total = 0 → «Список задач пуст.»", () => {
  const p = document.createElement("p");
  renderEmptyState(p, 0, 0);
  assertEqual(p.hidden, false);
  assertEqual(p.textContent, "Список задач пуст.");
});

check("renderEmptyState: total > 0, visible = 0 → «Нет задач по выбранному фильтру.»", () => {
  const p = document.createElement("p");
  renderEmptyState(p, 4, 0);
  assertEqual(p.hidden, false);
  assertEqual(p.textContent, "Нет задач по выбранному фильтру.");
});

check("Интеграция: pending + список + сводка", () => {
  const visible = getVisibleTasks(demoTasks, "pending");
  const ul = makeList();
  renderTaskList(ul, visible);
  const s = makeSummary();
  renderSummary(s, demoTasks, visible.length);
  assertEqual(ul.children.length, 2);
  assertEqual(s.querySelector('[data-stat="visible"]').textContent, "2");
  assertEqual(s.querySelector('[data-stat="total"]').textContent, "4");
  ul.remove();
});

check("Интеграция: completed + список", () => {
  const visible = getVisibleTasks(demoTasks, "completed");
  const ul = makeList();
  renderTaskList(ul, visible);
  assertEqual(ul.children.length, 2);
  ul.remove();
});

check("Интеграция: пустой фильтр → пустой список + сообщение", () => {
  const tasks = [{ id: 1, title: "a", completed: true, priority: "low" }];
  const visible = getVisibleTasks(tasks, "pending");
  const ul = makeList();
  renderTaskList(ul, visible);
  const p = document.createElement("p");
  renderEmptyState(p, tasks.length, visible.length);
  assertEqual(ul.children.length, 0);
  assertEqual(p.textContent, "Нет задач по выбранному фильтру.");
  ul.remove();
});

check("Интеграция: пустой массив → «Список задач пуст.»", () => {
  const p = document.createElement("p");
  renderEmptyState(p, 0, 0);
  assertEqual(p.textContent, "Список задач пуст.");
});

check("Безопасность: HTML в названии не интерпретируется", () => {
  const el = createTaskElement({
    id: 1,
    title: '<img src=x onerror="alert(1)">',
    completed: false,
    priority: "low",
  });
  const title = el.querySelector(".task-title");
  assertEqual(title.querySelector("img"), null);
  assertEqual(title.textContent, '<img src=x onerror="alert(1)">');
});

check("Безопасность: 100 символов", () => {
  const el = createTaskElement({
    id: 1,
    title: "A".repeat(100),
    completed: false,
    priority: "low",
  });
  assertEqual(el.querySelector(".task-title").textContent.length, 100);
});

check("renderTaskList: не меняет объекты задач", () => {
  const snapshot = JSON.stringify(demoTasks);
  const ul = makeList();
  renderTaskList(ul, demoTasks);
  assertEqual(JSON.stringify(demoTasks), snapshot);
  ul.remove();
});

const output = document.querySelector("#check-results");
output.textContent =
  results.join("\n") +
  `\n\nВсего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;