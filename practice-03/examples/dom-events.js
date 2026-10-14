"use strict";

const logElement = document.querySelector("#log");
function log(...args) {
  logElement.textContent += args.join(" ") + "\n";
}

const missing = document.querySelector("#missing-element");
const emptyList = document.querySelectorAll(".does-not-exist");

log("Эксперимент 1:");
log("missing =", missing);
log("typeof missing =", typeof missing);
log("emptyList.length =", emptyList.length);
log("typeof emptyList =", typeof emptyList);

const addButton = document.querySelector("#add-button");
log("\nЭксперимент 2:");
log("dataset.taskId =", addButton.dataset.taskId, "| typeof =", typeof addButton.dataset.taskId);
const numericId = Number(addButton.dataset.taskId);
log("Number(...) =", numericId, "| typeof =", typeof numericId);

const itemsList = document.querySelector("#items-list");
const initialItems = itemsList.querySelectorAll("li");
log("\nЭксперимент 3:");
log("initialItems.length (до нажатий) =", initialItems.length);

addButton.addEventListener("click", () => {
  const li = document.createElement("li");
  li.textContent = "Запись";
  itemsList.append(li);
  log("После нажатия: initialItems.length =", initialItems.length,
      "| новый querySelectorAll.length =", itemsList.querySelectorAll("li").length);
});

const changeTitleButton = document.querySelector("#change-title-button");
const pageTitle = document.querySelector("#page-title");

changeTitleButton.addEventListener("click", () => {
  const value = '<strong>Проверить пример</strong>';
  pageTitle.textContent = value;
  log("\nЭксперимент 4:");
  log("textContent заголовка =", pageTitle.textContent);
  log("есть ли вложенный <strong>? ", pageTitle.querySelector("strong") !== null);
});

const card = document.createElement("div");
card.style.border = "1px solid #ccc";
card.style.padding = "0.5rem";
card.style.marginTop = "1rem";

const capture = document.createElement("div");
const inner = document.createElement("button");
inner.type = "button";
const label = document.createElement("span");
label.textContent = "Изменить заголовок";
inner.append(label);
card.append(inner);

document.body.append(card);

card.addEventListener("click", (event) => {
  log("[capture] phase =", event.eventPhase,
      "| target =", event.target.tagName,
      "| currentTarget =", event.currentTarget.tagName);
}, true);

inner.addEventListener("click", (event) => {
  log("[target-handler] phase =", event.eventPhase,
      "| target =", event.target.tagName,
      "| currentTarget =", event.currentTarget.tagName);
});

card.addEventListener("click", (event) => {
  log("[bubble] phase =", event.eventPhase,
      "| target =", event.target.tagName,
      "| currentTarget =", event.currentTarget.tagName);
});