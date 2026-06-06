/**
 * 全局类型声明文件
 * 注意：在 .d.ts 文件中，declare module 是环境模块声明（ambient module declaration）
 * 而在 .ts 模块文件中，declare module 会被视为模块扩充（augmentation），要求原模块存在
 */

// 扩展 Express 的 Request 类型（演示模块扩充）
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    requestTime?: Date;
  }
}

// 为无类型的 JS 库声明类型
declare module "untyped-library" {
  export function doSomething(): void;
  export const version: string;
}

// 为无类型的 JS 库声明类型（legacy-utils）
declare module "legacy-utils" {
  export function formatDate(date: Date, format: string): string;
  export function parseJSON<T>(json: string): T;
  export const VERSION: string;

  export interface UtilsConfig {
    locale: string;
    timezone: string;
  }

  export function configure(config: UtilsConfig): void;
}

// 通配符模块声明：图片资源
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}
