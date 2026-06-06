/**
 * 学习目标：
 * 1. 掌握数字枚举、字符串枚举、常量枚举 const enum 的用法
 * 2. 理解枚举的反向映射机制
 * 3. 了解联合类型作为枚举的现代化替代方案
 * 4. 掌握可辨识联合（Discriminated Unions）的构建方法
 * 5. 学会使用 switch 配合 never 实现穷尽检查（Exhaustiveness Checking）
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 3.4+ 有 enum 模块，用法类似 TS 枚举；Python 的 Enum 是类
 * - Java 的 enum 是完整的类，可定义字段和方法；TS 的 enum 编译后生成双向映射对象
 * - Rust 没有枚举的反向映射，Rust 的 enum 是代数数据类型（可带数据），更接近 TS 的可辨识联合
 * - 现代 TS 推荐用「联合类型 + as const」替代传统 enum，获得更好的类型安全和 Tree Shaking
 */

// ==========================================
// 示例 1：数字枚举（Numeric Enum）
// 使用场景：需要一组有默认递增数值的常量
// ==========================================

enum Direction {
  North, // 0
  East, // 1
  South, // 2
  West, // 3
}

const myDirection = Direction.North;
console.log(myDirection); // 0

// 指定起始值
enum StatusCode {
  OK = 200,
  NotFound = 404,
  ServerError = 500,
}

console.log(StatusCode.NotFound); // 404

// ==========================================
// 示例 2：字符串枚举（String Enum）
// 使用场景：需要人类可读的常量值，且编译后仍为字符串
// ==========================================

enum LogLevel {
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
}

function logMessage(level: LogLevel, message: string): void {
  console.log(`[${level}] ${message}`);
}

logMessage(LogLevel.Info, "System started");

// ==========================================
// 示例 3：枚举的反向映射（Reverse Mapping）
// 使用场景：通过值查找名称（仅限数字枚举）
// ==========================================

// 数字枚举编译后会生成双向映射
console.log(Direction[0]); // "North"
console.log(Direction["North"]); // 0

// 字符串枚举没有反向映射
// console.log(LogLevel["DEBUG"]); // ❌ 编译错误

// ==========================================
// 示例 4：常量枚举 const enum（编译时内联）
// 使用场景：性能敏感场景，避免生成额外的映射对象
// ==========================================

const enum Permission {
  Read = 1,
  Write = 2,
  Execute = 4,
}

const myPermission = Permission.Read | Permission.Write;
console.log(myPermission); // 3

// const enum 在编译后会被内联为字面量，不会生成对象
// 编译结果大致为：const myPermission = 1 | 2;

// ==========================================
// 示例 5：联合类型作为枚举的现代化替代
// 使用场景：更轻量、类型安全、支持 Tree Shaking
// ==========================================

type ModernDirection = "north" | "south" | "east" | "west";

function moveModern(dir: ModernDirection): void {
  console.log(`Moving ${dir}`);
}

moveModern("north");
// moveModern("up"); // ❌ 编译错误

// 用 as const 对象模拟枚举，获得更好的 IDE 提示
const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;

type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

function request(method: HttpMethod, url: string): void {
  console.log(`${method} ${url}`);
}

request(HttpMethod.GET, "/api/users");

// ==========================================
// 示例 6：可辨识联合（Discriminated Unions）
// 使用场景：表示一组相关的、但结构不同的数据类型（类似 Rust 的 Enum）
// ==========================================

type Circle = {
  kind: "circle";
  radius: number;
};

type Rectangle = {
  kind: "rectangle";
  width: number;
  height: number;
};

type Triangle = {
  kind: "triangle";
  base: number;
  height: number;
};

type Shape = Circle | Rectangle | Triangle;

// ==========================================
// 示例 7：switch 配合 never 实现穷尽检查
// 使用场景：确保处理了所有联合类型的分支，新增类型时编译器会提醒
// ==========================================

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // 穷尽检查：如果 Shape 新增了一种类型但忘记处理，这里会编译报错
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}

console.log(getArea({ kind: "circle", radius: 5 }));
console.log(getArea({ kind: "rectangle", width: 4, height: 6 }));
console.log(getArea({ kind: "triangle", base: 4, height: 6 }));

// ==========================================
// 示例 8：可辨识联合在业务场景中的应用
// 使用场景：处理异步请求的不同状态
// ==========================================

type LoadingState = { status: "loading" };
type SuccessState<T> = { status: "success"; data: T };
type ErrorState = { status: "error"; error: string };

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "loading":
      return "加载中...";
    case "success":
      return `数据: ${JSON.stringify(state.data)}`;
    case "error":
      return `错误: ${state.error}`;
    default:
      const _exhaustive: never = state;
      return _exhaustive;
  }
}

console.log(renderState<string>({ status: "success", data: "hello" }));

// ==========================================
// 示例 9：异构枚举（Heterogeneous Enums）
// 使用场景：混合字符串和数字（不推荐，仅作了解）
// ==========================================

enum MixedEnum {
  No = 0,
  Yes = "YES",
}

console.log(MixedEnum.No, MixedEnum.Yes);

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error 枚举成员不能在声明后修改
Direction.North = 100;

// @ts-expect-error 字符串枚举没有反向映射
const levelName = LogLevel[LogLevel.Info];

// 常量枚举在编译后会被内联，不能像普通枚举那样通过索引访问
// const enumAccess = Permission["Read"]; // ❌

// ==========================================
// 本章小结
// ==========================================
// 1. 数字枚举自动生成递增值，支持反向映射；字符串枚举可读性更好，但不支持反向映射
// 2. const enum 在编译时内联，不生成运行时代码，适合性能敏感场景
// 3. 现代 TS 项目更推荐用「联合类型 + as const 对象」替代传统 enum，获得更好的 Tree Shaking
// 4. 可辨识联合（kind/status 等标记字段）是处理「多形态数据」的最佳实践
// 5. switch + default 中的 never 赋值是穷尽检查的惯用写法，强烈推荐
// 6. 对比 Rust：TS 的可辨识联合最接近 Rust 的代数数据类型（ADT）
