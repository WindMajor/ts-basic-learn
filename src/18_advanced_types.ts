/**
 * 学习目标：
 * 1. 掌握内置工具类型：Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, ReturnType, Parameters, Awaited
 * 2. 学会自定义映射类型
 * 3. 了解模板字面量类型（Template Literal Types）
 * 4. 了解递归类型与递归条件类型
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 没有编译期类型运算，typing 模块的功能有限；TS 的类型系统是图灵完备的
 * - Java 没有类型级编程，只有泛型擦除后的有限类型操作
 * - Rust 没有 TS 这样强大的类型级编程能力，但 Rust 的 const generics 和 trait 系统提供了部分类似功能
 * - TS 的类型系统可以在编译期进行复杂的类型计算，这是 TS 区别于大多数静态类型语言的独特优势
 */

// ==========================================
// 示例 1：Partial<T> —— 所有属性变为可选
// 使用场景：更新对象时只需传入部分属性
// ==========================================

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type PartialUser = Partial<User>;
// 等价于 { id?: number; name?: string; email?: string; age?: number }

const updateData: PartialUser = { name: "Alice" }; // 只需传部分字段

// ==========================================
// 示例 2：Required<T> —— 所有属性变为必填
// 使用场景：确保配置对象的所有属性都已提供
// ==========================================

interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

type StrictConfig = Required<Config>;
// 等价于 { host: string; port: number; debug: boolean }

const fullConfig: StrictConfig = {
  host: "localhost",
  port: 3000,
  debug: false,
};

// ==========================================
// 示例 3：Readonly<T> —— 所有属性变为只读
// 使用场景：创建不可变对象类型
// ==========================================

type ImmutableUser = Readonly<User>;

const frozenUser: ImmutableUser = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  age: 30,
};

// frozenUser.name = "Bob"; // ❌

// ==========================================
// 示例 4：Pick<T, K> 与 Omit<T, K>
// 使用场景：从已有类型中选取或排除某些属性
// ==========================================

// Pick：选取指定属性
type UserBasicInfo = Pick<User, "id" | "name">;
// 等价于 { id: number; name: string }

// Omit：排除指定属性
type UserWithoutAge = Omit<User, "age">;
// 等价于 { id: number; name: string; email: string }

const basicUser: UserBasicInfo = { id: 1, name: "Alice" };
console.log(basicUser);

// ==========================================
// 示例 5：Record<K, T> —— 构造键值对类型
// 使用场景：定义具有固定键集合的对象
// ==========================================

type PageNames = "home" | "about" | "contact";
type PageInfo = { title: string; path: string };

const pages: Record<PageNames, PageInfo> = {
  home: { title: "首页", path: "/" },
  about: { title: "关于", path: "/about" },
  contact: { title: "联系", path: "/contact" },
};

// ==========================================
// 示例 6：Exclude<T, U> 与 Extract<T, U>
// 使用场景：联合类型的集合运算
// ==========================================

type AllTypes = string | number | boolean | null;
type NonNullTypes = Exclude<AllTypes, null>; // string | number | boolean
type StringOrNumber = Extract<AllTypes, string | number>; // string | number

const validValue: NonNullTypes = "hello";
console.log(validValue);

// ==========================================
// 示例 7：ReturnType<T> 与 Parameters<T>
// 使用场景：提取函数的返回类型和参数类型
// ==========================================

function createUser(name: string, age: number): User {
  return { id: 1, name, email: `${name}@example.com`, age };
}

type CreateUserReturn = ReturnType<typeof createUser>; // User
type CreateUserParams = Parameters<typeof createUser>; // [string, number]

const params: CreateUserParams = ["Alice", 30];
console.log(params);

// ==========================================
// 示例 8：Awaited<T>
// 使用场景：提取 Promise 嵌套的返回值类型
// ==========================================

type DeepPromise = Promise<Promise<Promise<string>>>;
type Unwrapped = Awaited<DeepPromise>; // string

async function deepAsync(): Promise<Unwrapped> {
  return "unwrapped";
}

// ==========================================
// 示例 9：自定义映射类型
// 使用场景：批量转换类型的属性特性
// ==========================================

// 将所有属性变为 nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type NullableUser = Nullable<User>;
// { id: number | null; name: string | null; ... }

// 将所有属性变为函数
type Methods<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Methods<User>;
// { getId: () => number; getName: () => string; ... }

// ==========================================
// 示例 10：模板字面量类型（Template Literal Types）
// 使用场景：根据类型生成字符串类型
// ==========================================

type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<"click">; // "onClick"
type HoverEvent = EventName<"hover">; // "onHover"

// 结合联合类型生成多个事件名
type MouseEvents = "click" | "hover" | "mousedown" | "mouseup";
type MouseEventHandlers = {
  [K in MouseEvents as `on${Capitalize<K>}`]: (e: { x: number; y: number }) => void;
};

const handlers: MouseEventHandlers = {
  onClick: (e) => console.log(e.x, e.y),
  onHover: (e) => console.log(e.x, e.y),
  onMousedown: (e) => console.log(e.x, e.y),
  onMouseup: (e) => console.log(e.x, e.y),
};

// ==========================================
// 示例 11：递归类型（简介）
// 使用场景：表示树形结构或嵌套数据
// ==========================================

interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

const tree: TreeNode<number> = {
  value: 1,
  children: [
    { value: 2, children: [] },
    {
      value: 3,
      children: [{ value: 4, children: [] }],
    },
  ],
};

console.log(tree);

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// type BadRecord = Record<number[], string>; // ❌ Record 的键必须是 string | number | symbol

// type BadPick = Pick<User, "name" | "invalid">; // ❌ Pick 的第二个参数必须是第一个参数的键的子集

// type BadReturn = ReturnType<string>; // ❌ ReturnType 只能用于函数类型

// ==========================================
// 本章小结
// ==========================================
// 1. Partial/Required/Readonly 是最常用的属性修饰工具类型
// 2. Pick/Omit 用于属性的选取和排除，Record 用于构建固定键的对象
// 3. Exclude/Extract 是联合类型的集合运算，类似数学中的差集和交集
// 4. ReturnType/Parameters/Awaited 提取函数和 Promise 的类型信息
// 5. 自定义映射类型通过 [K in keyof T] 批量转换属性，as 可重命名键
// 6. 模板字面量类型让字符串类型也能参与类型运算，极大增强 DSL 能力
// 7. 递归类型处理树形结构，但需注意类型系统的递归深度限制
