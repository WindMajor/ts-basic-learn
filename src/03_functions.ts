/**
 * 学习目标：
 * 1. 掌握函数声明、函数表达式、箭头函数的类型写法
 * 2. 学会为参数和返回值添加类型注解
 * 3. 理解可选参数、默认参数、剩余参数的用法
 * 4. 掌握函数重载（Overload）的声明与实现
 * 5. 了解 this 的类型注解与回调函数类型
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 函数无需声明类型（3.5+ 可用类型提示），TS 要求编译期检查
 * - Java 支持方法重载（基于参数类型/数量），TS 的函数重载更像声明多个人口，最终只有一个实现
 * - Rust 的函数参数必须带类型注解；TS 的参数可推断但建议显式注解
 * - Rust 没有 this；TS/Java 的 this 指向调用上下文
 */

// ==========================================
// 示例 1：函数声明（Function Declaration）
// 使用场景：最常用的函数定义方式，支持提升
// ==========================================

function add(a: number, b: number): number {
  return a + b;
}

// ==========================================
// 示例 2：函数表达式（Function Expression）
// 使用场景：将函数赋值给变量，或作为回调使用
// ==========================================

const multiply = function (a: number, b: number): number {
  return a * b;
};

// ==========================================
// 示例 3：箭头函数（Arrow Function）
// 使用场景：简短的函数、回调函数、需要词法作用域 this 时
// ==========================================

const divide = (a: number, b: number): number => a / b;

// 多行箭头函数需显式 return
const power = (base: number, exponent: number): number => {
  return base ** exponent;
};

// ==========================================
// 示例 4：可选参数（Optional Parameters）
// 使用场景：参数有时可以省略，使用默认值时更灵活
// ==========================================

function greetUser(name: string, greeting?: string): string {
  const actualGreeting = greeting ?? "Hello";
  return `${actualGreeting}, ${name}!`;
}

console.log(greetUser("Alice")); // Hello, Alice!
console.log(greetUser("Bob", "Hi")); // Hi, Bob!

// ==========================================
// 示例 5：默认参数（Default Parameters）
// 使用场景：为参数提供默认值，简化调用方代码
// ==========================================

function createURL(protocol: string = "https", domain: string, path: string = "/"): string {
  return `${protocol}://${domain}${path}`;
}

console.log(createURL(undefined, "example.com", "/api")); // https://example.com/api

// ==========================================
// 示例 6：剩余参数（Rest Parameters）
// 使用场景：接受任意数量的同类型参数
// ==========================================

function sumAll(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

console.log(sumAll(1, 2, 3, 4, 5)); // 15

// 剩余参数与常规参数结合
function concatStrings(separator: string, ...parts: string[]): string {
  return parts.join(separator);
}

console.log(concatStrings("-", "a", "b", "c")); // a-b-c

// ==========================================
// 示例 7：函数重载（Function Overloads）
// 使用场景：一个函数根据参数类型/数量返回不同类型
// ==========================================

// 重载签名（Overload Signatures）
function processInput(input: string): string;
function processInput(input: number): number;
function processInput(input: boolean): boolean;

// 实现签名（Implementation Signature）
function processInput(input: string | number | boolean): string | number | boolean {
  if (typeof input === "string") {
    return input.toUpperCase();
  }
  if (typeof input === "number") {
    return input * 2;
  }
  return !input;
}

const result1: string = processInput("hello");
const result2: number = processInput(42);

// ==========================================
// 示例 8：this 的类型注解
// 使用场景：明确函数中 this 的预期类型，防止错误的上下文调用
// ==========================================

interface User {
  name: string;
  greet(this: User): string;
}

const user: User = {
  name: "Alice",
  greet() {
    return `Hello, I'm ${this.name}`;
  },
};

console.log(user.greet());

// ==========================================
// 示例 9：回调函数类型
// 使用场景：定义事件处理器、数组方法回调等
// ==========================================

type ClickHandler = (event: { x: number; y: number }) => void;

const handleClick: ClickHandler = (event) => {
  console.log(`Clicked at (${event.x}, ${event.y})`);
};

handleClick({ x: 100, y: 200 });

// 数组的回调方法
const numbers = [1, 2, 3, 4, 5];
const evens = numbers.filter((n: number): boolean => n % 2 === 0);
console.log(evens);

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error 参数数量不匹配：期望 2 个参数，只给了 1 个
const wrongAdd = add(5);

// @ts-expect-error 参数类型不匹配：期望 number，给了 string
const wrongType = add("1", "2");

// ❌ 语法错误：可选参数不能位于必选参数之前
// 原因：调用时若只传 1 个参数，编译器无法判断是传给 a 还是 b
// function badOptional(a?: number, b: number): number { ... }

// ==========================================
// 本章小结
// ==========================================
// 1. 函数声明支持提升，箭头函数继承词法 this，函数表达式更灵活
// 2. 参数类型注解应显式声明，返回值可推断但建议显式标注公共 API
// 3. 可选参数用 ? 标记，默认参数用 = 赋值，剩余参数用 ... 收集
// 4. 函数重载需要多个声明签名 + 一个实现签名，实现签名需兼容所有声明
// 5. this 的类型注解能帮助捕获「错误上下文调用」的 bug
// 6. 回调函数类型应精确定义参数和返回值，提高代码可维护性
