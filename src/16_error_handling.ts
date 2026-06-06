/**
 * 学习目标：
 * 1. 掌握 try/catch/finally 的结构，理解 catch 参数默认 unknown 类型
 * 2. 学会自定义错误类继承 Error
 * 3. 实现类型安全的错误处理：返回联合类型模拟 Result<T, E>
 * 4. 理解 throw 的类型与错误边界概念
 * 5. 掌握可选链 ?. 与空值合并 ?? 的防御性编程
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 的 try/except/finally 与 TS 的 try/catch/finally 结构几乎一致
 * - Java 的异常分为 checked 和 unchecked；TS 没有 checked 异常，所有异常都是 unchecked
 * - Rust 没有异常机制，使用 Result<T, E> 和 Option<T> 处理错误；TS 可以用联合类型模拟 Result
 * - TS 的 catch 参数默认 unknown（strict 模式下），必须做类型检查才能安全使用
 */

// ==========================================
// 示例 1：try/catch/finally 基础
// 使用场景：捕获可能抛出的异常，确保资源清理
// ==========================================

function riskyOperation(shouldFail: boolean): string {
  if (shouldFail) {
    throw new Error("Something went wrong!");
  }
  return "Success";
}

function runWithCatch(): void {
  try {
    console.log(riskyOperation(true));
  } catch (error) {
    // 在 strict 模式下，error 的类型是 unknown
    if (error instanceof Error) {
      console.log(`Caught: ${error.message}`);
    } else {
      console.log(`Unknown error: ${String(error)}`);
    }
  } finally {
    console.log("Cleanup code always runs");
  }
}

runWithCatch();

// ==========================================
// 示例 2：catch 参数默认 unknown
// 使用场景：理解为什么必须对 catch 参数进行类型检查
// ==========================================

function parseJSON(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    // error 是 unknown，不能直接访问 .message
    if (error instanceof SyntaxError) {
      console.log(`JSON parse error: ${error.message}`);
    }
    return null;
  }
}

console.log(parseJSON('{"a": 1}'));
console.log(parseJSON("invalid json"));

// ==========================================
// 示例 3：自定义错误类
// 使用场景：为不同错误场景创建语义化的错误类型
// ==========================================

class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

function processData(data: unknown): void {
  if (typeof data !== "object" || data === null) {
    throw new ValidationError("Data must be an object", "data");
  }
}

try {
  processData("not an object");
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed on field: ${error.field}`);
  } else if (error instanceof NetworkError) {
    console.log(`Network error: ${error.statusCode}`);
  }
}

// ==========================================
// 示例 4：Result<T, E> 类型模拟（Rust 风格）
// 使用场景：用类型系统强制调用方处理错误，替代异常
// ==========================================

type Ok<T> = { success: true; value: T };
type Err<E> = { success: false; error: E };
type Result<T, E> = Ok<T> | Err<E>;

function ok<T>(value: T): Ok<T> {
  return { success: true, value };
}

function err<E>(error: E): Err<E> {
  return { success: false, error };
}

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("除数不能为零");
  }
  return ok(a / b);
}

const result1 = divide(10, 2);
if (result1.success) {
  console.log(`结果: ${result1.value}`);
} else {
  console.log(`错误: ${result1.error}`);
}

const result2 = divide(10, 0);
if (!result2.success) {
  console.log(`错误: ${result2.error}`);
}

// ==========================================
// 示例 5：throw 的类型与错误边界
// 使用场景：理解 throw 的返回类型为 never
// ==========================================

function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value must be defined");
  }
}

function getLength(value: string | null): number {
  assertIsDefined(value);
  return value.length; // 此处 value 已被收窄为 string
}

// ==========================================
// 示例 6：可选链 ?.（Optional Chaining）
// 使用场景：安全访问可能为 null/undefined 的深层属性
// ==========================================

interface UserProfile {
  user?: {
    address?: {
      city?: string;
    };
  };
}

const profile1: UserProfile = { user: { address: { city: "Beijing" } } };
const profile2: UserProfile = {};

const city1 = profile1.user?.address?.city;
const city2 = profile2.user?.address?.city;

console.log(city1); // "Beijing"
console.log(city2); // undefined

// ==========================================
// 示例 7：空值合并 ??（Nullish Coalescing）
// 使用场景：仅在 null 或 undefined 时使用默认值（与 || 不同）
// ==========================================

const emptyString = "";
const zero = 0;
const nullValue = null;
const undefinedValue = undefined;

// || 会跳过所有 falsy 值
const withOr = emptyString || "default"; // "default"（因为 "" 是 falsy）

// ?? 只跳过 null 和 undefined
const withNullish = emptyString ?? "default"; // ""（空字符串是有效的）
const zeroWithNullish = zero ?? 100; // 0
const nullWithNullish = nullValue ?? "default"; // "default"

console.log(withOr, withNullish, zeroWithNullish, nullWithNullish);

// ==========================================
// 示例 8：可选链与空值合并组合使用
// 使用场景：防御性编程的标准模式
// ==========================================

function getDisplayName(user: { name?: string | null }): string {
  return user.name?.trim() ?? "Anonymous";
}

console.log(getDisplayName({ name: "  Alice  " })); // "Alice"
console.log(getDisplayName({ name: null })); // "Anonymous"
console.log(getDisplayName({})); // "Anonymous"

// ==========================================
// 示例 9：错误边界概念（Error Boundaries）
// 使用场景：高阶函数中统一处理错误
// ==========================================

function withErrorBoundary<T, Args extends unknown[]>(
  fn: (...args: Args) => T
): (...args: Args) => Result<T, Error> {
  return (...args) => {
    try {
      return ok(fn(...args));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  };
}

const safeParse = withErrorBoundary((s: string) => JSON.parse(s) as unknown);
console.log(safeParse('{"a":1}'));
console.log(safeParse("invalid"));

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

function badCatch(): void {
  try {
    throw new Error("fail");
  } catch (error) {
    // @ts-expect-error catch 参数默认 unknown，不能直接访问 .message
    console.log(error.message);
  }
}

const maybeUser = { name: "Alice" };
// function wrongOptional(user: { name: string }): string {
//   return user?.name; // user 不是可选的，不需要 ?.
// }

function badThrow(): never {
  // TS 允许 throw 任意值，但这是不推荐的实践
  throw "just a string";
}

// ==========================================
// 本章小结
// ==========================================
// 1. try/catch/finally 结构清晰，catch 参数在 strict 下为 unknown
// 2. 自定义 Error 子类可携带额外上下文信息，配合 instanceof 进行错误分类
// 3. Result<T, E> 联合类型模拟 Rust 的错误处理，用类型系统强制错误处理
// 4. throw 的返回类型是 never，可用于类型收窄后的穷尽处理
// 5. 可选链 ?. 安全访问深层属性，空值合并 ?? 仅在 null/undefined 时取默认值
// 6. 防御性编程组合：?. 和 ?? 是现代 TS 代码处理空值的标准模式
// 7. 对比：Java 有 checked/unchecked 异常；Rust 用 Result；TS 两者都可以，但 Result 模式更安全
