/**
 * 学习目标：
 * 1. 掌握 interface 定义对象形状的基本用法
 * 2. 理解可选属性、只读属性、索引签名的作用
 * 3. 学会接口继承（extends）和类实现接口（implements）
 * 4. 了解接口的声明合并（Declaration Merging）特性
 * 5. 能与 Python Dataclass / Java 接口 / Rust Trait 进行对比思考
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 的 dataclass 定义数据结构，没有编译期接口检查；TS 的 interface 是编译期概念
 * - Java 的 interface 定义行为规范，类必须实现所有方法；TS 的 interface 也可以描述对象形状（数据 + 方法）
 * - Rust 的 struct 对应 TS 中「类实现接口后的对象」；Rust 的 trait 更接近 TS 的 interface（定义行为契约）
 * - TS 独有的特性：接口可以声明合并（同名的 interface 会自动合并）
 */

// ==========================================
// 示例 1：基本接口定义
// 使用场景：定义对象必须具有的属性和方法
// ==========================================

interface Person {
  name: string;
  age: number;
}

const alice: Person = {
  name: "Alice",
  age: 30,
};

console.log(alice);

// ==========================================
// 示例 2：可选属性（Optional Properties）
// 使用场景：某些属性不是每个对象都必须有
// ==========================================

interface Product {
  id: number;
  name: string;
  description?: string; // 可选属性
  price?: number; // 可选属性
}

const book: Product = {
  id: 1,
  name: "TypeScript 进阶",
};

const laptop: Product = {
  id: 2,
  name: "MacBook Pro",
  price: 14999,
  description: "高性能笔记本电脑",
};

console.log(book, laptop);

// ==========================================
// 示例 3：只读属性（Readonly Properties）
// 使用场景：创建后不应修改的属性，如 ID、创建时间等
// ==========================================

interface Point {
  readonly x: number;
  readonly y: number;
}

const origin: Point = { x: 0, y: 0 };
// origin.x = 10; // ❌ 不能修改只读属性

// 但只读是浅层的，对象内部的可变属性仍可修改
interface MutableInside {
  readonly coords: number[];
}

const mutable: MutableInside = { coords: [1, 2] };
mutable.coords.push(3); // 可以，因为数组本身是可变的

// ==========================================
// 示例 4：索引签名（Index Signatures）
// 使用场景：对象的键是动态字符串/数字，值是同类型
// ==========================================

interface StringDictionary {
  [key: string]: string;
}

const translations: StringDictionary = {
  hello: "你好",
  world: "世界",
  goodbye: "再见",
};

console.log(translations.hello);

// 混合索引签名与已知属性
interface MixedDict {
  name: string; // 已知属性
  [key: string]: string | number; // 索引签名需兼容已知属性
}

const mixed: MixedDict = {
  name: "test",
  age: 25,
  city: "Beijing",
};

// ==========================================
// 示例 5：接口继承（Interface Inheritance）
// 使用场景：基于已有接口扩展新功能，避免重复定义
// ==========================================

interface Animal {
  name: string;
  move(): void;
}

interface Bird extends Animal {
  wingspan: number;
  fly(): void;
}

const sparrow: Bird = {
  name: "Sparrow",
  wingspan: 25,
  move() {
    console.log("Jumping");
  },
  fly() {
    console.log("Flying high");
  },
};

sparrow.fly();

// 多继承（一个接口可继承多个接口）
interface CanSwim {
  swim(): void;
}

interface CanFly {
  fly(): void;
}

interface Duck extends Animal, CanSwim, CanFly {}

const duck: Duck = {
  name: "Donald",
  move() {
    console.log("Waddling");
  },
  swim() {
    console.log("Swimming");
  },
  fly() {
    console.log("Flying");
  },
};

// ==========================================
// 示例 6：类实现接口（Class Implements Interface）
// 使用场景：强制类遵循某种契约，确保实现必要的属性和方法
// ==========================================

interface Logger {
  log(message: string): void;
  error(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

const logger = new ConsoleLogger();
logger.log("System started");

// ==========================================
// 示例 7：接口的声明合并（Declaration Merging）
// 使用场景：扩展第三方库的类型定义，或分散定义大型接口
// ==========================================

interface Window {
  customProperty: string;
}

// 在同文件中再次声明同名接口，会自动合并
interface Window {
  anotherProperty: number;
}

// 注意：实际在浏览器环境中使用 window 需要 declare global
// 这里仅演示接口声明合并的机制
const mockWindow: Window = {
  customProperty: "hello",
  anotherProperty: 42,
};

console.log(mockWindow);

// ==========================================
// 示例 8：函数类型接口
// 使用场景：用接口描述函数签名，比 type 别名更具扩展性
// ==========================================

interface SearchFunc {
  (source: string, subString: string): boolean;
}

const mySearch: SearchFunc = (source, subString) => {
  return source.includes(subString);
};

console.log(mySearch("hello world", "world")); // true

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error 缺少必填属性 'age'
const incompletePerson: Person = {
  name: "Bob",
};

const extraProps: Person = {
  name: "Charlie",
  age: 25,
  // @ts-expect-error 对象字面量中不能有多余的属性（除非接口有索引签名）
  hobby: "coding",
};

// @ts-expect-error 只读属性不能重新赋值
origin.x = 100;

// ==========================================
// 本章小结
// ==========================================
// 1. interface 是 TS 中定义对象形状的核心工具，编译后会被擦除
// 2. 可选属性用 ? 标记，只读属性用 readonly 标记
// 3. 索引签名 [key: string]: T 允许动态键的对象，但已知属性必须兼容索引签名类型
// 4. 接口可以 extends 多个父接口，类可以 implements 多个接口
// 5. 声明合并是 TS 独有的特性：同名的 interface 定义会自动合并
// 6. 对比：Python dataclass 侧重数据，Java interface 侧重行为，Rust trait 类似接口但更严格；TS interface 兼具数据形状和行为契约
