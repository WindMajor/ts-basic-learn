/**
 * 学习目标：
 * 1. Fetch API：RequestInit 类型、Response.json<T>() 泛型、AbortController
 * 2. Storage：localStorage（string 限制）、sessionStorage、IndexedDB 简介
 * 3. Cookie：document.cookie 的字符串陷阱、HttpOnly / Secure / SameSite 属性
 * 4. Web Worker / Service Worker 的类型定义
 * 5. Canvas 2D 基础与类型（CanvasRenderingContext2D）
 * 6. 浏览器事件循环：宏任务 vs 微任务（与 23 章 Node.js 事件循环对比）
 * 7. 性能 API：PerformanceObserver、LCP / FCP 指标
 * 8. 与后端的联调：CORS 预检请求（Preflight）、Content-Type、FormData vs JSON
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python：requests 库风格不同，但 Fetch API 理念相似；AbortController 类比 asyncio.CancelledError
 * - Java：HttpClient（Java 11+）有类似 API，Android 的 OkHttp 有 Interceptor 链
 * - Rust：reqwest crate 的异步模型与 Fetch 类似，AbortController 类比 tokio CancellationToken
 */

// ==========================================
// 示例 1：Fetch API 类型安全的请求与响应处理
// 使用场景：前后端通信、REST API 调用、文件上传下载
// ==========================================

// ✅ 定义 API 响应类型（对应后端 DTO）
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

// ✅ 运行时结构校验（TypeScript 的 as 断言无法在运行时保护你）
// 全栈开发建议配合 zod / io-ts / valibot 等验证库使用
function isApiResponse<T>(data: unknown): data is ApiResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    'data' in data &&
    typeof (data as Record<string, unknown>).code === 'number'
  );
}

// ✅ 类型安全的 GET 请求（带运行时校验）
async function fetchUserProfile(userId: number): Promise<UserProfile | null> {
  try {
    // RequestInit 类型提供完整的请求配置
    const response = await fetch(`/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // credentials: 'include',  // 携带 Cookie（跨域请求需要）
    });

    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const raw: unknown = await response.json();

    // 运行时校验结构，而非裸用 as 断言
    if (!isApiResponse<UserProfile>(raw)) {
      console.error('响应格式不符合 ApiResponse 结构');
      return null;
    }

    if (raw.code !== 200) {
      console.error(`业务错误: ${raw.message}`);
      return null;
    }

    return raw.data;
  } catch (error) {
    // fetch 只在网络错误时 reject，HTTP 错误码（404/500）不会 reject！
    if (error instanceof TypeError) {
      console.error('网络错误或 CORS 阻止:', error.message);
    }
    return null;
  }
}

// ✅ 类型安全的 POST 请求
interface CreateUserPayload {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

async function createUser(payload: CreateUserPayload): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;

    const raw: unknown = await response.json();
    // 运行时校验，避免 as 断言带来的隐式类型隐患
    if (!isApiResponse<UserProfile>(raw)) return null;

    return raw.data;
  } catch {
    return null;
  }
}

// ==========================================
// 示例 2：AbortController —— 取消请求
// 使用场景：搜索框防抖、页面切换时取消未完成请求、上传超时控制
// ==========================================

// ✅ 可取消的请求（搜索联想场景）
function createCancellableSearch(delay: number = 300): (keyword: string) => void {
  let controller: AbortController | null = null;

  return (keyword: string): void => {
    // 取消上一次未完成的请求
    controller?.abort();
    controller = new AbortController();

    const { signal } = controller;

    // 兜底超时逻辑
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let aborted = false;

    // 如果 signal 已被 abort，跳过超时设置
    if (!signal.aborted) {
      timeoutId = setTimeout(() => {
        if (aborted) return; // 竞态保护：请求已完成后不再 abort
        controller?.abort();
      }, 5000);
    }

    fetch(`/api/search?q=${encodeURIComponent(keyword)}`, { signal })
      .then((res) => res.json())
      .then((data) => {
        aborted = true; // 标记请求完成
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        console.log('搜索结果:', data);
      })
      .catch((err: unknown) => {
        aborted = true;
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.log('请求已取消（正常行为）');
          return;
        }
        console.error('请求失败:', err);
      });
  };
}

// Vue 中使用：watchEffect 的 onCleanup 配合 AbortController
// watchEffect((onCleanup) => {
//   const controller = new AbortController();
//   onCleanup(() => controller.abort());
//   fetch('/api/data', { signal: controller.signal }).then(...);
// });

// ✅ 超时控制封装
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ✅ AbortController 同时取消多个 fetch
function batchAbortDemo(): void {
  const controller = new AbortController();
  const { signal } = controller;

  // 三个请求共享同一个 signal
  Promise.all([
    fetch('/api/users', { signal }),
    fetch('/api/posts', { signal }),
    fetch('/api/comments', { signal }),
  ]).catch((err: unknown) => {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.log('所有请求已批量取消');
    }
  });

  // 一键取消所有请求
  // controller.abort();
}

// ==========================================
// ❌ 常见错误 1：忘记检查 response.ok
// ==========================================

// ❌ fetch 的错误处理陷阱
async function badFetchErrorHandling(): Promise<void> {
  try {
    // ❌ 错误：以为 404/500 会进 catch
    const response = await fetch('/api/not-exist');
    // HTTP 404 时 response.ok 为 false，但不会 throw！
    // 下面的代码不会进 catch，但 response 可能是 404/500
    const data: unknown = await response.json(); // 可能解析失败（返回 HTML 错误页）
    console.log(data); // 404 时 data 可能是 HTML 字符串而非 JSON
  } catch {
    // 这里只捕获网络错误（断网、DNS 解析失败、CORS 阻止）
    // 不会捕获 404！
    console.log('这行在 404 时不会执行');
  }

  // ✅ 正确：先检查 response.ok
  const response = await fetch('/api/not-exist');
  if (!response.ok) {
    // 根据状态码分类处理
    if (response.status === 404) {
      console.error('资源不存在');
    } else if (response.status >= 500) {
      console.error('服务器错误');
    }
    return;
  }
  const data = await response.json();
  console.log(data);
}

// ==========================================
// 示例 3：Storage —— localStorage、sessionStorage、IndexedDB
// 使用场景：用户偏好、登录态缓存、离线数据存储
// ==========================================

// ✅ localStorage / sessionStorage 的类型安全封装
// 核心限制：只能存储字符串！

interface StorageAdapter<T> {
  get(): T | null;
  set(value: T): void;
  remove(): void;
}

function createStorageAdapter<T>(key: string, storage: Storage = localStorage): StorageAdapter<T> {
  return {
    get(): T | null {
      try {
        const raw = storage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
      } catch {
        // JSON 解析失败或存储损坏
        storage.removeItem(key);
        return null;
      }
    },

    set(value: T): void {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          console.error('存储空间已满！');
        }
      }
    },

    remove(): void {
      storage.removeItem(key);
    },
  };
}

// ✅ 使用示例
interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  language: string;
}

const prefsStorage = createStorageAdapter<UserPreferences>('user_prefs');

// 写入
prefsStorage.set({ theme: 'dark', fontSize: 16, language: 'zh-CN' });

// 读取（类型安全）
const prefs = prefsStorage.get();
if (prefs) {
  // prefs 类型为 UserPreferences
  console.log(`当前主题: ${prefs.theme}`);
}

// localStorage vs sessionStorage 区别：
// - localStorage：持久化存储，浏览器关闭后保留
// - sessionStorage：会话级存储，关闭标签页即清除
// - 两者共享相同的 API，都受同源策略限制

// ✅ IndexedDB 简介（适用于大容量结构化数据）
// IndexedDB 是浏览器内置的非关系型数据库，支持索引、事务、大容量存储

interface UserCache {
  id: number;
  name: string;
  avatar: Blob;
  lastLogin: Date;
}

// IndexedDB 基本操作模式（简化演示）：
async function openUserDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDB', 1);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // 创建对象存储（类似 SQL 表）
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id' });
        store.createIndex('name_idx', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 全栈开发中何时用到：
// - localStorage：JWT token 存储（注意 XSS 风险！推荐 HttpOnly Cookie）
// - sessionStorage：表单草稿保存、页面间临时传参
// - IndexedDB：PWA 离线数据、大量结构化缓存（如聊天记录）

// ==========================================
// 示例 4：Cookie —— 操作陷阱与安全属性
// 使用场景：身份认证、跨页面状态传递、第三方追踪
// ==========================================

/**
 * document.cookie 是字符串，不是对象！
 * 读取：返回 "key1=value1; key2=value2" 格式的字符串
 * 写入：document.cookie = "key=value; path=/; max-age=3600"
 * 删除：设置 max-age=0 或 expires=过去时间
 */

// ✅ 类型安全的 Cookie 操作工具
interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;  // 秒
  expires?: Date;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

const CookieUtil = {
  set(name: string, value: string, options: CookieOptions = {}): void {
    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.path) cookieStr += `; path=${options.path}`;
    if (options.domain) cookieStr += `; domain=${options.domain}`;
    if (options.maxAge !== undefined) cookieStr += `; max-age=${options.maxAge}`;
    if (options.expires) cookieStr += `; expires=${options.expires.toUTCString()}`;
    if (options.secure) cookieStr += '; secure';
    if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;

    document.cookie = cookieStr;
  },

  get(name: string): string | null {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1] ?? '') : null;
  },

  remove(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    this.set(name, '', { ...options, maxAge: 0 });
  },

  getAll(): Record<string, string> {
    return document.cookie.split('; ').reduce<Record<string, string>>((acc, pair) => {
      const [key, ...rest] = pair.split('=');
      if (key) {
        acc[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
      }
      return acc;
    }, {});
  },
};

// Cookie 安全属性（全栈联调必备知识）：
// - HttpOnly：禁止 JS 访问（document.cookie 看不到），防止 XSS 窃取
// - Secure：仅 HTTPS 连接发送，防止中间人攻击
// - SameSite：控制跨站请求是否携带 Cookie
//   · Strict：同站才发送（最安全）
//   · Lax：同站 + 顶层导航 GET 请求（默认，平衡安全与体验）
//   · None：所有请求发送（必须同时设置 Secure）

// ❌ Cookie 常见错误合集
//
// 错误 1：document.cookie 不是对象，不能直接读取属性
// @ts-expect-error —— document.cookie 返回 string，不存在 .token 属性
void document.cookie.token;
// 结果永远是 undefined！

// 正确：CookieUtil.get('token')
//
// 错误 2：在 JS 中操作认证 Token（XSS 风险）
// localStorage.setItem('token', jwtToken); // 任何注入的脚本都能读取！
// ✅ 正确：让后端设置 HttpOnly + Secure + SameSite Cookie

// ==========================================
// 示例 5：Web Worker / Service Worker 的类型定义
// 使用场景：CPU 密集型计算、大数据处理、PWA 离线缓存
// ==========================================

// ✅ Web Worker —— 不阻塞主线程的计算
// 主线程代码
function createHeavyWorker(): Worker {
  const worker = new Worker(new URL('./workers/heavy-compute.worker.ts', import.meta.url), {
    type: 'module',
  });

  // 向 Worker 发送消息
  const message: { type: 'compute'; data: number[]; id: string } = {
    type: 'compute',
    data: [1, 2, 3, 4, 5],
    id: crypto.randomUUID(),
  };
  worker.postMessage(message);

  // 接收 Worker 返回的结果
  worker.addEventListener('message', (event: MessageEvent<{ id: string; result: number }>) => {
    console.log(`任务 ${event.data.id} 结果: ${event.data.result}`);
  });

  worker.addEventListener('error', (event: ErrorEvent) => {
    console.error('Worker 错误:', event.message);
  });

  return worker;
}

// Worker 文件内代码（./workers/heavy-compute.worker.ts）：
// self.addEventListener('message', (event: MessageEvent<{ type: string; data: number[] }>) => {
//   const result = event.data.data.reduce((sum, n) => sum + n, 0);
//   self.postMessage({ id: crypto.randomUUID(), result });
// });

// ✅ Service Worker 注册（简化版）
async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('当前浏览器不支持 Service Worker');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('SW 注册成功，scope:', registration.scope);

    // 监听更新
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('新版本 SW 已就绪，刷新页面后生效');
          // 实际项目中可提示用户刷新
        }
      });
    });
  } catch (error) {
    console.error('SW 注册失败:', error);
  }
}

// Service Worker 类型关键点：
// self 在 Worker 上下文中类型为 ServiceWorkerGlobalScope（非 Window）
// 需要通过 lib: ['webworker'] 或 declare const self: ServiceWorkerGlobalScope 声明

// ==========================================
// 示例 6：Canvas 2D 基础与类型
// 使用场景：图表绘制、图片编辑、签名板、水印生成
// ==========================================

function setupCanvas(): CanvasRenderingContext2D | null {
  const canvas = document.querySelector<HTMLCanvasElement>('#my-canvas');
  if (!canvas) return null;

  // ✅ 类型断言为非空（getContext 可能返回 null，如已使用 webgl 上下文）
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('无法获取 2D 上下文');
    return null;
  }

  // DPR（设备像素比）适配高清屏
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // CSS 尺寸保持不变
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  return ctx;
}

// ✅ Canvas 绘制示例
function drawDemo(ctx: CanvasRenderingContext2D): void {
  const width = ctx.canvas.width / (window.devicePixelRatio || 1);
  const height = ctx.canvas.height / (window.devicePixelRatio || 1);

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 绘制矩形
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(20, 20, 100, 60);

  // 绘制圆形
  ctx.beginPath();
  ctx.arc(200, 50, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();

  // 绘制文字
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Hello Canvas', 20, 120);

  // 绘制图片
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 20, 150, 100, 100);
  };
  img.src = '/placeholder.png';
}

// 与 Vue 的映射：
// vue-echarts / vue-chartjs 等库底层都是 Canvas API
// 自定义水印组件通常用 Canvas 生成 base64 图片作为背景

// ==========================================
// 示例 7：浏览器事件循环 —— 宏任务 vs 微任务
// 使用场景：理解异步执行顺序、避免渲染卡顿
// ==========================================

// 浏览器宏任务（MacroTask）队列：
// - setTimeout / setInterval
// - I/O（fetch 回调、文件读取）
// - UI 渲染（requestAnimationFrame 在渲染前执行）
// - MessageChannel
// - <script> 标签执行

// 浏览器微任务（MicroTask）队列：
// - Promise.then / .catch / .finally
// - MutationObserver 回调
// - queueMicrotask()

function demoBrowserEventLoop(): void {
  console.log('1. 同步代码');

  setTimeout(() => console.log('2. 宏任务：setTimeout'), 0);

  Promise.resolve().then(() => console.log('3. 微任务：Promise.then'));

  queueMicrotask(() => console.log('4. 微任务：queueMicrotask'));

  requestAnimationFrame(() => console.log('5. rAF：下一帧渲染前'));

  console.log('6. 同步代码结束');

  // 实际输出顺序：
  // 1 → 6 → 3 → 4 → 5 → 2
  //
  // 关键规则：
  // 1. 一个宏任务执行完后，清空所有微任务队列
  // 2. 微任务中产生的微任务也会在本轮清空（可能无限循环！）
  // 3. requestAnimationFrame 回调在微任务队列清空后、样式计算（Style）和布局（Layout）之前执行
  //    rAF 中修改的 DOM 样式会在同一帧的布局阶段立即计算，不会导致额外的重排
  // 4. 完整的一帧渲染管道：
  //    宏任务 → 微任务队列清空 → rAF 回调 → Style → Layout → Paint → Composite
  // 5. 浏览器可能在两轮事件循环之间插入渲染
}

// 与 Node.js 事件循环的对比（参见 23 章）：
// 相同点：都有宏任务/微任务区分，微任务优先级高于宏任务
// 不同点：
// - Node.js 有多个宏任务阶段（timers → pending → idle → poll → check → close）
// - 浏览器宏任务队列通常是单一队列
// - Node.js 的 process.nextTick 是独立队列（优先级高于微任务）
// - 浏览器有 requestAnimationFrame，Node.js 没有
// - 浏览器事件循环由渲染引擎驱动，Node.js 由 libuv 驱动

// ✅ 避免微任务阻塞渲染
function microTaskPitfall(): void {
  // ❌ 危险：微任务中递归调用自己，会永久阻塞渲染！
  function badLoop(): void {
    // 如果此处是耗时操作，浏览器会卡死
    Promise.resolve().then(badLoop);
  }
  // badLoop(); // 不要执行！

  // ✅ 正确：使用 requestAnimationFrame 或 setTimeout 分片
  function goodLoop(): void {
    // 处理一小块数据...
    requestAnimationFrame(() => {
      // 如果需要继续，在下一帧再调度
      // goodLoop();
    });
  }
}

// ==========================================
// 示例 8：性能 API —— PerformanceObserver、LCP / FCP
// 使用场景：性能监控、Core Web Vitals 上报、用户体验优化
// ==========================================

// ✅ 监控 Core Web Vitals 指标
function observeWebVitals(): () => void {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // LCP（Largest Contentful Paint）：最大内容绘制
      if (entry.entryType === 'largest-contentful-paint') {
        // LargestContentfulPaint 在某些 TS 版本的 DOM lib 中不存在
        // 使用交叉类型兼容不同的 TS 版本
        const lcpEntry = entry as PerformanceEntry & { element?: Element; startTime: number };
        console.log(`LCP: ${lcpEntry.startTime}ms（元素: ${lcpEntry.element?.tagName ?? '未知'}）`);
        // 上报到监控平台：LCP < 2.5s 为良好
      }

      // FCP（First Contentful Paint）：首次内容绘制
      if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        console.log(`FCP: ${entry.startTime}ms`);
        // FCP < 1.8s 为良好
      }

      // CLS（Cumulative Layout Shift）：累积布局偏移
      if (entry.entryType === 'layout-shift') {
        // LayoutShift 是浏览器标准类型，某些 TS 版本 lib 可能缺失
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lsEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        // 只统计用户交互前且未发生的偏移
        if (!lsEntry.hadRecentInput) {
          console.log(`CLS: ${lsEntry.value}`);
        }
      }

      // FID（First Input Delay）：首次输入延迟（使用 event 类型）
      if (entry.entryType === 'first-input') {
        const fidEntry = entry as PerformanceEventTiming;
        console.log(`FID: ${fidEntry.processingStart - fidEntry.startTime}ms`);
      }
    }
  });

  // 注册要观察的性能条目类型
  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'paint', buffered: true });
    observer.observe({ type: 'layout-shift', buffered: true });
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('部分性能 API 不支持');
  }

  // 返回清理函数
  return () => observer.disconnect();
}

// ✅ 自定义性能标记
function measureCustomPerformance(): void {
  performance.mark('task-start');

  // 模拟耗时操作
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }

  performance.mark('task-end');
  const measure = performance.measure('custom-task', 'task-start', 'task-end');

  console.log(`自定义任务耗时: ${measure.duration.toFixed(2)}ms`);

  // 清理
  performance.clearMarks('task-start');
  performance.clearMarks('task-end');
  performance.clearMeasures('custom-task');
}

// ✅ Navigation Timing API —— 页面加载各阶段耗时
function getNavigationTiming(): Record<string, number> {
  const [entry] = performance.getEntriesByType('navigation');
  if (!entry) return {};

  const nav = entry as PerformanceNavigationTiming;

  return {
    DNS: nav.domainLookupEnd - nav.domainLookupStart,
    TCP: nav.connectEnd - nav.connectStart,
    SSL: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
    TTFB: nav.responseStart - nav.requestStart,  // Time to First Byte
    DOM解析: nav.domContentLoadedEventEnd - nav.responseEnd,
    总加载时间: nav.loadEventEnd - nav.fetchStart,
  };
}

// ==========================================
// 示例 9：与后端的联调 —— CORS、Content-Type、FormData vs JSON
// 使用场景：前后端协作中最常见的联调问题
// ==========================================

// ✅ CORS（跨域资源共享）预检请求（Preflight）
// 当请求满足以下任一条件时会触发 OPTIONS 预检：
// 1. 使用 PUT / DELETE / PATCH 等方法
// 2. Content-Type 不是 application/x-www-form-urlencoded / multipart/form-data / text/plain
// 3. 自定义请求头（如 Authorization、X-Requested-With）

async function corsPreflightExample(): Promise<void> {
  // 以下请求会触发预检（因为 Content-Type: application/json + 自定义头）
  const response = await fetch('https://api.example.com/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // 触发预检！
      'Authorization': 'Bearer xxx',       // 触发预检！
    },
    body: JSON.stringify({ key: 'value' }),
  });

  // 浏览器先发 OPTIONS 请求：
  // OPTIONS /data
  // Access-Control-Request-Method: POST
  // Access-Control-Request-Headers: authorization, content-type
  //
  // 后端返回：
  // Access-Control-Allow-Origin: https://myapp.com
  // Access-Control-Allow-Methods: POST, GET, OPTIONS
  // Access-Control-Allow-Headers: authorization, content-type
  // Access-Control-Max-Age: 86400  (预检缓存 24h)
}

// ✅ 后端 CORS 配置示例（Express）：
// app.use(cors({
//   origin: 'https://myapp.com',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,  // 允许携带 Cookie
//   maxAge: 86400,       // 预检缓存时间
// }));

// ✅ Content-Type 选择指南
const contentTypes = {
  'application/json': 'RESTful API 首选，结构化数据',
  'multipart/form-data': '文件上传',
  'application/x-www-form-urlencoded': '传统表单提交（不推荐用于复杂数据）',
  'text/plain': '纯文本，不触发预检请求',
} as const;

// ✅ FormData vs JSON
async function formDataVsJson(): Promise<void> {
  // FormData —— 文件上传 + 表单字段混合
  const formData = new FormData();
  formData.append('name', '张三');
  formData.append('avatar', new File([''], 'avatar.png', { type: 'image/png' }));
  formData.append('tags', 'vue');  // 数组？需要后端支持 FormData 数组格式

  // fetch 使用 FormData 时不要手动设置 Content-Type！
  // 浏览器会自动设置 boundary
  await fetch('/api/upload', {
    method: 'POST',
    body: formData, // 不要设置 headers['Content-Type']
  });

  // JSON —— 复杂嵌套数据结构
  await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '张三',
      tags: ['vue', 'typescript'], // 天然支持数组
      address: { city: '深圳', district: '南山区' }, // 天然支持嵌套
    }),
  });
}

// ==========================================
// ❌ 常见错误 2：CORS 理解偏差
// ==========================================

// ❌ CORS 理解偏差（常见误区合集）
//
// 误区1：CORS 是前端配置的
// CORS 响应头必须由后端服务器返回，前端除了设置
// credentials: 'include' 之外无法绕过同源策略
//
// 误区2：所有跨域请求都有预检
// 简单请求（GET/HEAD/POST + 标准 Content-Type + 无自定义头）不触发预检
//
// 误区3：No-CORS 模式能解决跨域
// fetch(url, { mode: 'no-cors' }) 只能发起请求，无法读取响应！
// 正确做法：后端配置 CORS / 开发环境用代理 / 生产环境同域部署
//
// Vue 开发代理配置（vite.config.ts）：
// export default defineConfig({
//   server: {
//     proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
//   }
// });

// ==========================================
// 浏览器控制台可执行示例
// ==========================================
// 以下代码可直接在浏览器 DevTools Console 中粘贴执行：

/*
// 1. Fetch 请求（需要替换为真实 API）
async function demo() {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const data = await res.json();
  console.log('Fetch 结果:', data);
}
demo();

// 2. localStorage 读写
const key = 'demo_data';
localStorage.setItem(key, JSON.stringify({ time: Date.now(), msg: 'hello' }));
const stored = JSON.parse(localStorage.getItem(key)!);
console.log('localStorage 读取:', stored);

// 3. Cookie 操作
document.cookie = 'demo_cookie=hello; path=/; max-age=60';
console.log('所有 Cookie:', document.cookie);
// 60 秒后自动过期

// 4. 事件循环演示
console.log('0. start');
setTimeout(() => console.log('1. setTimeout'), 0);
Promise.resolve().then(() => console.log('2. Promise'));
queueMicrotask(() => console.log('3. queueMicrotask'));
console.log('4. end');
// 输出: 0 → 4 → 2 → 3 → 1

// 5. Canvas 基础绘制
const c = document.createElement('canvas');
c.width = 200; c.height = 100;
document.body.appendChild(c);
const ctx = c.getContext('2d')!;
ctx.fillStyle = 'tomato';
ctx.fillRect(10, 10, 50, 50);
ctx.font = '14px sans-serif';
ctx.fillStyle = 'black';
ctx.fillText('Canvas Demo', 80, 40);
*/

// ==========================================
// 本章小结
// ==========================================
// 1. fetch 不检查 HTTP 错误码，必须手动检查 response.ok
// 2. AbortController 取消请求，配合 signal 实现搜索防抖和超时
// 3. localStorage 只能存字符串，封装 JSON 序列化；IndexedDB 适合大容量结构化数据
// 4. document.cookie 是字符串陷阱，使用 HttpOnly Cookie 存储敏感 Token
// 5. Web Worker 处理 CPU 密集计算；Service Worker 实现 PWA 离线缓存
// 6. Canvas 需适配 DPR；animation 使用 transform + opacity 触发 GPU 合成
// 7. 浏览器事件循环：宏任务→清空微任务→可能渲染→下一宏任务（Node.js 阶段更多）
// 8. CORS 预检由浏览器发起，后端配置响应头；FormData 上传文件不要设 Content-Type
