"use strict";

import { demoTasks, variantTasks, variantNumber } from "./data.js";
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
} from "./task-service.js";

function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`\n--- ${label} ---`);
  console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

console.log("ОБЩИЙ СЦЕНАРИЙ");

console.log("\nИсходные задачи:");
for (const task of demoTasks) {
  console.log(`id=${task.id}, "${task.title}", completed=${task.completed}, priority=${task.priority}`);
}

console.log("\nНазвания задач:", getTaskTitles(demoTasks));

console.log("\nНевыполненные задачи:");
for (const task of getPendingTasks(demoTasks)) {
  console.log(`id=${task.id}, "${task.title}"`);
}

printStats("Исходная сводка", demoTasks);

let currentTasks = demoTasks;

const addResult = addTask(currentTasks, 20, "Добавить проверку", "high");
if (addResult.ok) {
  currentTasks = addResult.tasks;
  console.log("\n[add] задача 20 добавлена");
} else {
  console.error("\n[add] ошибка:", addResult.error);
}
printStats("После добавления id=20", currentTasks);

const completeResult = setTaskCompleted(currentTasks, 4, true);
if (completeResult.ok) {
  currentTasks = completeResult.tasks;
  console.log("\n[complete] задача 4 выполнена");
} else {
  console.error("\n[complete] ошибка:", completeResult.error);
}
printStats("После выполнения id=4", currentTasks);

const renameResult = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (renameResult.ok) {
  currentTasks = renameResult.tasks;
  console.log("\n[rename] задача 10 переименована");
} else {
  console.error("\n[rename] ошибка:", renameResult.error);
}
printStats("После переименования id=10", currentTasks);

const removeResult = removeTask(currentTasks, 7);
if (removeResult.ok) {
  currentTasks = removeResult.tasks;
  console.log("\n[remove] задача 7 удалена");
} else {
  console.error("\n[remove] ошибка:", removeResult.error);
}
printStats("После удаления id=7", currentTasks);

const failResult = addTask(currentTasks, 20, "Дубликат", "low");
console.log("\n[отказ] повторное добавление id=20:");
console.log("ok:", failResult.ok, "| error:", failResult.error);

console.log("\nИсходный demoTasks остался прежним:");
for (const task of demoTasks) {
  console.log(`id=${task.id}, "${task.title}", completed=${task.completed}`);
}
console.log("Количество в demoTasks:", demoTasks.length);
console.log("Количество в currentTasks:", currentTasks.length);
console.log("Идентификаторы currentTasks:", currentTasks.map((t) => t.id));

console.log("\n\n ВАРИАНТ 6");
console.log("Начальный прогресс по варианту:", ((5 / 6) * 100).toFixed(1) + "%");

let vTasks = variantTasks;

printStats("Вариант: исходная сводка", vTasks);

const vAdd = addTask(vTasks, 80, "Проверить доступность с клавиатуры", "low");
if (vAdd.ok) {
  vTasks = vAdd.tasks;
  console.log("\n[вариант] добавлена задача 80");
} else {
  console.error("\n[вариант] ошибка:", vAdd.error);
}
printStats("Вариант: после добавления id=80", vTasks);

const vComplete = setTaskCompleted(vTasks, 11, true);
if (vComplete.ok) {
  vTasks = vComplete.tasks;
  console.log("\n[вариант] задача 11 отмечена выполненной");
} else {
  console.error("\n[вариант] ошибка:", vComplete.error);
}
printStats("Вариант: после id=11", vTasks);

const vRename = renameTask(vTasks, 23, "Проверить навигацию и хлебные крошки");
if (vRename.ok) {
  vTasks = vRename.tasks;
  console.log("\n[вариант] задача 23 переименована");
} else {
  console.error("\n[вариант] ошибка:", vRename.error);
}
printStats("Вариант: после переименования id=23", vTasks);

const vRemove = removeTask(vTasks, 37);
if (vRemove.ok) {
  vTasks = vRemove.tasks;
  console.log("\n[вариант] задача 37 удалена");
} else {
  console.error("\n[вариант] ошибка:", vRemove.error);
}
printStats("Вариант: после удаления id=37", vTasks);

const vDup = addTask(vTasks, 80, "Дубликат", "low");
console.log("\n[вариант][отказ] повторное добавление id=80:");
console.log("ok:", vDup.ok, "| error:", vDup.error);

console.log("\nvariantTasks остался прежним:");
console.log("Количество:", variantTasks.length);
console.log("Идентификаторы:", variantTasks.map((t) => t.id));
console.log("Прогресс variantTasks:", getTaskStats(variantTasks).progress.toFixed(1) + "%");