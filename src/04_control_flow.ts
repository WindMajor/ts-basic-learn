/**
 * 学习目标：
 * 1. 掌握 if/else、switch、三元运算符的类型推断行为
 * 2. 熟练使用各种循环结构：for、while、do-while、for-of、for-in
 * 3. 理解 break、continue、return、throw 对控制流的影响
 * 4. 在流程控制中自然引出类型收窄（Type Narrowing）的雏形
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 用缩进表示代码块；TS/Java/Rust 都用大括号 {}
 * - Python 的 for 等价于 TS 的 for-of；TS 的 for 是 C-style 循环
 * - Rust 的 match 是表达式（有返回值），TS 的 switch 是语句；Rust 要求穷尽匹配
 * - TS/Java 的 break/continue 可以带标签，Python 不支持
 */

// ==========================================
// 示例 1：if/else 与类型收窄（Type Narrowing）
// 使用场景：根据条件判断缩小联合类型的范围
// ==========================================

function formatValue(value: string | number): string {
  if (typeof value === "string") {
    // 在这个块内，TypeScript 知道 value 是 string
    return value.toUpperCase();
  } else {
    // 在这个块内，TypeScript 知道 value 是 number
    return value.toFixed(2);
  }
}

console.log(formatValue("hello")); // HELLO
console.log(formatValue(3.14159)); // 3.14

// ==========================================
// 示例 2：三元运算符
// 使用场景：简单的条件赋值，替代短小的 if/else
// ==========================================

const age = 20;
const status = age >= 18 ? "adult" : "minor";
console.log(status);

// 嵌套三元运算符（谨慎使用，保持可读性）
const score = 85;
const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 60 ? "C" : "D";
console.log(grade);

// ==========================================
// 示例 3：switch 语句与穷尽检查
// 使用场景：多分支条件判断，配合联合类型实现类型安全
// ==========================================

type Direction = "north" | "south" | "east" | "west";

function getDirectionVector(direction: Direction): { x: number; y: number } {
  switch (direction) {
    case "north":
      return { x: 0, y: 1 };
    case "south":
      return { x: 0, y: -1 };
    case "east":
      return { x: 1, y: 0 };
    case "west":
      return { x: -1, y: 0 };
    default:
      // 利用 never 实现穷尽检查
      // 如果 Direction 增加了新值但忘记处理，这里会编译报错
      const _exhaustive: never = direction;
      return _exhaustive;
  }
}

// ==========================================
// 示例 4：for 循环（C-style）
// 使用场景：已知迭代次数，或需要索引的场景
// ==========================================

const items = ["a", "b", "c", "d"];
for (let i = 0; i < items.length; i++) {
  console.log(`Index ${i}: ${items[i]}`);
}

// ==========================================
// 示例 5：for-of 循环
// 使用场景：遍历可迭代对象的值，最常用
// ==========================================

for (const item of items) {
  console.log(item);
}

// for-of 遍历字符串
for (const char of "TypeScript") {
  console.log(char);
}

// ==========================================
// 示例 6：for-in 循环（遍历键）
// 使用场景：遍历对象的属性键（注意：也会遍历原型链上的键）
// ==========================================

const obj = { a: 1, b: 2, c: 3 };
for (const key in obj) {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    console.log(`${key}: ${obj[key as keyof typeof obj]}`);
  }
}

// ==========================================
// 示例 7：while 与 do-while
// 使用场景：条件驱动的不确定次数循环
// ==========================================

let counter = 0;
while (counter < 3) {
  console.log(`while: ${counter}`);
  counter++;
}

let doCounter = 0;
do {
  console.log(`do-while: ${doCounter}`);
  doCounter++;
} while (doCounter < 3);

// ==========================================
// 示例 8：break 与 continue
// 使用场景：提前终止循环或跳过当前迭代
// ==========================================

for (let i = 0; i < 10; i++) {
  if (i === 3) continue; // 跳过 3
  if (i === 7) break; // 到达 7 时终止循环
  console.log(i); // 0, 1, 2, 4, 5, 6
}

// 带标签的 break（用于嵌套循环）
outerLoop: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) {
      break outerLoop;
    }
    console.log(`i=${i}, j=${j}`);
  }
}

// ==========================================
// 示例 9：return 与 throw
// 使用场景：提前返回结果或抛出异常中断执行
// ==========================================

function divideSafe(a: number, b: number): number {
  if (b === 0) {
    throw new Error("除数不能为零");
  }
  return a / b;
}

try {
  console.log(divideSafe(10, 2)); // 5
  divideSafe(10, 0); // 抛出异常
} catch (e) {
  console.error("捕获错误:", e);
}

// ==========================================
// 示例 10：流程控制中的类型收窄进阶
// 使用场景：在复杂条件中逐步缩小类型范围
// ==========================================

function processInput(input: string | number | string[]): string {
  if (typeof input === "string") {
    return `String: ${input}`;
  }

  if (Array.isArray(input)) {
    return `Array with ${input.length} items`;
  }

  // 经过上面两个 if 后，TypeScript 推断此处 input 只能是 number
  return `Number: ${input.toFixed(2)}`;
}

console.log(processInput("hello"));
console.log(processInput(42));
console.log(processInput(["a", "b"]));

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

function wrongNarrow(value: string | number): void {
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  }
  // @ts-expect-error 在类型收窄后访问已排除类型的方法会报错：value 可能是 number
  console.log(value.toUpperCase());
}

// @ts-expect-error for-of 不能用于普通对象（非可迭代对象）
for (const x of obj) {
  console.log(x);
}

function fallThroughBug(status: number): string {
  switch (status) {
    case 200:
      return "OK";
    case 404:
      return "Not Found";
    case 500:
      return "Server Error";
    default:
      return "Unknown";
  }
}

// ==========================================
// 本章小结
// ==========================================
// 1. if/else 和 typeof 是最基础的类型收窄手段
// 2. switch 配合 never 可实现穷尽检查，确保所有联合类型的分支都被处理
// 3. for-of 遍历值，for-in 遍历键，C-style for 用于索引场景
// 4. break/continue 控制循环流程，带标签可跳出嵌套循环
// 5. return 提前结束函数，throw 中断执行并抛出异常
// 6. 类型收窄是 TypeScript 类型系统的核心特性之一，贯穿于各种控制流结构中
