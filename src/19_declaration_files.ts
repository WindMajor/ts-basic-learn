/**
 * 学习目标：
 * 1. 理解 .d.ts 文件的作用与编写规范
 * 2. 掌握 declare 关键字：变量、函数、类、模块
 * 3. 学会为无类型的第三方 JS 库编写类型声明
 * 4. 了解全局声明 declare global 与模块扩充
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 没有声明文件概念，类型信息直接写在 .py 文件中或 stub 文件（.pyi）中
 * - Java 的 .class 文件包含完整类型信息，不需要额外的声明文件
 * - Rust 的 trait/struct 定义同时是声明和实现；TS 的 .d.ts 是纯声明，不包含实现
 * - TS 的声明文件是编译期概念，只参与类型检查，不生成运行时代码
 */

// ==========================================
// 示例 1：declare 变量声明
// 使用场景：告诉编译器某个全局变量存在（即使它在运行时由其他脚本提供）
// ==========================================

// 这些声明通常放在 .d.ts 文件中，这里在 .ts 文件中用 declare 演示

declare const API_BASE_URL: string;
declare let APP_VERSION: string;

// 使用时编译器知道类型
// console.log(API_BASE_URL); // 运行时需确保存在

// ==========================================
// 示例 2：declare 函数声明
// 使用场景：为已有的 JS 函数提供类型签名
// ==========================================

declare function evaluateExpression(expr: string): number;
declare function logMessage(level: "info" | "warn" | "error", message: string): void;

// 调用时类型安全
// evaluateExpression("2 + 2");
// logMessage("info", "System started");

// ==========================================
// 示例 3：declare 类声明
// 使用场景：为已有的 JS 类提供类型定义
// ==========================================

declare class LegacyWidget {
  constructor(elementId: string);
  render(): void;
  destroy(): void;
  readonly id: string;
}

// const widget = new LegacyWidget("app");
// widget.render();

// ==========================================
// 示例 4：declare 模块 —— 为无类型的 JS 库编写类型
// 使用场景：npm 包没有 @types 时，自己补充类型声明
// ==========================================

// 假设有一个名为 "legacy-utils" 的 JS 库没有类型定义
// 实际的类型声明已放在 declarations.d.ts 中
// 使用时就可以正常导入并获得类型提示
// import { formatDate, parseJSON } from "legacy-utils";

// ==========================================
// 示例 5：declare module 扩展已有模块
// 使用场景：为第三方库添加缺失的方法或属性
// ==========================================

// 扩展 Express 的 Request 类型（常见用法）
// 详见 src/declarations.d.ts

// 扩展 Array 原型（谨慎使用）
declare global {
  interface Array<T> {
    first(): T | undefined;
    last(): T | undefined;
  }
}

// 在运行时需提供实现：
// Array.prototype.first = function() { return this[0]; };
// Array.prototype.last = function() { return this[this.length - 1]; };

// ==========================================
// 示例 6：declare global —— 全局声明
// 使用场景：向全局作用域添加类型定义
// ==========================================

declare global {
  // 全局变量
  const __BUILD_TIME__: string;
  const __IS_DEV__: boolean;

  // 全局函数
  function trackEvent(eventName: string, properties?: Record<string, unknown>): void;

  // 全局接口扩展
  interface Window {
    myApp: {
      version: string;
      init(): void;
    };
  }
}

// 使用全局声明
// console.log(__BUILD_TIME__);
// window.myApp.init();

// ==========================================
// 示例 7：.d.ts 文件编写规范
// 使用场景：了解如何组织和编写声明文件
// ==========================================

/*
// 典型的 .d.ts 文件结构（以 my-lib.d.ts 为例）：

// 1. 文件头注释
// Type definitions for my-lib 1.0

// 2. 如果是全局库（非模块），直接声明
declare function myLib(a: string): string;
declare namespace myLib {
  const version: string;
}

// 3. 如果是模块库，用 declare module
declare module "my-lib" {
  export interface Options {
    debug: boolean;
  }
  export function run(options: Options): void;
}

// 4. 全局扩展放在 declare global 中
declare global {
  interface String {
    reverse(): string;
  }
}
*/

// ==========================================
// 示例 8：环境模块声明（Ambient Modules）
// 使用场景：声明没有具体实现的模块占位符
// ==========================================

// 通配符模块声明：匹配特定后缀的文件
// 详见 src/declarations.d.ts

// 使用时：
// import logo from "./logo.png";

// ==========================================
// 示例 9：namespace 与声明文件
// 使用场景：组织相关的类型定义（在声明文件中仍然可用）
// ==========================================

declare namespace MyLib {
  export interface Config {
    timeout: number;
    retries: number;
  }

  export type LogLevel = "debug" | "info" | "warn" | "error";

  export function initialize(config: Config): void;
}

// const config: MyLib.Config = { timeout: 5000, retries: 3 };

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// declare const BAD_VAR: string = "value"; // ❌ declare 变量不能有初始化值

// declare function badFunc(): void { console.log("hi"); } // ❌ declare 函数不能有实现

// declare module "bad-module" {
//   const internal: string; // ❌ 模块内顶级变量需用 export
// }

// ==========================================
// 本章小结
// ==========================================
// 1. .d.ts 文件是 TS 的类型声明文件，只参与编译期检查，不生成运行时代码
// 2. declare 关键字用于声明变量、函数、类、模块的存在，但不提供实现
// 3. declare module "xxx" 为无类型的 JS 库补充类型；declare module 可扩展已有模块
// 4. declare global 向全局作用域注入类型定义，常用于扩展 Window/Array 等内置对象
// 5. 通配符模块声明（*.svg, *.png）让非 JS 资源的导入获得类型支持
// 6. 声明文件应遵循 DefinitelyTyped 的规范：清晰的注释、完整的类型覆盖、正确的 export
// 7. 对比：Python 用 .pyi stub 文件；Java 不需要；TS 的 .d.ts 是纯类型声明
