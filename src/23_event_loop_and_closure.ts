/*
 * ============================================================
 * 学习目标
 * ============================================================
 * 理解 JS 单线程异步模型（事件循环），掌握闭包的原理与内存泄漏风险，
 * 区分编译时作用域与运行时上下文。
 *
 * 为什么 TS 编译时无法发现这些问题？
 * -----------------------------------------------------------
 * TypeScript 是静态类型系统，它不执行代码，也不了解事件循环的调度顺序。
 * 对于异步代码，TS 只能检查 Promise 的类型参数是否匹配、await 的类型是否
 * 为 Thenable；但它无法预测两个 setTimeout 哪个先执行，也无法知道闭包引用
 * 的外部变量在何时被修改。变量提升和暂时性死区（TDZ）是纯粹的运行时语义——
 * 代码在解析阶段就确定了作用域链，但 TDZ 的报错时机取决于执行流。
 *
 * 与 TS 类型系统的边界关系
 * -----------------------------------------------------------
 * TS 负责：检查 Promise<T> 的 T 是否匹配、async 函数返回类型是否为 Promise、
 *          回调函数的参数类型是否正确。
 * JS 运行时负责：宏任务/微任务的调度顺序、闭包的内存生命周期、GC 回收时机、
 *                变量提升的实际表现、this 的绑定。
 * TS 编译通过了，不代表异步执行顺序符合直觉；类型正确的代码仍可能因事件循环
 * 机制而产生竞态条件或内存泄漏。
 * ============================================================
 */

// ============================================================
// 示例 1：事件循环的核心模型
// ============================================================
// 场景：理解 JS 单线程异步模型的组成部分
// 预期结果：同步代码和异步代码按某种顺序交错执行
// 实际结果：所有异步操作被放入队列，等待调用栈清空后按规则执行
// 背后的 JS 引擎行为：
//   JS 引擎包含：调用栈（Call Stack，执行同步代码）、堆（Heap，存放对象）、
//   消息队列（Message Queue，存放待执行的回调）。
//   宏任务（Macrotask）：script 整体、setTimeout、setInterval、I/O、UI 渲染
//   微任务（Microtask）：Promise.then/catch/finally、queueMicrotask、MutationObserver
//   执行顺序：同步代码 → 当前宏任务内所有微任务 → 下一个宏任务

console.log('=== 示例 1: 事件循环核心模型 ===');
console.log('同步 1');

setTimeout(() => {
  console.log('宏任务: setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('微任务: Promise.then');
});

queueMicrotask(() => {
  console.log('微任务: queueMicrotask');
});

console.log('同步 2');

// 预期输出顺序：
// 同步 1
// 同步 2
// 微任务: Promise.then
// 微任务: queueMicrotask
// 宏任务: setTimeout

// ============================================================
// 示例 2：经典执行顺序题目 —— 基础版
// ============================================================
// 场景：面试中常见的 log + setTimeout + Promise 混合题
// 预期结果：按代码书写顺序输出
// 实际结果：同步先执行，然后微任务，最后宏任务
// 背后的 JS 引擎行为：
//   1. 整段 script 作为第一个宏任务进入事件循环
//   2. 从上到下执行同步代码，遇到异步 API 将其回调放入对应队列
//   3. 同步代码执行完毕后，依次清空微任务队列
//   4. 取出下一个宏任务执行

console.log('\n=== 示例 2: 执行顺序基础版 ===');

console.log('A');

setTimeout(() => {
  console.log('B');
}, 0);

Promise.resolve().then(() => {
  console.log('C');
});

console.log('D');

// 逐行执行过程：
// 1. 打印 A（同步）
// 2. 遇到 setTimeout，回调 fn1 进入宏任务队列
// 3. 遇到 Promise.resolve().then，回调 fn2 进入微任务队列
// 4. 打印 D（同步）
// 5. 同步代码结束，检查微任务队列，执行 fn2 → 打印 C
// 6. 微任务队列清空，取出下一个宏任务 fn1 → 打印 B
// 最终输出：A → D → C → B

// ============================================================
// 示例 3：经典执行顺序题目 —— 进阶版（async/await）
// ============================================================
// 场景：async/await 隐含的 Promise 包装与微任务排队
// 预期结果：await 后面的代码像同步代码一样立即执行
// 实际结果：await 右侧表达式立即执行，但 await 之后的代码被挂起并放入微任务
// 背后的 JS 引擎行为：
//   `await x` 的行为等价于：`Promise.resolve(x).then(res => { 后续代码 })`
//   注意：若 x 是 thenable 或 Promise，则遵循 Promise 解析规则。
//   因此 await 之后的代码总是在当前调用栈清空后、下一个宏任务之前执行。

console.log('\n=== 示例 3: 执行顺序进阶版 (async/await) ===');

async function asyncOrder() {
  console.log('E');
  await Promise.resolve();
  console.log('F');
}

asyncOrder();
console.log('G');

// 逐行执行过程：
// 1. 调用 asyncOrder()，进入函数体
// 2. 打印 E（同步，在 asyncOrder 的同步执行阶段）
// 3. 遇到 await Promise.resolve()，将后续代码（打印 F）包装为微任务
// 4. asyncOrder() 的同步部分结束，返回一个 Promise
// 5. 打印 G（外层同步代码）
// 6. 同步代码全部结束，检查微任务队列 → 执行被挂起的代码 → 打印 F
// 最终输出：E → G → F

// ============================================================
// 示例 4：经典执行顺序题目 —— 困难版（深层嵌套）
// ============================================================
// 场景：Promise.then 中嵌套 setTimeout，再嵌套 Promise 的复杂情况
// 预期结果：按某种直觉顺序
// 实际结果：每次从宏任务开始时，都要先清空该宏任务产生的所有微任务
// 背后的 JS 引擎行为：
//   事件循环的完整步骤：
//   a. 执行一个宏任务
//   b. 清空所有微任务（微任务执行过程中新产生的微任务也继续执行）
//   c. 如有必要，进行 UI 渲染
//   d. 回到 a

console.log('\n=== 示例 4: 执行顺序困难版 ===');

setTimeout(() => {
  console.log('H');
  Promise.resolve().then(() => {
    console.log('I');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('J');
  setTimeout(() => {
    console.log('K');
  }, 0);
});

console.log('L');

// 逐行执行过程：
// 1. 打印 L（同步）
// 2. setTimeout 回调放入宏任务队列（任务 H）
// 3. Promise.then 回调放入微任务队列（任务 J）
// 4. 同步结束，清空微任务队列：
//    4a. 执行 J → 打印 J
//    4b. J 中又产生一个 setTimeout，放入宏任务队列（任务 K，在 H 之后）
// 5. 微任务清空，执行下一个宏任务 H：
//    5a. 打印 H
//    5b. H 中产生 Promise.then，放入微任务队列（任务 I）
//    5c. 宏任务 H 执行完毕，立即清空微任务队列 → 打印 I
// 6. 执行下一个宏任务 K → 打印 K
// 最终输出：L → J → H → I → K

// ============================================================
// 示例 5：async / await 的底层是 Promise + 生成器
// ============================================================
// 场景：理解 async 函数的返回值和 await 的求值时机
// 预期结果：async 函数返回实际值，await 会阻塞直到值准备好
// 实际结果：async 函数总是返回 Promise；await 先求右侧表达式，再决定挂起
// 背后的 JS 引擎行为：
//   async 函数返回值总被包装为 Promise.resolve(value)。
//   await 先执行右侧表达式（同步阶段），然后将其结果包装为 Promise，
//   将后续代码注册为该 Promise 的回调（微任务）。

console.log('\n=== 示例 5: async/await 底层机制 ===');

async function demoAsync() {
  return 42; // 实际返回 Promise.resolve(42)
}

const asyncResult = demoAsync();
console.log('async 返回类型:', asyncResult instanceof Promise); // true

async function demoAwait() {
  // 右侧表达式立即执行（同步求值）
  const value = await 100; // 非 Promise 值被包装为 resolved Promise
  console.log('await 非 Promise:', value); // 100

  const delayed = await Promise.resolve(200);
  console.log('await Promise:', delayed);   // 200
}
demoAwait();

// 连续 await 与 Promise.all 的性能差异
async function sequentialAwait() {
  const start = Date.now();
  const a = await Promise.resolve(1); // 等待一个微任务
  const b = await Promise.resolve(2); // 再等待一个微任务
  const c = await Promise.resolve(3); // 再等待一个微任务
  console.log('sequential 结果:', a + b + c);
  return Date.now() - start; // 至少 0ms（但多了多次微任务排队）
}

async function parallelAwait() {
  const start = Date.now();
  const [a, b, c] = await Promise.all([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ]);
  console.log('parallel 结果:', a + b + c);
  return Date.now() - start; // 一次性排队，通常更快
}

sequentialAwait();
parallelAwait();

// ============================================================
// 示例 6：闭包的定义与内存模型
// ============================================================
// 场景：函数内部引用了外部变量，外部函数已经返回
// 预期结果：外部变量随函数返回而被销毁
// 实际结果：被闭包引用的外部变量无法被垃圾回收，持续存活
// 背后的 JS 引擎行为：
//   闭包 = 函数 + 该函数被创建时所处词法环境的引用。
//   词法环境包含所有在该作用域中声明的变量。若某变量被内层函数引用，
//   即使外层函数执行完毕，该变量所在的词法环境也不会被 GC 回收。

console.log('\n=== 示例 6: 闭包与内存模型 ===');

function createMultiplier(factor: number) {
  return function (value: number) {
    return value * factor; // factor 被闭包捕获
  };
}

const triple = createMultiplier(3);
console.log('triple(5):', triple(5)); // 15
// createMultiplier 已经返回，但 factor(3) 仍活在内存中

// 经典应用：缓存函数结果（memoize）
function memoize<T>(fn: (arg: number) => T) {
  const cache: Record<number, T> = {};
  return function (arg: number): T {
    if (arg in cache) {
      console.log('  命中缓存');
      return cache[arg]!; // arg in cache 已确认存在，! 绕过 noUncheckedIndexedAccess
    }
    const result = fn(arg);
    cache[arg] = result;
    return result;
  };
}

const slowSquare = memoize((n: number) => {
  console.log('  计算中...');
  return n * n;
});
console.log('slowSquare(4):', slowSquare(4)); // 计算中... → 16
console.log('slowSquare(4):', slowSquare(4)); // 命中缓存 → 16

// ============================================================
// 示例 7：变量提升（Hoisting）与暂时性死区（TDZ）
// ============================================================
// 场景：在声明前访问变量
// 预期结果：let/const 与 var 行为相同（都报错或未定义）
// 实际结果：var 提升为 undefined，let/const 提升但处于 TDZ，访问报 ReferenceError
// 背后的 JS 引擎行为：
//   JS 引擎在编译阶段会为每个作用域创建"词法环境"，所有声明（var/let/const/function）
//   都会被登记。var 的声明提升且初始化为 undefined；function 整体提升；
//   let/const 的声明也提升，但在执行到初始化语句前处于 TDZ，访问会触发 ReferenceError。

console.log('\n=== 示例 7: 变量提升与 TDZ ===');

// var 提升：声明提升，初始化不提升
// @ts-ignore 故意演示 var 提升行为（声明提升但值为 undefined）
console.log('varBefore:', typeof varBefore); // undefined（不会报错）
var varBefore = 1;

// function 整体提升
console.log('hoistedFunc:', hoistedFunc()); // "I am hoisted"
function hoistedFunc() {
  return 'I am hoisted';
}

// let/const TDZ（用函数包裹，避免在顶层直接触发错误导致脚本中断）
function testTDZ() {
  console.log('进入 testTDZ');
  // 下面这行若在 let 声明前执行，会报 ReferenceError
  // console.log(tdzVar); // ❌ Cannot access 'tdzVar' before initialization
  let tdzVar = 42;
  console.log('tdzVar:', tdzVar);
}
testTDZ();

// typeof 对未声明变量有特殊保护（不报错，返回 "undefined"）
// 即使在严格模式或模块作用域下，typeof 也不会抛出 ReferenceError
// @ts-ignore 故意演示未声明变量
console.log(typeof undeclaredVar); // "undefined"（不会报错！）

// 对比：直接访问未声明变量会报 ReferenceError
try {
  // @ts-ignore 故意演示未声明变量直接访问
  console.log(undeclaredVar);
} catch (e: any) {
  console.log('直接访问未声明变量报错:', e.message); // ReferenceError: undeclaredVar is not defined
}

// ============================================================
// 示例 8：作用域链与词法作用域
// ============================================================
// 场景：函数内部访问变量，变量在多个层级都有定义
// 预期结果：变量由调用位置决定
// 实际结果：变量由定义位置（词法作用域）决定，从内到外查找
// 背后的 JS 引擎行为：
//   词法作用域（Lexical Scope）在函数定义时确定，而非调用时。
//   每个函数都有一个 [[Environment]] 内部槽，指向其定义时的外层词法环境。
//   变量查找沿作用域链从内到外，直到全局对象。

console.log('\n=== 示例 8: 作用域链与词法作用域 ===');

const globalX = 'global';

function outer() {
  const outerX = 'outer';

  function inner() {
    const innerX = 'inner';
    console.log('inner 查找 globalX:', globalX); // global（沿作用域链到外到全局）
    console.log('inner 查找 outerX:', outerX);   // outer（闭包捕获）
    console.log('inner 查找 innerX:', innerX);   // inner（当前作用域）
  }

  return inner;
}

const innerFn = outer();
innerFn(); // outer 已执行完毕，但 outerX 仍被 inner 闭包引用

// 动态作用域的破坏者（尽量避免使用）
// eval 和 with 会篡改或新建作用域链，导致性能下降和难以推理的代码

// ============================================================
// 示例 9：块级作用域的实战
// ============================================================
// 场景：在循环中使用 let/const
// 预期结果：循环变量在每次迭代共享同一个绑定
// 实际结果：for (let ...) 每次迭代创建新的变量绑定（ES6 规范）
// 背后的 JS 引擎行为：
//   for (let i = 0; i < 3; i++) { ... } 中，每次迭代都会创建一个新的词法环境，
//   将新的 i 值绑定进去。因此闭包捕获的是不同环境中的 i。
//   for (const item of items) 中，每次迭代也创建新绑定，但 const 不允许重新赋值。

console.log('\n=== 示例 9: 块级作用域实战 ===');

// let 在 for 循环中：每次迭代新绑定
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log('let i:', i); // 0, 1, 2
  }, 0);
}

// const 在 for...of 中
const items = ['a', 'b', 'c'];
for (const item of items) {
  setTimeout(() => {
    console.log('const item:', item); // a, b, c
  }, 0);
}

// if 块级作用域
if (true) {
  const blockScoped = '只在 if 内可见';
  console.log('if 块内:', blockScoped);
}
// console.log(blockScoped); // ReferenceError

// ============================================================
// 示例 10：setTimeout / setInterval 的精度问题
// ============================================================
// 场景：用 setTimeout 做精确计时
// 预期结果：延迟时间严格准确
// 实际结果：最小延迟受浏览器节流，嵌套层级超过 5 层时最小 4ms
// 背后的 JS 引擎行为：
//   HTML5 规范要求：嵌套的 setTimeout（层级 > 5）最小延迟为 4ms。
//   后台标签页定时器最小延迟可高达 1000ms（浏览器节能策略）。
//   setInterval 的累积效应：若回调执行时间超过间隔，回调会连续排队执行。

console.log('\n=== 示例 10: 定时器精度问题 ===');

console.log('setTimeout(0) 实际最小延迟约 4ms（嵌套时）');
console.log('浏览器后台标签页定时器会被节流（最小约 1000ms）');

// setInterval 累积效应演示
let intervalCount = 0;
const intervalId = setInterval(() => {
  intervalCount++;
  console.log('interval 触发 #', intervalCount);
  if (intervalCount >= 3) {
    clearInterval(intervalId);
  }
}, 10);

// 推荐：setTimeout 递归模拟可控间隔
function safeInterval(callback: () => void, delay: number, times: number) {
  let count = 0;
  function tick() {
    if (count >= times) return;
    callback();
    count++;
    setTimeout(tick, delay);
  }
  tick();
}

// ============================================================
// 示例 11：requestAnimationFrame 的位置
// ============================================================
// 场景：用 rAF 做动画或与 setTimeout(0) 比较
// 预期结果：rAF 与 setTimeout(0) 几乎同时执行
// 实际结果：rAF 在每次重绘前执行，与显示器刷新率同步（通常 60fps）
// 背后的 JS 引擎行为：
//   rAF 回调被安排在"渲染阶段"之前，与显示器的垂直同步信号对齐。
//   若显示器是 60Hz，则每 16.7ms 最多执行一次。
//   适合动画，不适合精确计时；在后台标签页会暂停。

console.log('\n=== 示例 11: requestAnimationFrame ===');
console.log('rAF 在事件循环的渲染阶段之前执行');
console.log('与显示器刷新率同步，不适合精确计时');

// 浏览器环境才有的 API，Node.js 中不存在，用 typeof 检查
if (typeof requestAnimationFrame !== 'undefined') {
  requestAnimationFrame(() => {
    console.log('rAF callback executed');
  });
} else {
  console.log('（Node.js 环境没有 requestAnimationFrame）');
}

// ============================================================
// 示例 12：内存泄漏的常见场景
// ============================================================
// 场景：闭包引用 DOM 元素，组件卸载后未清理
// 预期结果：DOM 元素随组件卸载被 GC 回收
// 实际结果：闭包仍引用 DOM 元素，导致内存无法释放
// 背后的 JS 引擎行为：
//   垃圾回收器（GC）使用可达性分析：从根对象（global、当前执行上下文等）出发，
//   无法被访问到的对象才会被回收。若闭包仍引用某 DOM 节点，该节点保持可达，不会被回收。
//   console.log 的对象也会被 DevTools 引用，生产环境应移除调试日志。

console.log('\n=== 示例 12: 内存泄漏场景 ===');

// 模拟：闭包引用 DOM 元素（Node.js 中用普通对象模拟）
function createLeakyComponent() {
  const elements: HTMLElement[] = [];

  return {
    addElement(el: HTMLElement) {
      elements.push(el); // 闭包引用 el
    },
    // 修复：提供清理方法
    destroy() {
      elements.length = 0; // 清空引用
    },
  };
}

console.log('内存泄漏常见原因：');
console.log('1. 闭包引用 DOM 元素，组件卸载后未释放');
console.log('2. 全局变量意外挂载（如未声明的变量赋值）');
console.log('3. 定时器/事件监听未清理');
console.log('4. console.log 的对象被 DevTools 引用，生产环境应移除');

// ============================================================
// 错误示例（看似合理但实际错误）
// ============================================================

console.log('\n=== 错误示例 ===');

// ---- 错误 1：var 在 for 循环 + setTimeout 中输出全是最终值 ----
// 错误原因：var 只有函数作用域，没有块级作用域，三个 setTimeout 共享同一个 i
// 注意：在 ES 模块中 var 不会泄漏为全局变量（模块有自己的顶层作用域），
// 但函数/块级作用域内的表现不变——仍然会穿透块作用域
// 修复方案：改用 let（每次迭代新绑定），或用 IIFE 创建独立作用域

for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log('var i（错误，全是最终值）:', i); // 3, 3, 3
  }, 0);
}

// 修复：IIFE
for (var j = 0; j < 3; j++) {
  ((capturedJ: number) => {
    setTimeout(() => {
      console.log('var + IIFE 修复:', capturedJ); // 0, 1, 2
    }, 0);
  })(j);
}

// 最佳修复：直接用 let
for (let k = 0; k < 3; k++) {
  setTimeout(() => {
    console.log('let k（正确）:', k); // 0, 1, 2
  }, 0);
}

// ---- 错误 2：await 在 forEach 回调中不等待 ----
// 错误原因：forEach 的回调是同步执行的，它不会等待内部的 async 函数完成
// 修复方案：改用 for...of 循环，或结合 Promise.all + map

async function demoWrongAwait() {
  const delays = [100, 50, 10];

  console.log('forEach 开始（不会等待）');
  delays.forEach(async (ms) => {
    await new Promise((r) => setTimeout(r, ms));
    console.log('  forEach 延迟:', ms);
  });
  console.log('forEach 结束（已经执行到这里！）');
}

async function demoCorrectAwait() {
  const delays = [100, 50, 10];

  console.log('for...of 开始（正确等待）');
  for (const ms of delays) {
    await new Promise((r) => setTimeout(r, ms));
    console.log('  for...of 延迟:', ms);
  }
  console.log('for...of 结束（此时全部完成）');
}

demoWrongAwait();
demoCorrectAwait();

// ---- 错误 3：闭包循环引用导致内存泄漏 ----
// 错误原因：DOM 元素引用闭包，闭包又引用 DOM 元素，形成循环引用
// 修复方案：组件卸载时手动解除引用，或使用 WeakMap

function createLeakyClosure() {
  const cache = new Map<string, any>(); // Map 强引用 key 和 value

  return {
    set(key: string, value: any) {
      cache.set(key, value);
    },
    get(key: string) {
      return cache.get(key);
    },
    // 修复：提供清理
    clear() {
      cache.clear();
    },
  };
}

// 若 value 又反过来引用 key（如 DOM 节点），形成循环引用，必须手动清理

// ---- 错误 4：在全局对象上隐式挂载变量 ----
// 错误原因：非严格模式下，赋值给未声明的变量会在全局对象上创建属性
// 修复方案：使用 "use strict" 或 const/let 始终声明变量

function implicitGlobal() {
  // @ts-ignore 故意演示未声明变量
  accidentallyGlobal = 'Oops!'; // 非严格模式下挂载到 globalThis！
}
// 本项目 tsconfig 启用了 strict，且模块默认严格模式，所以这行会报错
// implicitGlobal(); // 在模块中这会导致 ReferenceError，这是好事！
console.log('模块默认严格模式，未声明变量赋值会报错（安全）');

// ============================================================
// 本章小结
// ============================================================
/*
 * 必须记住的口诀 / 避坑检查清单：
 *
 * 1. 【同步 → 微任务 → 宏任务】事件循环的核心顺序：先执行同步代码，
 *    再清空所有微任务（包括微任务中产生的微任务），最后取下一个宏任务。
 * 2. 【await 后面挂起】await 右侧表达式先同步执行，await 之后的代码变微任务。
 * 3. 【let 每次迭代新绑定】for (let i ...) 中每次迭代 i 都是新变量，
 *    for (var i ...) 中所有回调共享同一个 i。
 * 4. 【forEach 不等待】不要在 forEach 回调里用 await，改用 for...of 或 Promise.all。
 * 5. 【闭包引用的变量不回收】被闭包引用的外部变量常驻内存，注意清理引用避免泄漏。
 * 6. 【var 提升 undefined，let TDZ 报错】不要在 let/const 声明前访问变量。
 * 7. 【定时器不精确】setTimeout(0) 实际至少 4ms，后台标签页可能 1000ms+。
 * 8. 【rAF 同步刷新率】requestAnimationFrame 与显示器 60Hz 同步，适合动画不适合计时。
 * 9. 【Map 强引用会泄漏】需要自动回收用 WeakMap/WeakSet，组件卸载记得清定时器和监听。
 * 10. 【TS 不管执行顺序】编译器无法帮你预测 setTimeout 和 Promise 谁先执行，必须理解事件循环。
 */
