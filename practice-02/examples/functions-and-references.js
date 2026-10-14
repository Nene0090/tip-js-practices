"use strict";

function sum(a, b) {
  return a + b;
}

console.log("Эксперимент 1:");
console.log(sum(2, 3));      
console.log(sum("2", 3));    
console.log(typeof sum("2", 3)); 

const square = (value) => {
  return value * value;
};

console.log("\nЭксперимент 2:");
console.log(square(4));      
console.log(typeof square(4)); 

const originalBook = { title: "Черновик", published: false };
const aliasBook = originalBook;

aliasBook.published = true;

console.log("\nЭксперимент 3:");
console.log(originalBook.published);     
console.log(originalBook === aliasBook);   

const books = [
  { id: 1, title: "JavaScript" },
  { id: 2, title: "HTTP" },
];
const booksCopy = [...books];

booksCopy[0].title = "Изменённый JavaScript";

console.log("\nЭксперимент 4:");
console.log(books[0].title);     
console.log(booksCopy[0].title);  
console.log(books === booksCopy); 
console.log(books[0] === booksCopy[0]); 

const baseBook = { id: 12, title: "Черновик", available: false };
const updatedBook = { ...baseBook, available: true };

console.log("\nЭксперимент 5:");
console.log(baseBook.available);    
console.log(updatedBook.available); 
console.log(baseBook === updatedBook); 

function makeCaption(text = "Без названия") {
  return text;
}

console.log("\nЭксперимент 6:");
console.log(makeCaption());         
console.log(makeCaption(undefined)); 
console.log(makeCaption(null));      
console.log(makeCaption(""));   