/**
 * 学习目标：
 * 1. 掌握 type 关键字与类型别名的基本用法
 * 2. 理解联合类型 `|` 与交叉类型 `&` 的区别与应用
 * 3. 学会类型断言 `as` 的正确用法与使用禁忌
 * 4. 了解非空断言 `!` 与双重断言
 * 5. 建立 interface vs type 的决策指南
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 3.10+ 的 Union[str, int] 对应 TS 的 string | number；Python 无交叉类型
 * - Java 没有类型别名（除泛型外），TS 的 type 提供了强大的类型组合能力
 * - Rust 的 type 关键字（类型别名）与 TS 类似；Rust 的 trait 组合类似交叉类型
 * - TS 的类型系统在编译期运行，不生成运行时代码，这是与 Java/Rust 的本质区别
 */

// ==========================================
// 示例 1：type 关键字与类型别名
// 使用场景：为复杂类型起别名，提高代码可读性和复用性
// ==========================================

type UserID = string;
type Point = { x: number; y: number };
type Callback = (data: string) => void;

const userId: UserID = "user_123";
const point: Point = { x: 10, y: 20 };
const cb: Callback = (data) => console.log(data);

// ==========================================
// 示例 2：联合类型（Union Types）
// 使用场景：一个值可能是多种类型之一
// ==========================================

type Status = "loading" | "success" | "error";
type StringOrNumber = string | number;

function printId(id: StringOrNumber): void {
  if (typeof id === "string") {
    console.log(`ID is string: ${id.toUpperCase()}`);
  } else {
    console.log(`ID is number: ${id.toFixed(0)}`);
  }
}

printId("abc");
printId(123);

// 联合类型与 null/undefined 组合
type MaybeString = string | undefined;
const maybe: MaybeString = undefined;

// ==========================================
// 示例 3：交叉类型（Intersection Types）
// 使用场景：将多个类型合并为一个，获得所有类型的属性
// ==========================================

type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

const person: Person = {
  name: "Alice",
  age: 30,
};

// 交叉类型也可用于合并接口的行为
type Loggable = {
  log(message: string): void;
};
type Serializable = {
  toJSON(): string;
};

type LoggableAndSerializable = Loggable & Serializable;

class MyClass implements LoggableAndSerializable {
  log(message: string): void {
    console.log(message);
  }
  toJSON(): string {
    return JSON.stringify(this);
  }
}

// ==========================================
// 示例 4：类型断言 as（Type Assertion）
// 使用场景：当开发者比编译器更了解值的类型时，手动指定类型
// ==========================================

const someValue: unknown = "this is a string";
const strLength = (someValue as string).length;
console.log(strLength);

// 断言 HTMLElement 为更具体的类型
// const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;

// ==========================================
// 示例 5：尖括号语法（及使用禁忌）
// 使用场景：与 as 等价，但在 TSX 中会与 JSX 语法冲突
// ==========================================

const anotherValue: unknown = "hello";
const anotherLength = (<string>anotherValue).length;
console.log(anotherLength);

// ⚠️ 禁忌：不要在 TSX (.tsx) 文件中使用尖括号语法，统一使用 as

// ==========================================
// 示例 6：非空断言 !（Non-null Assertion）
// 使用场景：确定一个值不为 null/undefined，但编译器无法推断
// ==========================================

function getNameMaybe(): string | null {
  return "Alice";
}

const nameMaybe = getNameMaybe();
// 开发者确定此时 nameMaybe 不会为 null
const nameLength = nameMaybe!.length;
console.log(nameLength);

// ⚠️ 禁忌：滥用 ! 会掩盖真正的空值错误，应优先使用 if 检查或 ?? 运算符

// ==========================================
// 示例 7：双重断言
// 使用场景：极少数情况下需要跳过类型检查（尽量避免）
// ==========================================

const weirdValue = "hello" as unknown as number;
// 先将 string 断为 unknown，再断为 number
// 这完全破坏了类型安全，应极力避免！
console.log(weirdValue);

// ==========================================
// 示例 8：interface vs type 的决策指南
// 使用场景：知道何时选择 interface，何时选择 type
// ==========================================

// ✅ 使用 interface：
// - 定义对象形状，需要声明合并时
// - 类需要 implements 时
interface Drawable {
  draw(): void;
}

// ✅ 使用 type：
// - 需要联合类型、交叉类型时
// - 需要类型别名（原始类型、元组）时
// - 需要使用 typeof、映射类型等高级特性时
type Color = "red" | "green" | "blue";
type Coordinate = [number, number];
type Employee = { name: string } & { department: string };

// 功能对比表（以注释形式展示）
// | 特性                  | interface | type     |
// |----------------------|-----------|----------|
// | 对象形状              | ✅        | ✅       |
// | 声明合并              | ✅        | ❌       |
// | extends/implements    | ✅        | ❌       |
// | 联合/交叉类型          | ❌        | ✅       |
// | 原始类型别名           | ❌        | ✅       |
// | 映射类型               | ❌        | ✅       |

// ==========================================
// 示例 9：联合类型的 discriminant 模式
// 使用场景：为可辨识联合（Discriminated Union）奠定基础
// ==========================================

type Circle = { kind: "circle"; radius: number };
type Rectangle = { kind: "rectangle"; width: number; height: number };
type Shape = Circle | Rectangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
  }
}

console.log(getArea({ kind: "circle", radius: 5 }));

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// 交叉类型中同名属性类型不兼容时会变成 never
type Incompatible = { id: number } & { id: string };
// @ts-expect-error id 的类型为 never，无法赋值
const bad: Incompatible = { id: 1 };

// @ts-expect-error string 不能直接断言为 number（跳过了 unknown）
const wrongAssertion: number = "123" as number;

const definitelyNull: string | null = null;
// ⚠️ 非空断言掩盖了真正的 null 值问题，运行时会崩溃（但 TS 编译器不会报错）
console.log(definitelyNull!.length);

// ==========================================
// 本章小结
// ==========================================
// 1. type 为类型起别名，联合类型 | 表示「或」，交叉类型 & 表示「且」
// 2. 类型断言 as 用于告诉编译器「相信我，我知道这个类型」，但不应滥用
// 3. 非空断言 ! 是便捷的逃生舱，但优先使用类型保护或空值合并 ??
// 4. interface 适合对象形状和声明合并，type 适合联合/交叉/高级类型运算
// 5. 双重断言是最后的手段，应极力避免，它完全绕过了类型安全
