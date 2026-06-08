/**
 * 学习目标：
 * 1. querySelector / querySelectorAll 的泛型使用与空值处理
 * 2. DOM 节点操作：createElement、appendChild、remove、cloneNode
 * 3. 事件流三阶段：捕获（Capturing）→ 目标（Target）→ 冒泡（Bubbling）
 * 4. addEventListener 的 options：capture、once、passive
 * 5. 事件委托（Event Delegation）模式与类型安全
 * 6. 自定义事件 CustomEvent<T> 的泛型定义
 * 7. MutationObserver 与 ResizeObserver 的类型
 * 8. 与 Vue 的映射：v-on 修饰符 .stop/.prevent/.capture/.passive/.once
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python：没有原生 DOM API，需通过浏览器环境或 PyScript 桥接
 * - Java：Swing/JavaFX 有类似事件模型，但 DOM 操作是浏览器专有
 * - Rust：通过 wasm-bindgen 与 web-sys crate 操作 DOM，类型更严格
 */

// ==========================================
// 示例 1：querySelector / querySelectorAll 的泛型使用
// 使用场景：从 DOM 中选取元素并安全地操作其属性/方法
// ==========================================

// ✅ 正确做法：显式指定泛型，获得类型安全
const appDiv = document.querySelector<HTMLDivElement>('#app');

// 由于 strictNullChecks 开启，appDiv 类型为 HTMLDivElement | null
// 必须先进行空值检查
if (appDiv !== null) {
  // 此时代码块内 appDiv 被收窄为 HTMLDivElement
  appDiv.textContent = 'Hello TypeScript';
  appDiv.style.backgroundColor = '#f0f0f0';
}

// ✅ querySelectorAll 返回 NodeListOf<T>，可直接迭代
const allButtons = document.querySelectorAll<HTMLButtonElement>('button');
allButtons.forEach((btn) => {
  btn.disabled = false; // btn 类型为 HTMLButtonElement
});

// ✅ 类型断言与自定义组件的映射
// Vue 中 <MyComponent ref="comp"> 可通过泛型获得组件实例类型
// const comp = document.querySelector<InstanceType<typeof MyComponent>>('#comp');

// ==========================================
// ❌ 常见错误 1：querySelector 返回 null 未处理
// ==========================================

// ❌ 常见错误：querySelector 返回 null 直接访问属性
// 以下代码在 strict 模式下编译报错，因为 maybeNull 可能是 null
const maybeNull = document.querySelector<HTMLDivElement>('.not-exist');
// @ts-expect-error —— maybeNull 可能为 null，不能直接访问 textContent
void maybeNull.textContent; // 编译器报错：TS18047 'maybeNull' is possibly 'null'
// 运行时：Uncaught TypeError: Cannot set properties of null

// ✅ 安全方式一：条件判断
const safeEl = document.querySelector<HTMLDivElement>('.maybe-exist');
if (safeEl) {
  safeEl.textContent = 'safe';
}

// ✅ 安全方式二：可选链 + 空值合并（适合赋值操作）
document.querySelector<HTMLDivElement>('.maybe-exist')?.setAttribute('data-loaded', 'true');

// ==========================================
// 示例 2：DOM 节点操作
// 使用场景：动态创建 UI 元素、列表渲染、弹窗组件
// ==========================================

// createElement —— 创建元素节点
function createCard(title: string, content: string): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'card';

  const h2 = document.createElement('h2');
  h2.textContent = title;

  const p = document.createElement('p');
  p.textContent = content;

  card.appendChild(h2);
  card.appendChild(p);

  return card;
}

// ✅ insertBefore / insertAdjacentElement（比 appendChild 更精细的控制）
const referenceNode = document.querySelector<HTMLDivElement>('#reference');
const newCard = createCard('标题', '内容');
if (referenceNode?.parentNode) {
  // 在 referenceNode 之前插入
  referenceNode.parentNode.insertBefore(newCard, referenceNode);
}

// ✅ cloneNode —— 深克隆 vs 浅克隆
function duplicateTemplate(): void {
  const template = document.querySelector<HTMLTemplateElement>('#card-template');
  if (!template?.content) return;

  // cloneNode(true) 深克隆（包含子节点），false 浅克隆（仅自身）
  const clone = template.content.cloneNode(true) as DocumentFragment;

  // 修改克隆体不会影响原模板
  const titleEl = clone.querySelector<HTMLHeadingElement>('.title');
  if (titleEl) titleEl.textContent = '克隆的标题';

  document.body.appendChild(clone);
}

// ✅ remove —— 现代 API，无需通过 parentNode
function removeElement(selector: string): void {
  document.querySelector(selector)?.remove();
}

// ==========================================
// 与 Vue 的映射
// ==========================================
// Vue 中 v-for + :key 本质是在做「判断哪些 DOM 节点可复用，哪些需要
// createElement + remove」。Vue 的虚拟 DOM diff 算法最终调用的就是
// 这些原生 DOM API。理解它们有助于理解 Vue 的底层渲染机制。
//
// Vue 的 <Teleport> 组件本质是 appendChild 到另一个容器。
// Vue 的 v-if vs v-show：v-if 对应 createElement/remove，v-show 只改 display。

// ==========================================
// 示例 3：事件流三阶段
// 使用场景：理解事件传播顺序，解决嵌套元素点击冲突
// ==========================================

// DOM 事件流分为三个阶段：
// 1. 捕获阶段（Capturing Phase）—— 从 window → document → ... → 目标元素的父级
// 2. 目标阶段（Target Phase）—— 事件到达目标元素
// 3. 冒泡阶段（Bubbling Phase）—— 从目标元素 → ... → document → window

// 默认情况下，addEventListener 在冒泡阶段触发

// 在浏览器控制台中执行以下代码可观察事件流：
function demoEventPhases(): void {
  const outer = document.querySelector<HTMLDivElement>('#outer');
  const inner = document.querySelector<HTMLDivElement>('#inner');

  outer?.addEventListener('click', () => {
    console.log('outer 冒泡阶段');
  }, false); // false = 冒泡阶段（默认）

  outer?.addEventListener('click', () => {
    console.log('outer 捕获阶段');
  }, true); // true = 捕获阶段

  inner?.addEventListener('click', () => {
    console.log('inner 冒泡阶段');
  });

  inner?.addEventListener('click', () => {
    console.log('inner 捕获阶段');
  }, true);

  // 点击 inner 时输出顺序：
  // outer 捕获阶段 → inner 捕获阶段 → inner 冒泡阶段 → outer 冒泡阶段
}

// ✅ stopPropagation —— 阻止事件继续传播
function stopBubblingDemo(e: MouseEvent): void {
  // stopPropagation：阻止事件继续传播到后续元素
  // 无论在捕获还是冒泡阶段调用，都会阻止事件向其他元素传播
  e.stopPropagation();
  // e.stopImmediatePropagation(); // 连当前元素上其他监听器也阻止
}

// ✅ stopPropagation vs stopImmediatePropagation 的区别
// stopPropagation：阻止向父/子传播，但当前元素上的其他监听器仍会执行
// stopImmediatePropagation：阻止传播 + 阻止当前元素上后续所有监听器

// ==========================================
// 示例 4：addEventListener 的 options
// 使用场景：性能优化（passive）、一次性监听（once）、捕获阶段处理（capture）
// ==========================================

// ✅ capture: true —— 在捕获阶段触发
const clickHandler = (e: MouseEvent): void => { console.log('click captured'); };
document.addEventListener('click', clickHandler, { capture: true });
// 等价于 document.addEventListener('click', clickHandler, true);

// ✅ once: true —— 触发一次后自动移除
const submitBtn = document.querySelector<HTMLButtonElement>('#submit');
submitBtn?.addEventListener('click', () => {
  console.log('按钮被点击，此监听器将自动移除');
}, { once: true });
// 等价于 Vue 中的 @click.once

// ✅ passive: true —— 告诉浏览器不会调用 preventDefault()
// 对 scroll / touchstart / touchmove 事件设置 passive 可提升滚动性能
document.addEventListener(
  'touchstart',
  (e: TouchEvent) => {
    // ❌ passive 模式下调用 preventDefault() 会被忽略并触发控制台警告
    // e.preventDefault();
    console.log('touchstart handler');
  },
  { passive: true },
);

// ✅ signal —— 通过 AbortController 取消监听器（推荐替代 removeEventListener）
const controller = new AbortController();
const { signal } = controller;

document.addEventListener('mousemove', (e: MouseEvent) => {
  console.log(`鼠标位置: ${e.clientX}, ${e.clientY}`);
}, { signal });

// 当不再需要监听时，调用 abort() 即可移除
// controller.abort();
// 这在 SPA 组件卸载时非常有用，可以一次性移除多个监听器

// ==========================================
// 与 Vue 的映射：v-on 修饰符对应原生 API
// ==========================================
// @click.stop   → e.stopPropagation()
// @click.prevent → e.preventDefault()
// @click.capture → { capture: true }
// @click.once    → { once: true }
// @click.passive → { passive: true }
// @click.self    → if (e.target !== e.currentTarget) return;
//
// Vue 3 中事件处理器的类型推导：
// <button @click="handleClick">  →  handleClick(e: MouseEvent) {...}
// <input @input="handleInput">   →  handleInput(e: Event) { const target = e.target as HTMLInputElement; ... }

// ==========================================
// 示例 5：事件委托（Event Delegation）模式与类型安全
// 使用场景：列表项点击、动态添加的元素不需要逐个绑定事件
// ==========================================

// 事件委托原理：将事件监听器绑定在父元素上，利用冒泡机制捕获子元素事件
// 优点：减少监听器数量、自动支持动态添加的子元素

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

function setupTodoDelegation(): void {
  const todoList = document.querySelector<HTMLUListElement>('#todo-list');
  if (!todoList) return;

  todoList.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // ✅ 通过 data-* 属性判断点击的是哪个按钮
    if (target.matches('[data-action="delete"]')) {
      const todoId = Number(target.dataset.id);
      console.log(`删除 todo: ${todoId}`);
      // Vue 中：@click="removeTodo(item.id)" 本质也是事件委托到组件根元素
    }

    if (target.matches('[data-action="toggle"]')) {
      const todoId = Number(target.dataset.id);
      console.log(`切换 todo: ${todoId}`);
    }
  });
}

// ✅ 结合 closest() 处理嵌套结构
function setupNestedDelegation(): void {
  const container = document.querySelector<HTMLDivElement>('#card-container');
  if (!container) return;

  container.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // closest 向上查找最近的匹配祖先，解决子元素嵌套问题
    const card = target.closest<HTMLDivElement>('.card');
    if (!card) return; // 点击的不是卡片或其子元素

    const cardId = card.dataset.id;
    console.log(`点击了卡片: ${cardId}`);

    // 进一步判断具体点击的按钮
    if (target.closest<HTMLButtonElement>('.btn-delete')) {
      console.log(`删除卡片: ${cardId}`);
    }
  });
}

// ==========================================
// ❌ 常见错误 2：事件委托类型断言错误
// ==========================================

// ❌ 错误写法：事件委托类型断言错误（运行时可能失效）
function badDelegation(): void {
  const list = document.querySelector<HTMLUListElement>('#list');
  if (!list) return;

  list.addEventListener('click', (event: MouseEvent) => {
    // ❌ 错误：event.target 可能是被点击按钮内的 <span> 或 <i> 图标
    const button = event.target as HTMLButtonElement;
    // 如果用户点击了按钮内的图标，event.target 是 <i> 而非 <button>
    // @ts-expect-error —— dataset.action 是 string | undefined，不能赋值给 string
    const action: string = button.dataset.action;
    // dataset.action 此时为 undefined，类型收窄后赋值给 string 会报错
    console.log(action); // 可能为 undefined
  });

  // ✅ 正确：使用 closest 向上查找
  list.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;

    const action: string | undefined = button.dataset.action;
    console.log(`动作: ${action}`);
  });
}

// ==========================================
// 示例 6：自定义事件 CustomEvent<T> 的泛型定义
// 使用场景：组件间通信、非父子组件数据传递、微前端事件总线
// ==========================================

// ✅ 定义自定义事件的 payload 类型
interface CartUpdateDetail {
  productId: string;
  quantity: number;
  action: 'add' | 'remove' | 'update';
}

// ✅ 创建并派发类型安全的自定义事件
function dispatchCartUpdate(detail: CartUpdateDetail): void {
  const event = new CustomEvent<CartUpdateDetail>('cart:update', {
    detail,
    bubbles: true,    // 允许冒泡，父元素可以监听到
    cancelable: true, // 允许 preventDefault
  });

  document.dispatchEvent(event);
}

// ✅ 监听自定义事件（类型安全）
document.addEventListener('cart:update', ((event: CustomEvent<CartUpdateDetail>) => {
  const { productId, quantity, action } = event.detail;
  console.log(`购物车 ${action}: ${productId} x ${quantity}`);
}) as EventListener);

// Vue 中对应：使用 mitt 或 provide/inject 实现类似效果
// import mitt from 'mitt';
// const emitter = mitt<{ 'cart:update': CartUpdateDetail }>();
// emitter.emit('cart:update', { productId: 'p1', quantity: 2, action: 'add' });

// ✅ Event Bus 模式（组件通信）
type AppEvents = {
  'user:login': { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'theme:change': { theme: 'light' | 'dark' };
};

class TypedEventBus<T extends Record<string, unknown>> {
  private target = new EventTarget();
  // 保存原始 handler → wrapper 的映射，确保 off() 能正确移除
  private wrappers = new WeakMap<(detail: unknown) => void, EventListener>();

  on<K extends keyof T & string>(type: K, handler: (detail: T[K]) => void): void {
    // 如果已经注册过同名 handler，先移除旧的（幂等注册）
    this.off(type, handler);

    const wrapper = (e: Event) => {
      handler((e as CustomEvent<T[K]>).detail);
    };
    this.wrappers.set(handler as (detail: unknown) => void, wrapper as EventListener);
    this.target.addEventListener(type, wrapper as EventListener);
  }

  emit<K extends keyof T & string>(type: K, detail: T[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  off<K extends keyof T & string>(type: K, handler: (detail: T[K]) => void): void {
    const wrapper = this.wrappers.get(handler as (detail: unknown) => void);
    if (wrapper) {
      this.target.removeEventListener(type, wrapper);
      this.wrappers.delete(handler as (detail: unknown) => void);
    }
  }
}

const bus = new TypedEventBus<AppEvents>();
bus.on('user:login', (detail) => {
  // detail 自动推断为 { userId: string; timestamp: number }
  console.log(`${detail.userId} 在 ${detail.timestamp} 登录`);
});
bus.emit('user:login', { userId: 'u_123', timestamp: Date.now() });

// ==========================================
// 示例 7：MutationObserver —— 监视 DOM 变化
// 使用场景：监听第三方库的 DOM 操作、实现自定义指令、水印防篡改
// ==========================================

/**
 * characterData 关键理解：它监视的是文本节点（Text Node，即 #text），
 * 而不是 HTML 元素节点（Element）！
 *
 * 场景划分：
 * 1. 目标元素是文本节点本身（如 element.childNodes[0] 是 Text）
 *    → characterData: true 直接生效，不需要 subtree
 *
 * 2. 目标元素是容器（如 <div>），其子节点包含 Text 节点
 *    → 必须同时设置 characterData: true + subtree: true
 *    → 此时 mutation.target 类型为 Text，不能当 HTMLElement 用
 */
function setupMutationObserver(): MutationObserver | null {
  const target = document.querySelector<HTMLDivElement>('#observed-area');
  if (!target) return null;

  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'childList': {
          // 子节点增删
          console.log('添加的节点:', mutation.addedNodes);
          console.log('移除的节点:', mutation.removedNodes);
          break;
        }
        case 'attributes': {
          // 属性变化（mutation.target 是 Element）
          console.log(
            `属性 "${mutation.attributeName}" 变为:`,
            (mutation.target as HTMLElement).getAttribute(mutation.attributeName ?? ''),
          );
          break;
        }
        case 'characterData': {
          // 文本内容变化（mutation.target 是 Text 节点，不是 Element！）
          // mutation.oldValue 记录了变化前的文本（需开启 characterDataOldValue）
          console.log('文本从:', mutation.oldValue, '变为:', mutation.target.textContent);
          break;
        }
      }
    }
  });

  // 观察容器元素，开启 subtree 以捕获所有后代的文本变化
  observer.observe(target, {
    childList: true,              // 监视子节点增删
    attributes: true,             // 监视属性变化
    characterData: true,          // 监视文本内容（配合 subtree 才能捕获后代文本变化）
    subtree: true,                // 监视所有后代节点（对 characterData 尤为重要）
    attributeOldValue: true,      // 记录变化前的属性值
    characterDataOldValue: true,  // 记录变化前的文本值（通过 mutation.oldValue 访问）
  });

  return observer; // 调用方负责 observer.disconnect()
}

// ✅ 直接观察文本节点（不需要 subtree）
function observeTextNodeDirectly(textNode: Text): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') {
        console.log(`文本节点变化: "${m.oldValue}" → "${m.target.textContent}"`);
      }
    }
  });

  observer.observe(textNode, {
    characterData: true,
    characterDataOldValue: true,
    // 不需要 subtree，因为观察的就是文本节点本身
  });

  return observer;
}

// Vue 中对应：Vue 的响应式系统通过 Proxy 追踪数据变化，
// 而非 MutationObserver（后者用于追踪 DOM 变化）。
// 但自定义指令中可能用到 MutationObserver，比如 v-watermark 防篡改。

// ==========================================
// 示例 8：ResizeObserver —— 监视元素尺寸变化
// 使用场景：响应式布局、图表自适应、ECharts resize
// ==========================================

function setupResizeObserver(containerSelector: string): ResizeObserver | null {
  const container = document.querySelector<HTMLDivElement>(containerSelector);
  if (!container) return null;

  const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      // 现代 API：borderBoxSize / contentBoxSize 返回数组（支持多片段布局，如分栏排版）
      // 每个元素包含 inlineSize（逻辑宽度）和 blockSize（逻辑高度）
      // 相比 contentRect，boxSize 不受 CSS transform/zoom 影响，且精度更高（小数不截断）
      const borderBox = entry.borderBoxSize?.[0];
      const contentBox = entry.contentBoxSize?.[0];
      const width = borderBox ? borderBox.inlineSize : entry.contentRect.width;
      const height = borderBox ? borderBox.blockSize : entry.contentRect.height;

      console.log(
        `容器尺寸变化: ${width} × ${height}` +
        (contentBox ? ` (内容区: ${contentBox.inlineSize} × ${contentBox.blockSize})` : ''),
      );

      // 典型场景：ECharts 图表自适应
      // const chart = echarts.getInstanceByDom(entry.target as HTMLElement);
      // chart?.resize();

      // 或者触发 CSS 容器查询对应的逻辑
      if (width < 768) {
        entry.target.classList.add('mobile');
        entry.target.classList.remove('desktop');
      } else {
        entry.target.classList.add('desktop');
        entry.target.classList.remove('mobile');
      }
    }
  });

  resizeObserver.observe(container);
  return resizeObserver;
}

// 相比 window.resize 事件的优势：
// 1. 精确到元素级别，而非整个窗口
// 2. 不会因 CSS transform 或 zoom 导致误触发
// 3. 支持观察多个元素

// contentRect vs borderBoxSize/contentBoxSize 对比：
// contentRect        → 传统 API，返回 DOMRectReadOnly（像素值，整数截断）
// borderBoxSize[0]   → 现代 API，返回 ResizeObserverSize（inlineSize/blockSize，小数精度）
// contentBoxSize[0]  → 现代 API，padding-box 内尺寸（同样支持逻辑尺寸）
// borderBoxSize 是数组是因为多片段布局（column 分栏）时每个片段一个尺寸

// ==========================================
// 浏览器控制台可执行示例
// ==========================================
// 以下代码可直接在浏览器 DevTools Console 中粘贴执行：

/*
// 1. 创建测试 DOM
const div = document.createElement('div');
div.id = 'test-div';
div.innerHTML = `
  <p id="text">原始文本</p>
  <button data-action="click-me">点我</button>
  <ul id="todo-list">
    <li><button data-action="delete" data-id="1">删除</button> 任务1</li>
    <li><button data-action="delete" data-id="2">删除</button> 任务2</li>
  </ul>
`;
document.body.appendChild(div);

// 2. querySelector 泛型
const textEl = document.querySelector<HTMLParagraphElement>('#text');
if (textEl) {
  textEl.textContent = '修改后的文本';
  console.log('查询成功:', textEl.textContent);
}

// 3. 事件委托
const list = document.querySelector<HTMLUListElement>('#todo-list');
list?.addEventListener('click', (e: MouseEvent) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action="delete"]');
  if (!btn) return;
  console.log('删除任务:', btn.dataset.id);
});

// 4. 自定义事件
document.addEventListener('custom:hello', ((e: CustomEvent<string>) => {
  console.log('收到自定义事件:', e.detail);
}) as EventListener);
document.dispatchEvent(new CustomEvent<string>('custom:hello', { detail: 'Hello World' }));

// 5. ResizeObserver
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    console.log('尺寸变化:', entry.contentRect.width, entry.contentRect.height);
  }
});
ro.observe(div);
*/

// ==========================================
// 本章小结
// ==========================================
// 1. querySelector 泛型 <HTMLElement> 获得类型安全，但必须处理 null 返回值
// 2. DOM 操作四件套：createElement→appendChild→remove→cloneNode
// 3. 事件三阶段：捕获→目标→冒泡，默认冒泡阶段触发
// 4. addEventListener options：capture/once/passive/signal 各有用途
// 5. 事件委托用 closest() + matches() 替代 e.target 类型断言，更安全
// 6. CustomEvent<T> 泛型实现类型安全的事件总线
// 7. MutationObserver 观察 DOM 变化，ResizeObserver 观察尺寸变化
// 8. Vue v-on 修饰符 .stop/.prevent/.capture/.once/.passive 都直接映射到原生 API
