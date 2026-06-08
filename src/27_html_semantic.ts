/**
 * 学习目标：
 * 1. 语义化标签：header、nav、main、article、section、aside、footer
 * 2. 表单元素：input 类型（email、tel、date、range）、datalist、fieldset
 * 3. 无障碍：ARIA 属性（role、aria-label、aria-hidden）、键盘导航 tabindex
 * 4. SEO 基础：meta 标签（viewport、description、og:）、结构化数据（JSON-LD）
 * 5. 模板元素：template 标签与 Vue 编译的关联
 * 6. Shadow DOM 与 Web Components 的类型（Vue scoped ≠ Shadow DOM）
 * 7. 资源加载：script async/defer、preload、prefetch、module 类型
 * 8. 与 TS 的映射：DOM 类型层级（EventTarget → Node → Element → HTMLElement → HTMLInputElement）
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python：HTML 语义化在全栈模板（Jinja2/Django Template）中同样重要
 * - Java：JSP/Thymeleaf 模板中也有语义化概念，Spring Boot 项目需关注 SEO
 * - Rust：Yew/Leptos 框架中用 Rust 描述 HTML 结构，语义化标签选择同样重要
 */

// ==========================================
// 示例 1：语义化标签 —— 从 div 地狱到结构化文档
// 使用场景：页面骨架搭建、SEO 优化、可访问性增强
// ==========================================

/**
 * 语义化标签对照表：
 * <header>  — 页面头部 / 文章头部（可多次使用）
 * <nav>     — 主导航链接
 * <main>    — 页面主体内容（每页仅一个）
 * <article> — 独立完整的内容块（博客文章、新闻、评论）
 * <section> — 文档中的通用章节（通常带标题）
 * <aside>   — 侧边栏 / 补充内容（广告、相关链接）
 * <footer>  — 页面底部 / 文章底部
 */

// ✅ TS 中类型安全地创建语义化文档结构
interface PageStructure {
  header: HTMLElement;
  nav: HTMLElement;
  main: HTMLElement;
  article: HTMLElement;
  aside: HTMLElement;
  footer: HTMLElement;
}

function createSemanticPage(root: HTMLElement): PageStructure {
  // 使用正确的语义标签而非 <div> 堆砌
  const header = document.createElement('header');
  // 注：<header>（页面级）、<main>、<footer>（页面级）在 HTML5 中已隐式携带
  // 对应 landmark role（banner / main / contentinfo），显式设置 role 是冗余的。
  // 这里保留 setAttribute 主要用于兼容旧版屏幕阅读器（JAWS < 18 等）。
  header.setAttribute('role', 'banner');

  const nav = document.createElement('nav');
  // <nav> 在大多数浏览器中有隐式 navigation role，但 aria-label 有助于区分多个导航
  nav.setAttribute('aria-label', '主导航');

  const main = document.createElement('main');
  main.setAttribute('role', 'main');

  const article = document.createElement('article');

  const aside = document.createElement('aside');
  aside.setAttribute('aria-label', '侧边栏');

  const footer = document.createElement('footer');
  footer.setAttribute('role', 'contentinfo');

  // 组装页面结构
  main.appendChild(article);
  main.appendChild(aside);

  root.appendChild(header);
  root.appendChild(nav);
  root.appendChild(main);
  root.appendChild(footer);

  return { header, nav, main, article, aside, footer };
}

// ✅ 语义化 vs 非语义化对比
const semanticHierarchy = {
  bad: '<div class="header">...</div><div class="nav">...</div>...',
  good: '<header>...</header><nav>...</nav><main>...</main>...',
  // 好处：
  // 1. 屏幕阅读器可识别文档结构，直接跳转到 <main> 内容
  // 2. 搜索引擎更准确理解页面内容权重
  // 3. 开发者读代码更快理解结构
  // 4. 键盘导航自动支持（<nav> 内的链接可通过 role 快速定位）
} as const;

// ✅ <article> vs <section> 的区分
// <article>：内容可独立分发（RSS 提取整篇文章）
// <section>：文档结构分区（没有独立意义）

// 例子：
// <article>  ← 一篇博客文章
//   <header>文章标题</header>
//   <section>  ← 文章的第一小节
//     <h2>小节标题</h2>
//     <p>内容...</p>
//   </section>
// </article>

// ==========================================
// 示例 2：表单元素 —— 类型安全的表单构建
// 使用场景：注册/登录、数据录入、搜索过滤
// ==========================================

// ✅ input type 与 TS 类型映射
// 注意：HTMLInputElement['type'] 在 TS DOM lib 中定义为 string（非联合类型），
// 因为 DOM 规范允许浏览器支持自定义 type。需要手动定义联合类型才能获得精确提示。
type InputType =
  | 'text' | 'password' | 'email' | 'tel' | 'url' | 'search'
  | 'number' | 'range'
  | 'date' | 'time' | 'datetime-local' | 'month' | 'week'
  | 'checkbox' | 'radio' | 'file' | 'color'
  | 'submit' | 'reset' | 'button' | 'image' | 'hidden';

interface FormFieldConfig {
  name: string;
  type: InputType; // 使用手动维护的联合类型，而非 HTMLInputElement['type']
  label: string;
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  min?: number | string;
  max?: number | string;
  options?: string[]; // 用于 datalist
}

function createFormField(config: FormFieldConfig): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const label = document.createElement('label');
  label.textContent = config.label;
  label.htmlFor = config.name;

  const input = document.createElement('input');
  input.type = config.type;
  input.name = config.name;
  input.id = config.name;
  if (config.required) input.required = true;
  if (config.placeholder) input.placeholder = config.placeholder;
  if (config.pattern) input.pattern = config.pattern;

  wrapper.appendChild(label);
  wrapper.appendChild(input);

  // datalist 绑定
  if (config.options && config.options.length > 0) {
    const datalist = document.createElement('datalist');
    datalist.id = `${config.name}-list`;
    for (const option of config.options) {
      const opt = document.createElement('option');
      opt.value = option;
      datalist.appendChild(opt);
    }
    input.setAttribute('list', datalist.id);
    wrapper.appendChild(datalist);
  }

  return wrapper;
}

// ✅ HTML5 input 类型全景（配合 TS 类型收窄）
// InputType 已在文件开头定义（行 111），此处直接使用
type InputTypeFull = InputType; // 仅为阅读方便重导出

// 'invalid-type' 不是合法的 input type，编译时报错
// @ts-expect-error —— Type '"invalid-type"' is not assignable to type 'InputType'
const badInput: InputType = 'invalid-type';
void badInput;

const inputTypeCategories: Record<string, InputType[]> = {
  文本类: ['text', 'password', 'email', 'tel', 'url', 'search'],
  数值类: ['number', 'range'],
  日期类: ['date', 'time', 'datetime-local', 'month', 'week'],
  选择类: ['checkbox', 'radio', 'file', 'color'],
  按钮类: ['submit', 'reset', 'button', 'image'],
  特殊: ['hidden'],
} as const;

// ✅ 移动端友好的 input 属性
// <input type="email" inputmode="email" autocomplete="email">
// <input type="tel" inputmode="numeric" autocomplete="tel">
// <input type="number" inputmode="decimal">
// type 控制验证规则，inputmode 控制弹出键盘类型

// ✅ fieldset + legend —— 表单分组
function createFormSection(
  legend: string,
  fields: FormFieldConfig[],
): HTMLFieldSetElement {
  const fieldset = document.createElement('fieldset');

  const legendEl = document.createElement('legend');
  legendEl.textContent = legend;
  fieldset.appendChild(legendEl);

  for (const config of fields) {
    fieldset.appendChild(createFormField(config));
  }

  return fieldset;
}

// Vue 中对应：
// v-model 自动根据 input type 处理不同类型的数据绑定
// <input v-model="email" type="email"> → email 为 string
// <input v-model="age" type="number" .number> → age 为 number
// <input v-model="agree" type="checkbox" true-value="yes"> → agree 为 'yes' | undefined

// ==========================================
// 示例 3：无障碍（Accessibility / A11Y）
// 使用场景：政府/企业级应用、国际化产品、包容性设计
// ==========================================

/**
 * ARIA（Accessible Rich Internet Applications）属性
 * 用于增强 HTML 元素的可访问性信息，供屏幕阅读器理解
 */

// ✅ 常用 ARIA 属性详解
// 使用映射类型保留每个属性的精确类型（boolean vs string），而非统一为 string | boolean
type AriaAttrsMap = {
  'role': string;              // 元素角色（button、dialog、tabpanel 等）
  'aria-label': string;        // 可访问名称（覆盖元素文本）
  'aria-labelledby': string;   // 引用其他元素作为标签（元素 ID）
  'aria-describedby': string;  // 引用描述性文本（元素 ID）
  'aria-hidden': boolean;      // 对辅助技术隐藏
  'aria-expanded': boolean;    // 可展开控件状态
  'aria-current': string;      // 当前页面/步骤标识
  'aria-live': string;         // 动态内容更新通知（polite/assertive）
  'aria-atomic': boolean;      // 是否播报整个区域
};

// ✅ TS 中辅助设置 ARIA 属性（类型精确到每个属性的具体值类型）
function setAriaAttrs<K extends keyof AriaAttrsMap>(
  element: HTMLElement,
  attrs: Partial<{ [P in K]: AriaAttrsMap[P] }>,
): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false) {
      // false 时移除属性（而非设置 aria-hidden="false"）
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, String(value));
    }
  }
}

// ✅ 常见无障碍模式的 TS 实现
function setupAccessiblePatterns(): void {
  // 1. 隐藏的跳过导航链接（Skip Link）
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = '跳到主要内容';
  document.body.prepend(skipLink);

  // 2. 模态对话框的无障碍处理
  function showModal(modal: HTMLElement): void {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'false');

    // 焦点管理：将焦点移到对话框
    const firstFocusable = modal.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    // 焦点陷阱：Tab 在对话框内循环
    modal.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      // 实现焦点循环逻辑...
    });
  }

  function hideModal(modal: HTMLElement): void {
    modal.setAttribute('aria-hidden', 'true');
    // 恢复焦点到触发元素
  }

  // 3. ARIA live region —— 动态内容通知
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only'; // 视觉隐藏但屏幕阅读器可读
  document.body.appendChild(liveRegion);

  // 更新内容时屏幕阅读器自动播报
  // liveRegion.textContent = '搜索到 5 条结果';
}

// ✅ tabindex 键盘导航
function setupKeyboardNavigation(): void {
  const tabindexRules = {
    '-1': '可编程聚焦但 Tab 键跳过（用于焦点管理）',
    '0': '按 DOM 顺序加入 Tab 序列（推荐）',
    '大于0': '自定义 Tab 顺序（不推荐，维护困难）',
  } as const;

  // 推荐做法：使用语义标签 + tabindex="0"，让浏览器按 DOM 顺序处理
  // 避免 tabindex > 0 的自定义顺序

  // 键盘事件处理模式
  function handleKeyNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    switch (event.key) {
      case 'ArrowDown':
        // 聚焦下一个列表项
        focusNextSibling(target);
        event.preventDefault();
        break;
      case 'ArrowUp':
        focusPreviousSibling(target);
        event.preventDefault();
        break;
      case 'Home':
        focusFirstSibling(target);
        event.preventDefault();
        break;
      case 'End':
        focusLastSibling(target);
        event.preventDefault();
        break;
      case 'Escape':
        // 关闭弹窗、取消编辑等
        target.blur();
        event.preventDefault();
        break;
    }
  }
}

// 辅助聚焦函数
function focusNextSibling(el: HTMLElement): void {
  const next = el.nextElementSibling as HTMLElement | null;
  next?.focus();
}

function focusPreviousSibling(el: HTMLElement): void {
  const prev = el.previousElementSibling as HTMLElement | null;
  prev?.focus();
}

function focusFirstSibling(el: HTMLElement): void {
  const first = el.parentElement?.firstElementChild as HTMLElement | null;
  first?.focus();
}

function focusLastSibling(el: HTMLElement): void {
  const last = el.parentElement?.lastElementChild as HTMLElement | null;
  last?.focus();
}

// 与 Vue 的映射：
// Vue 的 <FocusTrap> 或第三方库 vue-focus-lock
// @keydown.esc = "closeModal"
// @keydown.tab = "handleTabTrap"

// ==========================================
// ❌ 常见错误 1：querySelector 返回 null 未处理（无障碍场景）
// ==========================================

// ❌ 无障碍实践中常见的空值问题
function badAccessibilitySetup(): void {
  // 错误：元素不存在时非空断言会导致运行时崩溃
  // @ts-expect-error —— querySelector 返回 HTMLElement | null，不能直接调用 setAttribute
  document.querySelector<HTMLElement>('#modal').setAttribute('aria-hidden', 'true');
  // TS 报错：Object is possibly 'null'，直接忽略会导致运行时崩溃

  // ✅ 正确：先判断
  const modal = document.querySelector<HTMLElement>('#modal');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
  } else {
    console.warn('#modal 元素不存在，跳过无障碍设置');
  }
}

// ==========================================
// 示例 4：SEO 基础 —— meta 标签与结构化数据
// 使用场景：SSR/SSG 应用的 SEO 优化、社交媒体分享预览
// ==========================================

// ✅ 编程式创建 SEO 友好的 meta 标签
interface SEOMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app';
  canonical?: string;
  robots?: string;
}

function applySEOMeta(meta: SEOMeta, doc: Document = document): void {
  // 页面标题
  doc.title = meta.title;

  // 通用 meta
  setOrCreateMeta(doc, 'description', meta.description);
  if (meta.keywords?.length) {
    setOrCreateMeta(doc, 'keywords', meta.keywords.join(', '));
  }
  setOrCreateMeta(doc, 'robots', meta.robots ?? 'index, follow');

  // Open Graph（Facebook / LinkedIn 等社交分享）
  setOrCreateMeta(doc, 'og:title', meta.ogTitle ?? meta.title, 'property');
  setOrCreateMeta(doc, 'og:description', meta.ogDescription ?? meta.description, 'property');
  if (meta.ogImage) setOrCreateMeta(doc, 'og:image', meta.ogImage, 'property');
  if (meta.ogUrl) setOrCreateMeta(doc, 'og:url', meta.ogUrl, 'property');
  if (meta.ogType) setOrCreateMeta(doc, 'og:type', meta.ogType, 'property');

  // Twitter Card
  if (meta.twitterCard) {
    setOrCreateMeta(doc, 'twitter:card', meta.twitterCard);
  }

  // Canonical URL（规范链接，避免重复内容惩罚）
  if (meta.canonical) {
    setOrCreateLink(doc, 'canonical', meta.canonical);
  }
}

function setOrCreateMeta(
  doc: Document,
  name: string,
  content: string,
  attrName: 'name' | 'property' = 'name',
): void {
  let meta = doc.querySelector<HTMLMetaElement>(`meta[${attrName}="${name}"]`);
  if (!meta) {
    meta = doc.createElement('meta');
    meta.setAttribute(attrName, name);
    doc.head.appendChild(meta);
  }
  meta.content = content;
}

function setOrCreateLink(doc: Document, rel: string, href: string): void {
  let link = doc.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = doc.createElement('link');
    link.rel = rel;
    doc.head.appendChild(link);
  }
  link.href = href;
}

// ✅ JSON-LD 结构化数据（搜索引擎最推荐的方式）
interface BlogPostingStructuredData {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  author: { '@type': 'Person'; name: string };
  datePublished: string;
  dateModified?: string;
  image?: string;
  publisher: { '@type': 'Organization'; name: string; logo?: { '@type': 'ImageObject'; url: string } };
}

function injectJSONLD(data: Record<string, unknown>): void {
  // 移除所有已有的 JSON-LD 脚本（可能有多个：文章 + 面包屑 + 组织信息等）
  document.querySelectorAll('script[type="application/ld+json"]')
    .forEach((el) => el.remove());

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// 使用示例：
const blogLD: BlogPostingStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'TypeScript 浏览器 API 完全指南',
  description: '深入理解 DOM、事件模型、浏览器 API 与全栈联调',
  author: { '@type': 'Person', name: '开发者' },
  datePublished: '2026-06-08',
  publisher: { '@type': 'Organization', name: 'Dev Blog' },
};
// injectJSONLD(blogLD);

// 与 Vue 的映射：
// Nuxt 的 useSeoMeta() / useServerSeoMeta() 底层就是操作 meta 标签
// Vue Router 的路由 meta 配合 @unhead/vue 自动管理 SEO
// definePageMeta({ title: '关于我们', description: '...' })

// ==========================================
// 示例 5：template 标签与 Vue 编译的关联
// 使用场景：客户端模板、动态列表渲染、Vue 编译目标
// ==========================================

function demoTemplateTag(): void {
  // <template> 标签内容不会被渲染，其子节点可被克隆使用
  const template = document.querySelector<HTMLTemplateElement>('#list-item-template');

  if (template?.content) {
    // template.content 类型为 DocumentFragment
    const items = ['苹果', '香蕉', '橘子'];

    for (const item of items) {
      // 深克隆模板内容
      const clone = template.content.cloneNode(true) as DocumentFragment;
      const textEl = clone.querySelector<HTMLElement>('.item-text');
      if (textEl) textEl.textContent = item;

      document.body.appendChild(clone);
    }
  }
}

/**
 * Vue 模板编译与 <template>：
 *
 * Vue SFC 的 <template> 块在编译时转为 render 函数，不依赖
 * 浏览器原生 <template> 标签。但理解原生 template 有助于理解：
 *
 * 1. v-if / v-for 是如何通过创建/销毁 DOM 节点实现的
 * 2. Vue 的 <template> 作为虚拟容器（不渲染）的概念来源
 * 3. 为什么 <script setup> 可以和 <template> 并存（SFC 编译器解析，非浏览器行为）
 *
 * 全栈开发中何时用到：
 * - 后端渲染 HTML 片段（HTMX、Turbo 等）
 * - 微前端中动态加载子应用模板
 * - Web Components 的 template + slot 模式
 */

// ==========================================
// 示例 6：Shadow DOM 与 Web Components 的类型
// 使用场景：微前端隔离、第三方 Widget、设计系统组件库
// ==========================================

/**
 * Vue scoped 样式 ≠ Shadow DOM
 *
 * Vue scoped：通过属性选择器 [data-v-xxxx] 模拟隔离
 * Shadow DOM：浏览器原生封闭的 DOM 子树
 */

function createWebComponent(): void {
  // ✅ 创建自定义元素（Web Component）
  class UserCard extends HTMLElement {
    // Shadow DOM 的根节点
    private shadow: ShadowRoot;

    constructor() {
      super();
      // mode: 'open' 允许外部通过 element.shadowRoot 访问
      this.shadow = this.attachShadow({ mode: 'open' });
    }

    // 元素挂载到 DOM 时触发
    connectedCallback(): void {
      this.render();
    }

    // 监听的属性列表
    static get observedAttributes(): string[] {
      return ['name', 'avatar'];
    }

    // 属性变化时触发
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
      if (oldValue !== newValue) {
        this.render();
      }
    }

    private render(): void {
      const name = this.getAttribute('name') ?? '未知用户';
      const avatar = this.getAttribute('avatar') ?? '';

      this.shadow.innerHTML = `
        <style>
          /* Shadow DOM 内的样式完全隔离，不受外部 CSS 影响！ */
          .card {
            display: flex; align-items: center; gap: 12px;
            padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;
            font-family: sans-serif;
          }
          .avatar { width: 48px; height: 48px; border-radius: 50%; background: #e0e0e0; }
          .name { font-weight: 600; }
        </style>
        <div class="card">
          <img class="avatar" src="${avatar}" alt="${name}" />
          <span class="name">${name}</span>
          <slot name="actions"></slot>
        </div>
      `;
    }
  }

  // 注册自定义元素（名称必须包含连字符）
  if (!customElements.get('user-card')) {
    customElements.define('user-card', UserCard);
  }
}

// 使用：<user-card name="张三" avatar="/avatar.png"></user-card>

// Shadow DOM 与 Vue 的关键区别：
// 1. Shadow DOM 样式真正隔离（内部不感染外部，外部不穿透内部）
//    Vue scoped 只是通过属性选择器增加优先级
// 2. Shadow DOM 的事件在边界处被重定向（event.target 指向 host 元素）
//    Vue 的事件模型无此行为
// 3. Shadow DOM 使用 <slot> 分发内容，Vue 也有 <slot>（编译时处理）
// 4. Vue 的 :deep() 穿透 scoped；Shadow DOM 用 ::part() 或 CSS 自定义属性穿透

// ==========================================
// 示例 7：资源加载 —— async、defer、preload、prefetch、module
// 使用场景：首屏性能优化、代码分割、第三方脚本集成
// ==========================================

/**
 * <script> 加载策略：
 *
 * 普通 <script>：
 *   ── 下载 ── 执行 ── 继续解析 HTML ──
 *               阻塞 HTML 解析！
 *
 * <script defer>：
 *   ── 并行下载 ── HTML 解析完毕 ── 按顺序执行 ──
 *
 * <script async>：
 *   ── 并行下载 ── 下载完立即执行（可能打断 HTML 解析）──
 *
 * <script type="module">：
 *   默认行为等同于 defer（并行下载，解析完执行）
 */

// ✅ TS 中动态控制资源加载
type ScriptLoadStrategy = 'async' | 'defer' | 'module' | 'sync';

function loadScript(src: string, strategy: ScriptLoadStrategy): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;

    switch (strategy) {
      case 'async':
        script.async = true;
        break;
      case 'defer':
        script.defer = true;
        break;
      case 'module':
        script.type = 'module';
        // module 默认 defer，不需要再设
        break;
      case 'sync':
        // 不设 async/defer，阻塞执行
        break;
    }

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载失败: ${src}`));
    document.head.appendChild(script);
  });
}

// ✅ preload / prefetch / preconnect 资源预加载
function applyResourceHints(): void {
  const hints = [
    // preload：当前页面必需的资源，尽早加载（高优先级）
    { rel: 'preload', href: '/fonts/main.woff2', as: 'font', crossorigin: 'anonymous' },
    { rel: 'preload', href: '/hero-image.webp', as: 'image' },

    // prefetch：下个页面可能用到的资源（低优先级，空闲时加载）
    { rel: 'prefetch', href: '/page2.js', as: 'script' },

    // preconnect：提前建立连接（DNS + TCP + TLS）
    { rel: 'preconnect', href: 'https://api.example.com' },

    // dns-prefetch：仅提前 DNS 解析
    { rel: 'dns-prefetch', href: 'https://cdn.example.com' },
  ] as const;

  for (const hint of hints) {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if ('as' in hint) link.setAttribute('as', hint.as);
    if ('crossorigin' in hint) link.crossOrigin = hint.crossorigin;
    document.head.appendChild(link);
  }
}

// ✅ 动态 import() —— 代码分割
async function lazyLoad(): Promise<void> {
  // ES 动态 import，Webpack/Vite 自动识别为分割点
  // @ts-expect-error —— 动态导入路径仅作演示，模块文件不存在
  const { heavyFunction } = await import('./heavy-module.js');
  heavyFunction();
}

// Vue 中对应：
// defineAsyncComponent(() => import('./HeavyComponent.vue'))
// const routes = [{ path: '/admin', component: () => import('./Admin.vue') }]
// Vue Router 的懒加载本质上就是动态 import()

// ==========================================
// 示例 8：DOM 类型层级 —— 理解 TS 的 DOM 类型系统
// 使用场景：编写类型安全的 DOM 操作代码、理解泛型约束
// ==========================================

/**
 * DOM 类型继承链（从通用到具体）：
 *
 * EventTarget      ← 所有可接收事件的对象的基类
 *   ├── Node       ← DOM 节点的基类（拥有 parentNode、childNodes 等）
 *   │   ├── Document
 *   │   ├── DocumentFragment
 *   │   ├── Attr
 *   │   └── Element  ← 所有 HTML/SVG 元素的基类
 *   │       ├── HTMLElement  ← 所有 HTML 元素的基础类型
 *   │       │   ├── HTMLDivElement
 *   │       │   ├── HTMLSpanElement
 *   │       │   ├── HTMLInputElement  ← 拥有 value、checked、type 等
 *   │       │   ├── HTMLButtonElement
 *   │       │   ├── HTMLAnchorElement ← 拥有 href、target 等
 *   │       │   ├── HTMLImageElement  ← 拥有 src、alt、naturalWidth 等
 *   │       │   ├── HTMLFormElement   ← 拥有 submit()、reset() 等
 *   │       │   ├── HTMLSelectElement ← 拥有 options、selectedIndex 等
 *   │       │   ├── HTMLCanvasElement
 *   │       │   ├── HTMLVideoElement / HTMLAudioElement ← HTMLMediaElement 子类
 *   │       │   └── ... 更多具体类型
 *   │       ├── SVGElement
 *   │       └── MathMLElement
 *   └── ...
 */

// ✅ 类型层级在实践中的应用
function demoDOMTypeHierarchy(): void {
  // 1. querySelector 默认返回 Element（不够精确）
  const generic = document.querySelector('.something');
  // generic 类型为 Element | null，无法访问 .value

  // 2. 泛型指定后，返回具体类型
  const input = document.querySelector<HTMLInputElement>('input[name="email"]');
  if (input) {
    input.value = 'test@example.com'; // ✅ HTMLInputElement 有 value 属性
    input.type = 'email';             // ✅ 也有 type 属性
  }

  // 3. querySelectorAll 返回 NodeListOf<T>
  const images = document.querySelectorAll<HTMLImageElement>('img');
  images.forEach((img) => {
    console.log(img.src);       // ✅ HTMLImageElement 有 src
    console.log(img.naturalWidth); // ✅ 还有图片特有属性
  });

  // 4. Node vs Element 的区别
  const container = document.querySelector<HTMLElement>('#container');
  if (container) {
    // childNodes：包含所有子节点（文本节点、注释节点、元素节点）
    const allNodes = container.childNodes; // NodeListOf<ChildNode>
    console.log('子节点总数（含文本注释）:', allNodes.length);

    // children：仅包含元素子节点
    const onlyElements = container.children; // HTMLCollection
    console.log('子元素数量:', onlyElements.length);
  }

  // 5. 事件目标类型收窄
  document.addEventListener('input', (event: Event) => {
    // event.target 类型为 EventTarget | null，太宽泛
    const target = event.target;

    // 通过 instanceof 进行类型收窄
    if (target instanceof HTMLInputElement) {
      console.log('输入值:', target.value); // ✅ 类型安全
    } else if (target instanceof HTMLSelectElement) {
      console.log('选中值:', target.value);
    }
  });
}

// ✅ 自定义 Web Component 的类型声明
// 在 declarations.d.ts 中或组件文件中声明
declare global {
  interface HTMLElementTagNameMap {
    'user-card': HTMLElement & { name: string; avatar: string };
  }
}

// 之后使用时获得完整类型：
const userCard = document.querySelector<HTMLElement>('user-card');
// 或直接使用：
// const userCard = document.createElement('user-card');

// ==========================================
// ❌ 常见错误 2：事件委托类型断言错误（HTML 语义化场景）
// ==========================================

// ❌ 语义化标签下的类型断言陷阱
function badSemanticDelegation(): void {
  const nav = document.querySelector<HTMLElement>('nav');
  if (!nav) return;

  // 错误方式：直接断言 event.target 为 HTMLAnchorElement
  // event.target 类型是 EventTarget | null，且运行时可能是 <svg> 或 <span> 等非链接元素
  nav.addEventListener('click', (event: MouseEvent) => {
    // @ts-expect-error —— EventTarget | null 不能直接赋值给 HTMLAnchorElement
    const link: HTMLAnchorElement = event.target;
    // 即使类型断言通过编译，如果用户点击的是菜单图标 <svg>，
    // link.href 也会是 undefined（<svg> 没有 href 属性）
    console.log('导航到:', link.href);
  });

  // ✅ 正确：使用 closest 向上查找锚点元素
  nav.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>('a[href]');
    if (link) {
      console.log('导航到:', link.href);
      // 可选：SPA 中阻止默认行为并调用 router.push
      // event.preventDefault();
      // router.push(link.href);
    }
  });
}

// ==========================================
// 浏览器控制台可执行示例
// ==========================================
// 以下代码可直接在浏览器 DevTools Console 中粘贴执行：

/*
// 1. 查看页面语义化结构
const landmarks: Record<string, number> = {};
for (const tag of ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer']) {
  landmarks[tag] = document.querySelectorAll(tag).length;
}
console.table(landmarks);

// 2. 动态创建语义化表单
const form = document.createElement('form');
form.innerHTML = `
  <fieldset>
    <legend>个人信息</legend>
    <label>邮箱: <input type="email" name="email" required></label>
    <label>电话: <input type="tel" name="phone" pattern="[0-9]{11}"></label>
  </fieldset>
  <button type="submit">提交</button>
`;
document.body.appendChild(form);

// 3. 查看 DOM 类型层级
const el = document.querySelector('input');
if (el) {
  console.log('实例链:');
  let proto = Object.getPrototypeOf(el);
  while (proto) {
    console.log(' →', proto.constructor.name);
    proto = Object.getPrototypeOf(proto);
  }
  // 输出: HTMLInputElement → HTMLElement → Element → Node → EventTarget → Object
}

// 4. 检查页面 SEO 信息
console.log('标题:', document.title);
console.log('描述:', document.querySelector('meta[name="description"]')?.getAttribute('content'));
console.log('OG 标题:', document.querySelector('meta[property="og:title"]')?.getAttribute('content'));
console.log('JSON-LD:', document.querySelector('script[type="application/ld+json"]')?.textContent);

// 5. 检测资源加载提示
console.log('Preload:', [...document.querySelectorAll('link[rel="preload"]')].map(l => l.getAttribute('href')));
console.log('Prefetch:', [...document.querySelectorAll('link[rel="prefetch"]')].map(l => l.getAttribute('href')));
*/

// ==========================================
// 本章小结
// ==========================================
// 1. 语义化标签（header/nav/main/article/aside/footer）提升 SEO 和可访问性
// 2. input type 决定虚拟键盘和验证规则；datalist 提供原生自动补全
// 3. ARIA 属性增强屏幕阅读器体验；tabindex="0" 优于自定义顺序；键盘导航必不可少
// 4. meta + Open Graph + JSON-LD 是 SEO 三件套；SSR 框架自动管理
// 5. 原生 <template> 内容不渲染，Vue SFC 的 <template> 是编译时概念
// 6. Shadow DOM 真正隔离样式（::part 穿透），Vue scoped 是属性选择器模拟（:deep 穿透）
// 7. script defer 按序执行；async 乱序执行；module 等同 defer；preload 提升关键资源优先级
// 8. DOM 类型层级：EventTarget → Node → Element → HTMLElement → 具体元素，利用泛型获得精确类型
