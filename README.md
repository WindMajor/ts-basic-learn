# TypeScript 系统化学习项目

本项目是一个面向有 **Python / Java ** 基础的开发者的 TypeScript 系统化学习资源。通过 20 个精心设计的 `.ts` 文件，从变量声明到高级类型工具，循序渐进地掌握 TypeScript 的核心知识体系。

## 学习背景

TypeScript 是 JavaScript 的超集，添加了静态类型系统和现代语言特性。如果你已经熟悉以下语言，本项目的对比注释将帮助你快速建立知识映射：

- **Python 开发者**：注意 TS 的静态类型检查、块级作用域和泛型系统
- **Java 开发者**：TS 的类系统、接口和访问修饰符与 Java 非常相似
- **Rust 开发者**：关注 TS 的类型收窄、模式匹配模拟（可辨识联合）和 Trait 模拟（接口 + 泛型约束）

## 文件索引表

| 序号 | 文件名                             | 对应 Rust 概念                 | 核心知识点                                                           |
| :--: | :--------------------------------- | :----------------------------- | :------------------------------------------------------------------- |
|  01  | `01_variables.ts`                  | `let` / `const` 绑定           | let/const/var、类型注解、类型推断、解构赋值                          |
|  02  | `02_basic_types.ts`                | 基本类型 / `Option<T>` / `!`   | string/number/boolean、any/unknown/never、bigint/symbol、字面量类型  |
|  03  | `03_functions.ts`                  | 函数定义                       | 函数声明/表达式/箭头函数、可选/默认/剩余参数、函数重载、this 注解    |
|  04  | `04_control_flow.ts`               | 控制流 / `match` 雏形          | if/else/switch、循环结构、类型收窄雏形、break/continue/return        |
|  05  | `05_interfaces.ts`                 | `struct` / `trait` 声明        | interface 定义、可选/只读/索引签名、继承、声明合并、类实现接口       |
|  06  | `06_type_aliases.ts`               | 类型别名 / Trait 组合          | type 别名、联合/交叉类型、类型断言、非空断言、interface vs type      |
|  07  | `07_enums_and_pattern_matching.ts` | `enum` / ADT                   | 数字/字符串/const enum、反向映射、可辨识联合、穷尽检查               |
|  08  | `08_arrays_tuples.ts`              | `[T; N]` / `Vec<T>` / Tuple    | 数组注解、元组、只读数组、解构、多维数组                             |
|  09  | `09_collections.ts`                | `HashMap<K, V>` / `HashSet<T>` | Map/Set/WeakMap/WeakSet、Record<K, T>、对象 vs Map                   |
|  10  | `10_modules.ts`                    | `mod` / `use` / `crate`        | ES Modules、namespace、import type、动态导入、declare module         |
|  11  | `11_classes.ts`                    | `struct` + `impl`（部分对应）  | 类定义、访问修饰符、参数属性、继承、抽象类、getter/setter            |
|  12  | `12_generics.ts`                   | 泛型函数 / 泛型结构体          | 泛型函数/接口/类、多类型参数、泛型默认值、栈/队列实现                |
|  13  | `13_type_narrowing.ts`             | 模式匹配                       | typeof/instanceof/in 保护、字面量保护、自定义类型保护、switch 收窄   |
|  14  | `14_constraints_and_traits.ts`     | Trait Bound / 泛型约束         | 泛型约束、条件类型、infer、映射类型、模拟 Trait                      |
|  15  | `15_lifetimes_and_scope.ts`        | 所有权 / 生命周期（概念对比）  | 块级作用域、类型收窄传播、闭包、readonly、深层不可变性               |
|  16  | `16_error_handling.ts`             | `Result<T, E>` / `Option<T>`   | try/catch、自定义错误、Result 模拟、可选链/空值合并                  |
|  17  | `17_async.ts`                      | `async` / `await` / `Future`   | Promise<T>、async/await、Promise.all/race/allSettled、异步迭代器     |
|  18  | `18_advanced_types.ts`             | 类型级编程（有限对应）         | 内置工具类型、映射类型、模板字面量类型、递归类型                     |
|  19  | `19_declaration_files.ts`          | FFI / 外部声明                 | .d.ts 规范、declare 关键字、全局声明、模块扩充                       |
|  20  | `20_comprehensive.ts`              | 综合实战                       | Result<T, E>、API 接口、可辨识联合、泛型缓存、类型守卫、综合复习问答 |

## 编译命令

```bash
# 编译项目
npm run build

# 监听模式自动编译
npm run watch

# 仅做类型检查（不生成输出文件）
npm run typecheck

# 清理构建产物
npm run clean
```

## 学习建议

1. **按顺序阅读**：文件按知识点递进编排，建议从 `01_variables.ts` 开始依次学习
2. **边读边验证**：每看完一章，执行以下命令检查类型是否正确：
   ```bash
   npx tsc --noEmit
   ```
3. **动手实验**：修改示例代码，观察编译器的报错信息，加深理解
4. **关注对比注释**：每个文件顶部和示例中都有与 Python/Java/Rust 的对比提示，帮助快速建立知识映射
5. **重视错误示例**：每个文件中的 `// @ts-expect-error` 标记了故意编写的错误代码，理解这些错误是掌握类型系统的关键

## 项目配置

本项目使用以下 TypeScript 编译器配置：

- `strict: true` —— 启用所有严格类型检查
- `verbatimModuleSyntax: true` —— 强制区分类型导入和值导入
- `exactOptionalPropertyTypes: true` —— 精确处理可选属性
- `noUncheckedIndexedAccess: true` —— 数组/对象索引访问返回可能 undefined
- `module: ESNext` —— 使用 ES 模块系统
- `target: ES2020` —— 编译目标为 ES2020

## 环境要求

- Node.js >= 18
- TypeScript >= 5.0
- pnpm（推荐）或 npm

## 许可证

MIT
