"use strict";

export const categories = [
  { id: 1, name: "Учёба" },
  { id: 2, name: "Проект" },
  { id: 3, name: "Личное" },
];

export const tasks = [
  { id: 1,  title: "Изучить Promise",                    completed: true,  priority: "medium", categoryId: 1 },
  { id: 4,  title: "Подготовить модель задач",           completed: false, priority: "high",   categoryId: 2 },
  { id: 7,  title: "Проверить методы массивов",          completed: false, priority: "low",    categoryId: 1 },
  { id: 10, title: "Оформить README",                    completed: true,  priority: "medium", categoryId: 1 },
  { id: 13, title: "Разобрать fetch и Response",         completed: false, priority: "high",   categoryId: 2 },
  { id: 16, title: "Проверить Content-Type",             completed: true,  priority: "high",   categoryId: 2 },
  { id: 19, title: "Изучить AbortController",            completed: false, priority: "medium", categoryId: 1 },
  { id: 22, title: "Собрать клиент задач",               completed: false, priority: "low",    categoryId: 2 },
  { id: 25, title: "Проверить параллельные запросы",     completed: true,  priority: "high",   categoryId: 2 },
  { id: 28, title: "Написать собственные проверки",      completed: false, priority: "medium", categoryId: 2 },
  { id: 31, title: "Разобрать микрозадачи",              completed: true,  priority: "low",    categoryId: 1 },
  { id: 34, title: "Проверить отмену запроса",           completed: false, priority: "high",   categoryId: 2 },
];