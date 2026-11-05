"use strict";

const PRIORITIES = ["low", "medium", "high"];
const TITLE_MAX = 100;

export function validateTaskDraft(draft, categories) {
  const errors = {};
  const value = {};

  const rawTitle = draft && typeof draft.title === "string" ? draft.title : "";
  const title = rawTitle.trim();
  if (title.length < 1) {
    errors.title = "Название не может быть пустым.";
  } else if (title.length > TITLE_MAX) {
    errors.title = `Название не должно превышать ${TITLE_MAX} символов.`;
  } else {
    value.title = title;
  }

  const priority = draft ? draft.priority : undefined;
  if (!PRIORITIES.includes(priority)) {
    errors.priority = "Выберите приоритет: low, medium или high.";
  } else {
    value.priority = priority;
  }

  const rawCategory = draft ? draft.categoryId : undefined;
  const categoryId = typeof rawCategory === "number"
    ? rawCategory
    : typeof rawCategory === "string" && rawCategory.trim() !== ""
      ? Number(rawCategory)
      : NaN;
  const knownCategories = Array.isArray(categories) ? categories : [];
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
    errors.categoryId = "Выберите категорию.";
  } else if (!knownCategories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Указана неизвестная категория.";
  } else {
    value.categoryId = categoryId;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: {}, errors };
  }
  return { valid: true, value, errors: {} };
}