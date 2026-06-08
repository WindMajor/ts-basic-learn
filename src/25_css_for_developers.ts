/**
 * 学习目标：
 * 1. 盒模型：content-box vs border-box（为什么永远该用 border-box）
 * 2. 现代布局：Flexbox（主轴/交叉轴、align/justify）与 CSS Grid（grid-template-areas）
 * 3. 响应式：媒体查询 @media、clamp()、min()、max()、容器查询 @container
 * 4. CSS 变量（自定义属性）与 TS 设计系统变量的映射
 * 5. 层叠与优先级：Specificity 计算、!important 的滥用后果
 * 6. 常见布局陷阱：margin 折叠、BFC（Block Formatting Context）、z-index 层叠上下文
 * 7. 性能：will-change、transform 开启 GPU 层、避免重排（Reflow）
 * 8. 与 Vue 的映射：scoped 样式底层原理、:deep()、v-bind() in CSS
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python：无浏览器环境，CSS 概念仅在全栈项目（Django/Flask 模板）中出现
 * - Java：Android 开发中布局概念（LinearLayout/ConstraintLayout）与 Flex/Grid 有相似之处
 * - Rust：Yew/Dioxus 等 WASM 框架中通过 Rust 宏描述样式，底层仍是 CSS
 *
 * 注意：本文件使用 TypeScript 来讲解 CSS 概念，代码块展示的是
 * TS 中操作 CSS 的方式以及 CSS 的原理性知识。
 */

// ==========================================
// 示例 1：盒模型 —— content-box vs border-box
// 使用场景：所有前端开发的基础，不理解盒模型就无法精确控制布局
// ==========================================

/**
 * 盒模型决定元素尺寸的计算方式：
 *
 * content-box（浏览器默认）：
 *   元素宽度 = width + padding + border
 *   设置 width: 200px，实际占用 = 200 + padding-left + padding-right + border-left + border-right
 *
 * border-box（推荐设置）：
 *   元素宽度 = width（已包含 padding + border）
 *   设置 width: 200px，内容区 = 200 - padding - border
 */

// ✅ TS 中获取元素的盒模型数据
function inspectBoxModel(selector: string): void {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return;

  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  console.log('=== 盒模型分析 ===');
  console.log(`box-sizing: ${style.boxSizing}`);
  console.log(`CSS width: ${style.width}, height: ${style.height}`);
  console.log(`实际渲染尺寸: ${rect.width} × ${rect.height}`);
  console.log(`padding: ${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`);
  console.log(`border: ${style.borderTopWidth} ${style.borderRightWidth} ${style.borderBottomWidth} ${style.borderLeftWidth}`);

  // 如果 box-sizing 是 content-box，实际宽度 = CSS width + padding + border
  // 这会导致设置了 width: 100% 的元素因 padding 而溢出！
}

// ✅ 全局设置 border-box（几乎所有现代 CSS 框架都这么做）
// *,
// *::before,
// *::after {
//   box-sizing: border-box;
// }

// ❌ 错误：假设所有元素都是 border-box
// 当你设置 .sidebar { width: 200px; padding: 20px; } 且 box-sizing 为 content-box 时，
// 实际宽度 = 200 + 40 = 240px，会导致布局错位
// 这也是为什么主流框架（Tailwind、Bootstrap）都全局设置 *,*::before,*::after { box-sizing: border-box }

// ==========================================
// 示例 2：现代布局 —— Flexbox
// 使用场景：一维布局（导航栏、卡片列表、居中、等分布局）
// ==========================================

/**
 * Flexbox 核心概念：
 * - 容器属性：display: flex, flex-direction, justify-content, align-items, flex-wrap, gap
 * - 项目属性：flex-grow, flex-shrink, flex-basis, align-self, order
 *
 * 主轴（Main Axis）由 flex-direction 决定：
 *   - row（默认）：主轴水平，交叉轴垂直
 *   - column：主轴垂直，交叉轴水平
 *
 * justify-* 沿主轴对齐，align-* 沿交叉轴对齐
 */

// ✅ TS 中动态设置 Flex 布局
function applyFlexLayout(
  container: HTMLElement,
  direction: 'row' | 'column' = 'row',
  gap: number = 16,
): void {
  container.style.display = 'flex';
  container.style.flexDirection = direction;
  container.style.gap = `${gap}px`;
  container.style.alignItems = 'center';
  container.style.justifyContent = 'space-between';
}

// ✅ 常用 Flex 布局模式
function createFlexPatterns(): Record<string, Partial<CSSStyleDeclaration>> {
  return {
    // 水平垂直居中
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    } as Partial<CSSStyleDeclaration>,

    // 等分布局（flex: 1）
    equalColumns: {
      display: 'flex',
      gap: '16px',
    } as Partial<CSSStyleDeclaration>,

    // 圣杯布局（header + main + footer，main 填充剩余空间）
    stickyFooter: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    } as Partial<CSSStyleDeclaration>,
  };
}

// ❌ Flex 常见误区：混淆 justify-content 和 align-items
// 在 flex-direction: row 时：
//   justify-content 控制水平对齐（主轴），align-items 控制垂直对齐（交叉轴）
// 在 flex-direction: column 时：
//   justify-content 控制垂直对齐（主轴），align-items 控制水平对齐（交叉轴）
// 记忆口诀：justify 沿主轴，align 沿交叉轴

// ==========================================
// 示例 3：现代布局 —— CSS Grid
// 使用场景：二维布局（仪表盘、商品网格、复杂页面布局）
// ==========================================

/**
 * Grid 核心概念：
 * - 容器属性：display: grid, grid-template-columns, grid-template-rows, gap
 * - grid-template-areas：命名区域，可视化布局结构
 * - 项目属性：grid-column, grid-row, grid-area
 */

// ✅ TS 中构建 Grid 布局
interface GridConfig {
  columns: string;   // 如 '1fr 2fr 1fr' 或 'repeat(3, 1fr)'
  rows: string;      // 如 'auto 1fr auto'
  gap: number;
  areas: string[][]; // 如 [['header', 'header'], ['sidebar', 'main'], ['footer', 'footer']]
}

function applyGridLayout(container: HTMLElement, config: GridConfig): void {
  container.style.display = 'grid';
  container.style.gridTemplateColumns = config.columns;
  container.style.gridTemplateRows = config.rows;
  container.style.gap = `${config.gap}px`;

  // grid-template-areas：最直观的布局方式
  container.style.gridTemplateAreas = config.areas
    .map((row) => `"${row.join(' ')}"`)
    .join(' ');
}

// ✅ 经典 Grid 页面布局
function createPageLayout(): void {
  const main = document.querySelector<HTMLElement>('#app');
  if (!main) return;

  applyGridLayout(main, {
    columns: '200px 1fr 200px',
    rows: 'auto 1fr auto',
    gap: 0,
    areas: [
      ['header', 'header', 'header'],
      ['nav', 'main', 'aside'],
      ['footer', 'footer', 'footer'],
    ],
  });

  // 对应的 CSS：
  // .header { grid-area: header; }
  // .nav    { grid-area: nav; }
  // .main   { grid-area: main; }
  // .aside  { grid-area: aside; }
  // .footer { grid-area: footer; }
}

// ✅ Grid vs Flex 选择指南
function chooseLayout(needs: '1d' | '2d' | 'overlap'): 'flex' | 'grid' {
  // 一维布局（单行/单列）→ Flexbox
  // 二维布局（行+列同时控制）→ Grid
  // 元素重叠（如 hero banner 文字叠在图片上）→ Grid（同一 grid-area）
  if (needs === '1d') return 'flex';
  return 'grid';
}

// ==========================================
// 示例 4：响应式 —— @media、clamp()、min()、max()、@container
// 使用场景：移动端适配、不同屏幕尺寸的差异化布局
// ==========================================

/**
 * 响应式设计三层策略：
 * 1. 流体值：clamp()、min()、max() —— 无需断点
 * 2. 媒体查询：@media —— 基于视口宽度
 * 3. 容器查询：@container —— 基于父容器宽度（组件级响应式）
 */

// ✅ TS 中检测当前匹配的媒体查询
function checkMediaQueries(): Record<string, boolean> {
  return {
    isMobile: window.matchMedia('(max-width: 767px)').matches,
    isTablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
    isDesktop: window.matchMedia('(min-width: 1024px)').matches,
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

// ✅ 动态响应媒体查询变化
function watchMediaQuery(): () => void {
  const mq = window.matchMedia('(max-width: 767px)');

  function handleChange(matches: boolean, media: string): void {
    console.log(`移动端模式: ${matches} (${media})`);
    document.documentElement.classList.toggle('mobile', matches);
  }

  // 初始调用（传入普通值，而非伪造事件对象）
  handleChange(mq.matches, mq.media);

  // 监听后续变化（e 是真正的 MediaQueryListEvent）
  const listener = (e: MediaQueryListEvent) => handleChange(e.matches, e.media);
  mq.addEventListener('change', listener);

  // 返回清理函数
  return () => mq.removeEventListener('change', listener);
}

// ✅ CSS 数值函数的 TS 映射（在 JS 中操作对应 CSS 属性）
function applyFluidTypography(el: HTMLElement): void {
  // clamp(MIN, PREFERRED, MAX)：最实用的流体值函数
  // 字体在 320px~1200px 视口间从 16px 线性变化到 24px，上下限截断
  // 注意：复杂数学表达式建议用 calc() 包裹，兼容性更佳
  el.style.fontSize = 'clamp(16px, calc(2vw + 10px), 24px)';

  // min()：取最小值——侧边栏最大宽度 300px
  el.style.width = 'min(100%, 300px)';

  // max()：取最大值——按钮最小宽度 120px
  el.style.minWidth = 'max(120px, 20%)';
}

// ✅ 容器查询（Container Query）—— 组件级响应式
// CSS 写法：
// .card-container { container-type: inline-size; container-name: card; }
// @container card (min-width: 400px) { .card { flex-direction: row; } }

// TS 中无法直接监听容器查询，但可通过 ResizeObserver 模拟
// 使用 modern API：borderBoxSize 获取 inlineSize，且不受 CSS transform/zoom 影响
function setupContainerQueryFallback(
  container: HTMLElement,
  breakpoints: Array<{ minWidth: number; className: string }>,
): ResizeObserver {
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;

    // 优先使用 borderBoxSize 的 inlineSize（现代 API，支持逻辑尺寸）
    const boxSize = entry.borderBoxSize?.[0];
    const width = boxSize ? boxSize.inlineSize : entry.contentRect.width;
    if (width === undefined) return;

    for (const bp of breakpoints) {
      container.classList.toggle(bp.className, width >= bp.minWidth);
    }
  });

  // 指定观察 box 类型：'border-box'（默认，包含 padding+border）
  // 'content-box' 对应容器查询的 container-type: inline-size 行为
  observer.observe(container, { box: 'border-box' });
  return observer;
}

// ==========================================
// 示例 5：CSS 变量（自定义属性）与 TS 设计系统变量映射
// 使用场景：主题切换、设计 Token 统一管理、组件级样式定制
// ==========================================

// ✅ 定义设计 Token 的 TS 类型
interface DesignTokens {
  color: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    error: string;
    success: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
}

// ✅ 将 TS 对象同步到 CSS 变量
function applyDesignTokens(tokens: DesignTokens): void {
  const root = document.documentElement;

  // 颜色
  root.style.setProperty('--color-primary', tokens.color.primary);
  root.style.setProperty('--color-secondary', tokens.color.secondary);
  root.style.setProperty('--color-background', tokens.color.background);
  root.style.setProperty('--color-text', tokens.color.text);

  // 间距
  for (const [key, value] of Object.entries(tokens.spacing)) {
    root.style.setProperty(`--spacing-${key}`, value);
  }

  // 圆角
  for (const [key, value] of Object.entries(tokens.radius)) {
    root.style.setProperty(`--radius-${key}`, value);
  }

  // 阴影
  for (const [key, value] of Object.entries(tokens.shadow)) {
    root.style.setProperty(`--shadow-${key}`, value);
  }
}

// ✅ 运行时读取 CSS 变量值
function getCSSVariable(name: string, element: HTMLElement = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

// 获取主题色
// const primaryColor = getCSSVariable('--color-primary');

// ✅ 暗黑模式切换（通过 CSS 变量实现，无需修改组件样式）
function toggleDarkMode(): void {
  const root = document.documentElement;
  const isDark = root.classList.toggle('dark');

  // 方案一：通过 class + CSS 变量覆盖
  // .dark { --color-background: #1a1a2e; --color-text: #e0e0e0; }

  // 方案二：JS 直接设置变量（适合动态颜色）
  if (isDark) {
    root.style.setProperty('--color-background', '#1a1a2e');
    root.style.setProperty('--color-text', '#e0e0e0');
  } else {
    root.style.removeProperty('--color-background');
    root.style.removeProperty('--color-text');
  }

  // 持久化用户偏好
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// 与 Vue 的映射：设计 Token 在 Vue 中的实际应用
// 1. CSS 变量定义在 :root 或组件内
// 2. 组件中通过 var(--color-primary) 引用
// 3. TS 侧维护 tokens 对象，运行时通过 setProperty 更新
// 4. Naive UI / Ant Design Vue 等组件库使用 CSS 变量实现主题定制

// ==========================================
// 示例 6：层叠与优先级 —— Specificity 计算
// 使用场景：排查"为什么我的样式不生效"，理解 CSS 优先级规则
// ==========================================

/**
 * Specificity（优先级）计算公式（a, b, c, d）：
 * a：style 属性（内联样式）—— 1 或 0
 * b：ID 选择器数量
 * c：类选择器、属性选择器、伪类数量
 * d：元素选择器、伪元素数量
 *
 * 优先级比较示例：
 * #nav .item a:hover    → (0, 1, 2, 1) → 胜出
 * .container .list li   → (0, 0, 2, 1)
 *
 * 通配符 * 、组合器（+、>、~）、:where() 不增加优先级
 * :is() 和 :not() 取参数中最高优先级
 */

// ✅ TS 中通过 CSSOM 检测样式覆盖情况
function inspectStyleConflict(selector: string): Record<string, string> {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return {};

  const computed = getComputedStyle(el);
  return {
    color: computed.color,
    fontSize: computed.fontSize,
    display: computed.display,
    // 这些值是所有层叠规则运算后的最终结果
  };
}

/**
 * !important 的滥用后果：
 * 1. 破坏 CSS 天然的可覆盖性，导致后续修改必须也加 !important
 * 2. 形成 !important 军备竞赛，代码越来越难维护
 * 3. 覆盖内联样式时可以考虑使用（如第三方组件库的样式覆盖）
 *
 * 替代方案：
 * - 提高选择器优先级（增加类名层级）
 * - 调整 CSS 文件加载顺序
 * - 使用 CSS 层叠层 @layer
 */

// ❌ 错误：滥用 !important
// .btn { color: red !important; }
// .btn-primary { color: blue !important; }  // 军备竞赛开始

// ✅ 正确：使用 @layer 控制优先级
// @layer base, components, utilities;
// @layer utilities { .text-red { color: red; } }

// ==========================================
// 示例 7：常见布局陷阱与解决方案
// 使用场景：解决前端开发中最常见的布局 bug
// ==========================================

// ✅ 陷阱 1：margin 折叠（Margin Collapse）
// 相邻块级元素的上下 margin 会合并，取较大值
// 父元素和第一个/最后一个子元素的 margin 也会折叠

function demoMarginCollapse(): void {
  // 问题：两个 div，各设置 margin: 20px 0，它们之间间距不是 40px 而是 20px
  // 解决方式：
  // 1. 改用 padding
  // 2. 使用 Flex/Grid 布局（Flex/Grid 子元素不折叠 margin）
  // 3. 创建 BFC 隔离
  // 4. 使用 gap 属性替代 margin

  console.log('margin 折叠仅在块级元素上下 margin 之间发生');
  console.log('左右 margin、浮动/绝对定位元素、Flex/Grid 子元素永不折叠');
}

// ✅ 陷阱 2：BFC（Block Formatting Context）—— 块级格式化上下文
// BFC 是一个独立的渲染区域，内部布局不影响外部

function createBFC(element: HTMLElement): void {
  // 以下任一方式可创建 BFC：
  // element.style.overflow = 'hidden';         // 最常用
  // element.style.display = 'flow-root';       // 现代推荐方式
  // element.style.position = 'absolute';
  // element.style.float = 'left';
  // element.style.contain = 'layout';

  element.style.display = 'flow-root'; // 无副作用的 BFC 创建方式
}

// BFC 解决的问题：
// 1. 清除浮动（替代 clearfix hack）
// 2. 阻止 margin 折叠
// 3. 防止文字环绕浮动元素

// ✅ 陷阱 3：z-index 层叠上下文
// z-index 不是全局的！它相对于最近的层叠上下文祖先

interface StackingContext {
  element: string;
  zIndex: number;
  contextCreator: string; // 创建层叠上下文的祖先
}

function explainZIndex(): StackingContext[] {
  // 以下属性会创建新的层叠上下文：
  // - position: relative/absolute/fixed/sticky + z-index ≠ auto
  // - opacity < 1
  // - transform ≠ none
  // - filter ≠ none
  // - isolation: isolate（专门用于创建层叠上下文）
  // - will-change: transform, opacity 等

  return [
    {
      element: '.modal',
      zIndex: 9999,
      contextCreator: 'body（根层叠上下文）',
    },
    {
      element: '.modal-inner > .tooltip',
      zIndex: 999999,
      contextCreator: '.modal（position: fixed + z-index: 100）',
    },
    // .tooltip 的 z-index: 999999 只在 .modal 内部有效！
    // 如果 .modal 的 z-index 是 100，另一个元素 .sidebar 的 z-index 是 101，
    // .tooltip 依然在 .sidebar 下层
  ];
}

// ❌ z-index 常见误解：以为 z-index 是全局的
// .popup { z-index: 999999; }  // 如果父级层叠上下文较低，依然被遮挡
// ✅ 正确：检查完整的层叠上下文链，而非盲目增大数值

// ==========================================
// 示例 8：CSS 性能优化
// 使用场景：大数据列表、动画、高性能交互页面
// ==========================================

/**
 * 浏览器渲染流水线：
 * JavaScript → Style（计算样式）→ Layout（布局/重排）→ Paint（绘制）→ Composite（合成）
 *
 * 性能成本：Layout > Paint > Composite
 */

// ✅ 仅触发 Composite 的属性（最便宜，适合动画）
const compositeOnlyProperties = [
  'transform',     // translate / rotate / scale
  'opacity',
  // will-change 提示浏览器提前优化
] as const;

// ✅ 触发 Paint 但不触发 Layout 的属性（中等开销）
const paintProperties = [
  'color',
  'background',
  'box-shadow',
  'border-radius',
  'visibility',
] as const;

// ✅ 触发 Layout（重排）的属性（最昂贵，避免在动画中使用）
const layoutProperties = [
  'width', 'height',
  'padding', 'margin',
  'top', 'left', 'right', 'bottom',
  'font-size',
  'display',
] as const;

// ✅ 用 transform 代替 left/top 做动画
function animateWithTransform(el: HTMLElement, x: number, y: number): void {
  // ❌ 避免：el.style.left = `${x}px`; // 触发 Layout
  // ✅ 推荐：使用 transform 只触发 Composite
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  // translate3d 而非 translate：显式开启 GPU 合成层
}

// ✅ will-change：提前告知浏览器该属性会变化
function prepareForAnimation(el: HTMLElement): () => void {
  el.style.willChange = 'transform, opacity';

  // 返回清理函数：动画结束后移除 will-change
  // 否则 will-change 会持续占用额外内存来维护合成层，可能导致内存压力
  return () => {
    el.style.willChange = 'auto';
  };
}

// ✅ 批量 DOM 操作避免多次重排
function batchDOMUpdates(container: HTMLElement, items: string[]): void {
  // ❌ 错误：每次 appendChild 都可能触发重排
  // items.forEach(text => {
  //   const p = document.createElement('p');
  //   p.textContent = text;
  //   container.appendChild(p);
  // });

  // ✅ 正确：使用 DocumentFragment 批量插入
  const fragment = document.createDocumentFragment();
  for (const text of items) {
    const p = document.createElement('p');
    p.textContent = text;
    fragment.appendChild(p);
  }
  container.appendChild(fragment); // 一次性插入，只触发一次重排
}

// ✅ requestAnimationFrame 优化动画
function smoothAnimation(
  el: HTMLElement,
  from: number,
  to: number,
  duration: number,
): void {
  const start = performance.now();

  function tick(now: number): void {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);

    // 缓动函数（ease-out）
    const eased = 1 - (1 - progress) ** 3;
    const current = from + (to - from) * eased;

    el.style.transform = `translateX(${current}px)`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

// ==========================================
// 与 Vue 的映射：scoped 样式底层原理、:deep()、v-bind()
// ==========================================

/**
 * scoped 原理：
 * Vue 为组件根元素添加唯一的 data 属性（如 data-v-7ba5bd90），
 * 并将组件内所有 CSS 选择器追加 [data-v-7ba5bd90] 属性选择器。
 * 这不是 Shadow DOM！它只是通过属性选择器模拟样式隔离。
 *
 * .title { color: red; }         →  .title[data-v-7ba5bd90] { color: red; }
 * .parent > .child { ... }       →  .parent[data-v-7ba5bd90] > .child { ... }
 *
 * :deep() 穿透子组件：
 * :deep(.el-input__inner) { ... } → .parent[data-v-7ba5bd90] .el-input__inner { ... }
 *
 * v-bind() in CSS（Vue 3.3+）：
 * <script setup>
 * const color = ref('red');
 * </script>
 * <style>
 * .text { color: v-bind(color); }
 * </style>
 * // 编译后通过 CSS 变量实现：
 * // .text { color: var(--hash-color); }
 * // 元素上内联：style="--hash-color: red"
 *
 * 这与我们示例 5 中的 applyDesignTokens 原理一致：
 * Vue 的 v-bind() in CSS 底层就是 setProperty！
 */

// ==========================================
// 浏览器控制台可执行示例
// ==========================================
// 以下代码可直接在浏览器 DevTools Console 中粘贴执行：

/*
// 1. 盒模型检测
const box = document.createElement('div');
box.style.width = '200px';
box.style.padding = '20px';
box.style.border = '5px solid black';
box.textContent = '盒模型测试';
document.body.appendChild(box);
console.log('content-box 实际宽度:', box.getBoundingClientRect().width); // 250px

box.style.boxSizing = 'border-box';
console.log('border-box 实际宽度:', box.getBoundingClientRect().width); // 200px

// 2. 响应式检测
console.table(checkMediaQueries());

// 3. CSS 变量读写
document.documentElement.style.setProperty('--test-color', '#ff6600');
console.log('CSS 变量值:', getComputedStyle(document.documentElement).getPropertyValue('--test-color'));
// 输出: '#ff6600'
*/

// ==========================================
// 本章小结
// ==========================================
// 1. border-box 让 width 包含 padding+border，避免尺寸计算混乱
// 2. Flexbox 一维布局，Grid 二维布局；gap 替代 margin 间距
// 3. clamp()/min()/max() 实现无断点流体响应式；@container 实现组件级响应式
// 4. CSS 变量通过 setProperty/getPropertyValue 与 TS 双向同步，是设计 Token 的桥梁
// 5. 优先级 (a,b,c,d)；避免 !important 军备竞赛，善用 @layer
// 6. margin 折叠仅垂直方向块级元素；BFC 隔离；z-index 受层叠上下文限制
// 7. 动画用 transform+opacity（仅 Composite），避免修改宽高（触发 Layout）
// 8. Vue scoped 原理是属性选择器（非 Shadow DOM），v-bind() in CSS 底层是 CSS 变量
