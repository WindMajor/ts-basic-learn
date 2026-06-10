/**
 * 学习目标：
 * 1. 掌握 TypeScript 的基础类型：string, number, boolean, null, undefined, void
 * 2. 深入理解 any, unknown, never 三者的区别与使用场景
 * 3. 了解 bigint 和 symbol 类型的使用
 * 4. 掌握字面量类型（Literal Types）与 as const 的用法
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 是动态类型，运行时决定类型；TS 是静态类型，编译期检查
 * - Java 有基本类型和包装类的区别；TS 的 number/string/boolean 在编译后都是 JS 对象/原始值
 * - Rust 的 Option<T> 对应 TS 的 T | null | undefined；Rust 的 !（never type）与 TS 的 never 概念相似
 * - TS 的 any 类似于 Python 的任意类型；unknown 是类型安全的 any
 */

// ==========================================
// 示例 1：string, number, boolean
// 使用场景：最常用的三种基本类型
// ==========================================

const userName: string = 'TypeScript';
const userAge: number = 10;
const isAwesome: boolean = true;

// 模板字符串也归 string 类型
const greeting: string = `Hello, ${userName}! You are ${userAge} years old.`;
console.log(greeting);

// ==========================================
// 示例 2：null 与 undefined
// 使用场景：表示「无值」或「未初始化」
// ==========================================

let emptyValue: null = null;
let notInitialized: undefined = undefined;

// 在 strictNullChecks 开启时，null 和 undefined 不能赋值给其他类型
let strictString: string = 'hello';
// 以下代码在 strict: true 下会报错：
// strictString = null; // ❌
// strictString = undefined; // ❌

// 联合类型允许 null/undefined
let nullableString: string | null = null;
nullableString = 'now has value';

// ==========================================
// 示例 3：void 类型
// 使用场景：函数没有返回值时的返回类型
// ==========================================

function logMessage(msg: string): void {
  console.log(msg);
  // 没有 return 语句，或只写 return;
}

const useless: void = undefined; // void 只能赋值为 undefined 或 null（非 strictNullChecks 下）

// ==========================================
// 示例 4：any —— 绕过类型检查（尽量避免）
// 使用场景：迁移旧 JS 代码、第三方库无类型定义时的临时方案
// ==========================================

let anything: any = 4;
anything = 'string';
anything = true;
anything.toFixed(); // 编译不报错，但运行时可能崩溃！

// ==========================================
// 示例 5：unknown —— 类型安全的 any
// 使用场景：不确定传入值的类型，需要先做类型检查才能使用
// ==========================================

let uncertain: unknown = 4;
uncertain = 'maybe a string';

// 直接使用 unknown 值会报错，必须先做类型收窄
// uncertain.toFixed(); // ❌ 编译错误

if (typeof uncertain === 'string') {
  console.log(uncertain.toUpperCase()); // 在类型保护内可以安全使用
}

// ==========================================
// 示例 6：never —— 永不可达的返回类型
// 使用场景：抛出异常的函数、穷尽检查中剩余的不可达分支
// ==========================================

function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {
    // 永不离出
  }
}

// never 在联合类型中会自动消失
// type T = string | never; // 等价于 string

// ==========================================
// 示例 7：bigint —— 大整数
// 使用场景：处理超过 Number.MAX_SAFE_INTEGER 的整数
// ==========================================

const bigNumber: bigint = 9007199254740991n;
const anotherBig: bigint = BigInt(123456789);
console.log(bigNumber + anotherBig);

// ==========================================
// 示例 8：symbol —— 唯一标识符
// 使用场景：创建对象中不会冲突的属性键
// ==========================================

const sym1: symbol = Symbol('description');
const sym2: symbol = Symbol('description');
console.log(sym1 === sym2); // false，每个 Symbol 都是唯一的

console.log(`typeof sym1 = ${typeof sym1}`);

const sym3 = sym1;
console.log(`typeof sym3 = ${typeof sym3}`);

const secretKey = Symbol('secret');
const objWithSymbol = {
  [secretKey]: 'hidden value',
  normalKey: 'visible value',
};
console.log(`objWithSymbol = ${objWithSymbol}`);
console.log(objWithSymbol[secretKey]);

// ==========================================
// 示例 9：字面量联合类型（Literal Types）
// 使用场景：限制变量只能是特定的几个值，比枚举更轻量
// ==========================================

let direction: 'north' | 'south' | 'east' | 'west';
direction = 'north';
// direction = "up"; // ❌ 不在允许的范围内

type HttpStatus = 200 | 404 | 500;
const statusCode: HttpStatus = 200;

// ==========================================
// 示例 10：as const —— 将对象/数组转为只读字面量类型
// 使用场景：需要精确推断常量对象的类型，而非宽泛的基本类型
// ==========================================

const config = {
  host: 'localhost',
  port: 3000,
  debug: true,
} as const;

// config 的类型变为：
// {
//   readonly host: "localhost";
//   readonly port: 3000;
//   readonly debug: true;
// }

// config.port = 8080; // ❌ 只读属性不能修改

const tupleConst = [1, 2, 3] as const;
// tupleConst 的类型为 readonly [1, 2, 3]，固定长度且不可变

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error any 赋给具体类型是允许的，但反向需小心；此处演示 unknown 类型的变量不能直接赋值给具体类型
let unknownToString: string = uncertain;

// @ts-expect-error 非 never 类型不能赋值给 never
let neverValue: never = 'impossible';

// @ts-expect-error 在 strictNullChecks 下，null 不能赋值给非 null 类型
let strictNum: number = null;

// ==========================================
// 本章小结
// ==========================================
// 1. string/number/boolean 是最常用的基本类型，编译后对应 JS 原始类型
// 2. null/undefined 在 strict 模式下需要显式声明联合类型才能使用
// 3. any 绕过所有类型检查，应尽量避免；unknown 是类型安全的替代品
// 4. never 表示永不可达，常用于异常函数和穷尽检查
// 5. bigint 处理超大整数，symbol 创建唯一键
// 6. 字面量类型 + as const 能在不引入枚举的情况下实现精确的常量类型约束
