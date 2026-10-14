"use strict";

const r1 = "8" + 2;
console.log('1) "8" + 2 =', r1, "| тип:", typeof r1);

const r2 = "8" - 2;
console.log('2) "8" - 2 =', r2, "| тип:", typeof r2);

const r3 = Number("8") + 2;
console.log('3) Number("8") + 2 =', r3, "| тип:", typeof r3);

const r4 = "12" > "3";
console.log('4) "12" > "3" =', r4, "| тип:", typeof r4);

const r5 = 12 === "12";
console.log('5) 12 === "12" =', r5, "| тип:", typeof r5);

const r6 = Number("");
console.log('6) Number("") =', r6, "| тип:", typeof r6);

const r7 = Number("text");
console.log('7) Number("text") =', r7, "| тип:", typeof r7);

const r8 = Boolean("false");
console.log('8) Boolean("false") =', r8, "| тип:", typeof r8);

const r9 = typeof null;
console.log("9) typeof null =", r9, "| тип результата:", typeof r9);

const r10 = typeof NaN;
console.log("10) typeof NaN =", r10, "| тип результата:", typeof r10);