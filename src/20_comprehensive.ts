/**
 * 学习目标：
 * 1. 实现带泛型的 Result<T, E> 类型与工具函数
 * 2. 使用接口定义 API 响应结构
 * 3. 使用可辨识联合处理不同业务状态
 * 4. 使用泛型约束确保数据缓存类的类型安全
 * 5. 使用类型守卫进行运行时数据校验
 * 6. 使用模块导出组织代码
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 没有泛型和静态类型约束，类似功能需运行时检查
 * - Java 有泛型和异常，但没有内置的 Result 类型；Java 开发者常用 Vavr 或 Arrow
 * - Rust 的 Result<T, E> 是语言核心，TS 通过联合类型和类型守卫可以完美模拟
 * - 本章综合运用前面 19 章的所有知识点，是类型安全的「实战演练」
 */

// ==========================================
// 示例 1：泛型 Result<T, E> 类型与工具函数
// 使用场景：Rust 风格的类型安全错误处理
// ==========================================

export type Ok<T> = { readonly kind: "ok"; readonly value: T };
export type Err<E> = { readonly kind: "err"; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { kind: "ok", value };
}

export function err<E>(error: E): Err<E> {
  return { kind: "err", error };
}

// Result 的工具方法
export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.kind === "ok") {
    return ok(fn(result.value));
  }
  return result;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.kind === "ok") {
    return result.value;
  }
  return defaultValue;
}

// 使用示例
function divideSafe(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("除数不能为零");
  }
  return ok(a / b);
}

const divResult = divideSafe(10, 2);
console.log(unwrapOr(map(divResult, (n) => n * 2), 0)); // 10

// ==========================================
// 示例 2：接口定义 API 响应结构
// 使用场景：规范前后端数据交互的类型
// ==========================================

export interface ApiResponse<T> {
  readonly code: number;
  readonly message: string;
  readonly data: T;
  readonly timestamp: number;
}

export interface PaginatedData<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export type UserListResponse = ApiResponse<PaginatedData<User>>;

export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
}

export type UserRole = "admin" | "editor" | "viewer";

// 模拟 API 响应
const mockResponse: UserListResponse = {
  code: 200,
  message: "success",
  data: {
    items: [
      { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
      { id: 2, name: "Bob", email: "bob@example.com", role: "viewer" },
    ],
    total: 2,
    page: 1,
    pageSize: 10,
  },
  timestamp: Date.now(),
};

console.log(mockResponse.data.items[0]?.name);

// ==========================================
// 示例 3：可辨识联合处理业务状态
// 使用场景：订单、支付等具有明确状态流转的业务场景
// ==========================================

export type OrderState =
  | { readonly status: "pending"; readonly createdAt: Date }
  | { readonly status: "paid"; readonly paidAt: Date; readonly amount: number }
  | { readonly status: "shipped"; readonly shippedAt: Date; readonly trackingNumber: string }
  | { readonly status: "delivered"; readonly deliveredAt: Date }
  | { readonly status: "cancelled"; readonly cancelledAt: Date; readonly reason: string };

export function getOrderDescription(order: OrderState): string {
  switch (order.status) {
    case "pending":
      return `订单待支付，创建于 ${order.createdAt.toISOString()}`;
    case "paid":
      return `订单已支付 ${order.amount} 元，支付时间 ${order.paidAt.toISOString()}`;
    case "shipped":
      return `订单已发货，物流单号 ${order.trackingNumber}`;
    case "delivered":
      return `订单已送达，时间 ${order.deliveredAt.toISOString()}`;
    case "cancelled":
      return `订单已取消，原因：${order.reason}`;
    default: {
      const _exhaustive: never = order;
      return _exhaustive;
    }
  }
}

const testOrder: OrderState = { status: "paid", paidAt: new Date(), amount: 199 };
console.log(getOrderDescription(testOrder));

// ==========================================
// 示例 4：泛型约束确保缓存类类型安全
// 使用场景：构建类型安全的内存缓存
// ==========================================

interface CacheEntry<V> {
  readonly value: V;
  readonly expiresAt: number;
}

interface Serializable {
  toString(): string;
}

export class TypedCache<K extends string, V> {
  private store = new Map<K, CacheEntry<V>>();

  set(key: K, value: V, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }
}

const userCache = new TypedCache<string, User>();
userCache.set("user:1", { id: 1, name: "Alice", email: "a@example.com", role: "admin" }, 60000);
console.log(userCache.get("user:1")?.name);

// ==========================================
// 示例 5：类型守卫进行运行时数据校验
// 使用场景：验证外部 API 返回的数据结构是否符合预期
// ==========================================

export function isUser(obj: unknown): obj is User {
  if (typeof obj !== "object" || obj === null) return false;

  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    typeof o.role === "string" &&
    ["admin", "editor", "viewer"].includes(o.role)
  );
}

export function isUserArray(data: unknown): data is User[] {
  return Array.isArray(data) && data.every(isUser);
}

// 模拟不安全的 API 响应
const unsafeData: unknown = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
};

if (isUser(unsafeData)) {
  console.log(`验证通过: ${unsafeData.name}`);
} else {
  console.log("数据结构不符合 User 接口");
}

// ==========================================
// 示例 6：综合使用泛型、约束和条件类型
// 使用场景：构建类型安全的工具函数库
// ==========================================

export function pick<T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

export function omit<T, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete (result as Record<string, unknown>)[key as string];
  }
  return result as Omit<T, K>;
}

const fullUser: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
};

const basicInfo = pick(fullUser, ["id", "name"]);
console.log(basicInfo);

const withoutEmail = omit(fullUser, ["email"]);
console.log(withoutEmail);

// ==========================================
// 示例 7：使用 readonly 和 as const 实现深层不可变性
// 使用场景：确保配置对象在运行时不可被意外修改
// ==========================================

export const APP_CONFIG = {
  api: {
    baseUrl: "https://api.example.com",
    timeout: 30000,
    retries: 3,
  },
  features: {
    darkMode: true,
    betaFeatures: false,
  },
} as const;

// APP_CONFIG.api.timeout = 1000; // ❌ as const 使所有层级都变为 readonly

export type AppConfig = typeof APP_CONFIG;

// ==========================================
// 示例 8：模板字面量类型构建类型安全的资源路径
// 使用场景：限制 API 端点字符串只能是预定义的模式
// ==========================================

export type ApiEndpoint =
  | "/api/v1/users"
  | `/api/v1/users/${number}`
  | "/api/v1/orders"
  | `/api/v1/orders/${number}`;

function fetchApi(endpoint: ApiEndpoint): Promise<unknown> {
  console.log(`Fetching ${endpoint}`);
  return Promise.resolve({});
}

fetchApi("/api/v1/users");
fetchApi("/api/v1/users/123");

// ==========================================
// 综合复习问答（基于前面 19 章的知识点）
// ==========================================

/*
Q1: 为什么优先使用 const 而不是 let？
A:  const 保证引用不可变，减少意外修改，让代码更易推理。只在需要重新赋值时使用 let。

Q2: any 和 unknown 的区别是什么？
A:  any 绕过所有类型检查，可直接使用；unknown 需要先通过类型收窄才能安全使用。

Q3: interface 和 type 的主要区别有哪些？
A:  interface 支持声明合并和 implements，适合对象形状；type 支持联合/交叉/映射类型，更灵活。

Q4: 什么是类型收窄（Type Narrowing）？列举三种方式。
A:  通过控制流逐步缩小联合类型的范围。方式：typeof、instanceof、自定义类型保护（is）。

Q5: 泛型约束 extends 的作用是什么？
A:  限制泛型参数必须满足某些条件，确保泛型代码可以安全地操作类型。

Q6: 什么是可辨识联合（Discriminated Union）？
A:  通过共享的标记属性（如 kind/status）区分不同结构的联合类型成员。

Q7: switch + never 穷尽检查的原理是什么？
A:  如果所有分支都被处理，default 中的 shape 会被收窄为 never；若遗漏分支，编译器报错。

Q8: readonly 和 Object.freeze 有什么区别？
A:  readonly 是编译期约束，可被绕过；Object.freeze 是运行时真正阻止修改（浅层）。

Q9: catch 参数为什么默认是 unknown？
A:  因为 TS 4.0+ 中 catch 可能捕获任意类型的值（不只有 Error），unknown 强制开发者做类型检查。

Q10: Promise.all 和 Promise.allSettled 的区别？
A:  Promise.all 任一 reject 会整体 reject；Promise.allSettled 等待所有完成，返回每个的结果状态。

Q11: declare module 的作用是什么？
A:  为无类型声明的 JS 模块补充类型，或扩展现有模块的类型定义。

Q12: 模板字面量类型有什么实际用途？
A:  构建类型安全的字符串模式，如 CSS 变量名、事件名、API 路径等。

Q13: Result<T, E> 相比 throw 异常有什么优势？
A:  强制调用方处理错误路径（类型层面），不会意外遗漏；错误成为值，可组合和传递。

Q14: 为什么 ES Modules 中推荐使用 import type？
A:  import type 在编译后完全擦除，不产生运行时依赖，有助于 Tree Shaking 和避免循环依赖。

Q15: 泛型默认值 <T = string> 的使用场景？
A:  为泛型参数提供最常用的类型，简化调用方代码，如 GenericStorage 默认存储 string。

Q16: 映射类型 [K in keyof T] 的作用？
A:  遍历类型的所有键，批量转换属性特性（如全部变为 readonly 或 optional）。

Q17: 类实现接口（implements）和类继承（extends）的区别？
A:  implements 是契约关系，类必须实现接口的所有成员；extends 是继承关系，子类获得父类的实现。

Q18: 可选链 ?. 和空值合并 ?? 如何配合使用？
A:  ?. 安全访问可能不存在的属性；?? 在结果为 null/undefined 时提供默认值。组合：obj?.prop ?? "default"。

Q19: namespace 在现代 TS 项目中为什么不推荐使用？
A:  ES Modules 已完全取代 namespace 的模块组织需求，namespace 会增加全局污染风险且不利于 Tree Shaking。

Q20: 为什么说 TS 的类型系统是「图灵完备」的？
A:  TS 的类型系统支持条件类型、递归、泛型等，可以在编译期进行任意复杂的类型级计算。
*/

// ==========================================
// 本章小结
// ==========================================
// 1. Result<T, E> 联合类型实现了 Rust 风格的类型安全错误处理
// 2. 接口定义 API 结构，配合泛型实现可复用的响应类型
// 3. 可辨识联合 + switch + never 穷尽检查处理复杂业务状态
// 4. 泛型约束确保缓存类的键和值类型安全
// 5. 自定义类型守卫（is）实现运行时数据校验
// 6. 综合使用 pick/omit、readonly、as const、模板字面量类型构建类型安全的工具库
// 7. 这 20 章涵盖了 TypeScript 从基础到进阶的核心知识，配合实践项目可进一步深化理解
