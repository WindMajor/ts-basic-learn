/**
 * 学习目标：
 * 1. 掌握 ES Modules 的 import/export、default export、named export、export *
 * 2. 了解命名空间 namespace 的使用场景与局限
 * 3. 学会 import type 类型导入与隔离
 * 4. 理解动态导入 import() 的返回类型 Promise<T>
 * 5. 了解路径别名 paths / baseUrl 配置
 * 6. 掌握 declare module 扩展第三方模块类型
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 用 import/from，没有默认导出的概念；每个 .py 文件是一个模块
 * - Java 的包（package）和 import 与 TS 的模块系统概念类似
 * - Rust 的 mod/use 与 TS 的 export/import 非常相似；Rust 的 crate 对应 TS 的 npm 包
 * - TS 的 namespace 已不推荐使用，现代项目完全可用 ES Modules 替代
 */

// ==========================================
// 示例 1：Named Export（命名导出）
// 使用场景：一个模块导出多个值，调用方按需导入
// ==========================================

export const MODULE_VERSION = "1.0.0";

export function add(a: number, b: number): number {
  return a + b;
}

export class Calculator {
  private value = 0;
  increment(): number {
    this.value++;
    return this.value;
  }
}

// ==========================================
// 示例 2：Default Export（默认导出）
// 使用场景：一个模块主要导出单个类/函数/对象
// ==========================================

const defaultConfig = {
  apiEndpoint: "https://api.example.com",
  timeout: 5000,
};

export default defaultConfig;

// ==========================================
// 示例 3：重新导出（Re-export）
// 使用场景：在一个入口文件中聚合多个模块的导出
// ==========================================

// 从其他模块重新导出（以下为示意，实际需存在对应文件）
// export { add } from "./math.js";
// export * as utils from "./utils.js";

// 条件导出（TS 4.7+）
// export { type MyType } from "./types.js";

// ==========================================
// 示例 4：import type（类型导入）
// 使用场景：仅在类型层面使用导入的值，不生成运行时代码
// ==========================================

// 在当前项目中，由于 verbatimModuleSyntax: true，类型导入必须用 import type
// 以下为示意代码（因为不能自导入，所以用注释展示）

// import type { SomeInterface } from "./some-module.js";
// import { type SomeType, someValue } from "./some-module.js";

// type 导入在编译后会被完全擦除，不产生运行时依赖
// value 导入会保留，生成实际的 require/import 语句

// ==========================================
// 示例 5：动态导入 import()
// 使用场景：按需加载模块，减少初始包体积
// ==========================================

async function loadModuleDynamically(): Promise<void> {
  // 动态导入返回 Promise<T>
  const module = await import("./01_variables.js");
  console.log(module);
}

// 条件动态导入
async function loadOnDemand(condition: boolean): Promise<void> {
  if (condition) {
    // 01_variables.ts 没有导出 add，此处仅演示动态导入语法
    const module = await import("./20_comprehensive.js");
    console.log(module.ok);
  }
}

// ==========================================
// 示例 6：命名空间 namespace（了解即可，不推荐新项目使用）
// 使用场景：组织全局代码，在 ES Modules 普及前广泛使用
// ==========================================

namespace Geometry {
  export interface Point {
    x: number;
    y: number;
  }

  export function distance(p1: Point, p2: Point): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }
}

const p1: Geometry.Point = { x: 0, y: 0 };
const p2: Geometry.Point = { x: 3, y: 4 };
console.log(Geometry.distance(p1, p2)); // 5

// ⚠️ 现代 TS 项目推荐使用 ES Modules + 文件组织来替代 namespace

// ==========================================
// 示例 7：路径别名（paths / baseUrl）
// 使用场景：避免深层相对路径 ../../../ 的导入地狱
// ==========================================

// tsconfig.json 中配置：
// {
//   "compilerOptions": {
//     "baseUrl": ".",
//     "paths": {
//       "@src/*": ["src/*"],
//       "@utils/*": ["src/utils/*"]
//     }
//   }
// }

// 使用路径别名的导入：
// import { helper } from "@utils/helper.js";

// ==========================================
// 示例 8：declare module 扩展第三方模块
// 使用场景：为没有类型定义的 JS 库补充类型，或扩展现有模块
// ==========================================

// 声明全局变量（非模块系统）
declare const GLOBAL_CONFIG: {
  env: string;
  debug: boolean;
};

// ==========================================
// 示例 9：模块的副作用导入
// 使用场景：导入只为执行副作用（如注册插件、加载 CSS）
// ==========================================

// import "./polyfill.js";
// 这种导入不绑定任何值，只执行模块代码

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// export default const x = 1; // ❌ 不能混合使用 default export 和 const
// 正确写法：const x = 1; export default x;

// import { Calculator } from "./10_modules.js"; // ❌ 若仅用于类型，应使用 import type

// const { add } = import("./01_variables.js"); // ❌ 动态导入需要 await 或 .then()

// ==========================================
// 本章小结
// ==========================================
// 1. named export 用于导出多个值，default export 用于导出模块的主功能
// 2. import type 和 export type 在编译期被擦除，verbatimModuleSyntax 要求显式区分
// 3. 动态导入 import() 返回 Promise<T>，适合代码分割和懒加载
// 4. namespace 已过时，新项目应使用 ES Modules + 文件系统组织代码
// 5. paths/baseUrl 配置可大幅简化深层导入路径
// 6. declare module 是扩展第三方库类型的核心工具，.d.ts 文件常用于集中声明
