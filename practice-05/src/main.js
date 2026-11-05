"use strict";

import { createApiClient } from "./api-client.js";
import { createTaskApi } from "./task-api.js";
import { variantNumber, variantFilters } from "./variant.js";

const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";

async function main() {
  console.log(`ПР5, вариант ${variantNumber}`);
  console.log(`API: ${baseUrl}`);
  console.log(`Фильтры варианта: ${JSON.stringify(variantFilters)}`);
  console.log("");

  const client = createApiClient({ baseUrl });
  const api = createTaskApi(client);

  try {
    const health = await client.requestJson("/health");
    console.log("1. /health:", health);
  } catch (error) {
    console.log("1. /health: ошибка", error.kind, error.message);
  }

  try {
    const { tasks, meta } = await api.getTasks(variantFilters);
    const ids = tasks.map((task) => task.id);
    console.log("2. Задачи по фильтру варианта:");
    console.log("   URL: /tasks", variantFilters);
    console.log("   id:", ids);
    console.log("   meta.total:", meta.total);
    console.log("   совпадение с ожиданием:", JSON.stringify(ids) === JSON.stringify([4, 16, 22, 25, 28, 34]));
  } catch (error) {
    console.log("2. Задачи по фильтру варианта: ошибка", error.kind, error.message);
  }

  try {
    const categories = await api.getCategories();
    console.log("3. Категории:", categories);
  } catch (error) {
    console.log("3. Категории: ошибка", error.kind, error.message);
  }

  try {
    const task = await api.getTaskById(999);
    console.log("4. Задача 999 (не должна быть найдена):", task);
  } catch (error) {
    console.log("4. Задача 999: ожидаемая ошибка");
    console.log("   kind:", error.kind);
    console.log("   status:", error.status);
    console.log("   code:", error.code);
  }

  try {
    const data = await api.loadInitialData(variantFilters);
    console.log("5. loadInitialData:");
    console.log("   tasks:", data.tasks.map((task) => task.id));
    console.log("   categories:", data.categories.map((category) => category.id));
    console.log("   meta.total:", data.meta.total);
  } catch (error) {
    console.log("5. loadInitialData: ошибка", error.kind, error.message);
  }
}

main().catch((error) => {
  console.error("Необработанная ошибка:", error);
  process.exitCode = 1;
});