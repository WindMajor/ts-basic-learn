/**
 * 学习目标：
 * 1. 掌握泛型函数、泛型接口、泛型类的定义方法
 * 2. 理解多个类型参数与类型参数命名规范
 * 3. 学会使用泛型默认值 `<T = string>`
 * 4. 在数据结构（栈、队列）中应用泛型
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 的类型提示支持泛型（typing.Generic, typing.TypeVar），但运行时不检查
 * - Java 的泛型使用类型擦除，运行时无法获取 T 的具体类型；TS 的泛型也在编译期擦除
 * - Rust 的泛型与 TS 非常相似，但 Rust 在编译期为每个具体类型生成单态化代码；TS 只是类型擦除
 * - TS 的泛型约束 `T extends U` 类似 Rust 的 Trait Bound `T: U`
 */

// ==========================================
// 示例 1：泛型函数
// 使用场景：编写处理多种类型的通用函数，同时保持类型安全
// ==========================================

function identity<T>(value: T): T {
  return value;
}

const num = identity<number>(42);
const str = identity("hello"); // 类型推断自动确定 T = string
console.log(num, str);

// ==========================================
// 示例 2：泛型接口
// 使用场景：定义通用的数据结构或回调接口
// ==========================================

interface Container<T> {
  value: T;
  getValue(): T;
  setValue(newValue: T): void;
}

const numberContainer: Container<number> = {
  value: 100,
  getValue() {
    return this.value;
  },
  setValue(newValue) {
    this.value = newValue;
  },
};

numberContainer.setValue(200);
console.log(numberContainer.getValue());

// ==========================================
// 示例 3：泛型类
// 使用场景：创建可复用的类型安全数据结构
// ==========================================

class Box<T> {
  private content: T;

  constructor(value: T) {
    this.content = value;
  }

  getContent(): T {
    return this.content;
  }

  setContent(value: T): void {
    this.content = value;
  }
}

const stringBox = new Box("secret");
console.log(stringBox.getContent().toUpperCase());

const numberBox = new Box(42);
console.log(numberBox.getContent().toFixed(2));

// ==========================================
// 示例 4：多个类型参数
// 使用场景：函数或类需要处理两种及以上类型之间的关系
// ==========================================

function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const myPair = pair("key", 123);
console.log(myPair); // ["key", 123]

// 类型参数命名规范：
// T = Type, U = Second Type, K = Key, V = Value, E = Element, R = Return

// ==========================================
// 示例 5：泛型默认值
// 使用场景：为泛型参数提供默认类型，简化常见用法
// ==========================================

class GenericStorage<T = string> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): T[] {
    return this.items;
  }
}

// 使用默认类型 string
const stringStorage = new GenericStorage();
stringStorage.add("hello");

// 显式指定类型
const numberStorage = new GenericStorage<number>();
numberStorage.add(42);

// ==========================================
// 示例 6：泛型栈（Stack）
// 使用场景：后进先出（LIFO）数据结构
// ==========================================

class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

const numStack = new Stack<number>();
numStack.push(10);
numStack.push(20);
console.log(numStack.pop()); // 20
console.log(numStack.peek()); // 10

// ==========================================
// 示例 7：泛型队列（Queue）
// 使用场景：先进先出（FIFO）数据结构
// ==========================================

class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  front(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const stringQueue = new Queue<string>();
stringQueue.enqueue("first");
stringQueue.enqueue("second");
console.log(stringQueue.dequeue()); // "first"
console.log(stringQueue.front()); // "second"

// ==========================================
// 示例 8：泛型约束（预览，下一章详细展开）
// 使用场景：限制泛型参数必须具有某些属性
// ==========================================

interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(`Length: ${arg.length}`);
  return arg;
}

logLength("hello"); // Length: 5
logLength([1, 2, 3]); // Length: 3
// logLength(42); // ❌ number 没有 length 属性

// ==========================================
// 示例 9：泛型工具函数
// 使用场景：处理数组、对象的通用操作
// ==========================================

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

const numbers = [10, 20, 30];
console.log(first(numbers)); // 10
console.log(last(numbers)); // 30

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

function doubleGeneric<T>(x: T): T {
  // @ts-expect-error 泛型参数不能直接使用算术运算，T 可能是 string 等非数字类型
  return x * 2;
}

function requireLength<T extends HasLength>(x: T): void {
  console.log(x.length);
}
// @ts-expect-error number 不满足 HasLength 约束
requireLength(123);

// ==========================================
// 本章小结
// ==========================================
// 1. 泛型让代码在保持类型安全的同时实现复用，避免 any 的滥用
// 2. 泛型函数、接口、类的声明方式类似，都在名称后加 <T>
// 3. 多个类型参数按 T, U, K, V, E, R 等惯例命名
// 4. 泛型默认值 <T = string> 简化常见用法，调用时可省略类型参数
// 5. 泛型栈和队列展示了泛型在数据结构中的核心应用
// 6. 泛型约束 extends 限制参数必须满足的条件，确保泛型代码安全操作类型
