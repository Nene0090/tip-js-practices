"use strict";

const totalTasks = 18;
const completedTasks = 6;
const dailyLimit = 5;

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом.");
} else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: totalTasks должно быть в диапазоне 0…1000.");
} else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: некорректное число выполненных задач.");
} else if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: dailyLimit должно быть целым числом от 1 до 1000.");
} else {
  let remaining = totalTasks - completedTasks;
  let day = 0;

  console.log(`Осталось задач: ${remaining}`);

  while (remaining > 0) {
    day += 1;
    const doneToday = Math.min(dailyLimit, remaining);
    remaining -= doneToday;
    console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
  }

  console.log(`Потребуется дней: ${day}`);
}