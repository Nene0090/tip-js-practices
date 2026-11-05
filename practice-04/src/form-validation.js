"use strict";

const PRIORITIES = ["low", "medium", "high"];
const TITLE_MAX = 100;

/**
 * Чистая проверка черновика формы.
 * @param {{id:string|number, title:string, priority:string}} draft
 * @param {Array} tasks
 * @param {number|null} editingId
 * @returns {{ok:true, value:{id:number,title:string,priority:string}} | {ok:false, errors:Object}}
 */
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const list = Array.isArray(tasks) ? tasks : [];

  let id;

  if (editingId === null) {
    const raw = draft && typeof draft.id === "string" ? draft.id.trim() : "";
    if (raw === "") {
      errors.id = "Укажите идентификатор.";
    } else {
      id = Number(raw);
      if (!Number.isSafeInteger(id) || id <= 0) {
        errors.id = "Идентификатор должен быть положительным целым числом.";
      } else if (list.some((task) => task.id === id)) {
        errors.id = "Задача с таким идентификатором уже существует.";
      }
    }
  } else {
    id = editingId;
    if (!Number.isSafeInteger(id) || id <= 0) {
      errors.id = "Некорректный идентификатор редактируемой задачи.";
    } else if (!list.some((task) => task.id === id)) {
      errors.id = "Редактируемая задача не найдена.";
    }
  }

  const titleRaw = draft ? draft.title : undefined;
  if (typeof titleRaw !== "string") {
    errors.title = "Название должно быть строкой.";
  } else {
    const normalized = titleRaw.trim();
    if (normalized.length === 0) {
      errors.title = "Название не может быть пустым.";
    } else if (normalized.length > TITLE_MAX) {
      errors.title = `Название не должно превышать ${TITLE_MAX} символов.`;
    }
  }

  const priority = draft ? draft.priority : undefined;
  if (!PRIORITIES.includes(priority)) {
    errors.priority = "Выберите приоритет: low, medium или high.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      id,
      title: String(titleRaw).trim(),
      priority,
    },
  };
}