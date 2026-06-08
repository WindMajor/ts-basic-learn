/*
 * ============================================================
 * 学习目标
 * ============================================================
 * 理解 JS 面向对象的底层机制（原型链），掌握 `this` 的四种绑定规则，
 * 避免在回调和事件处理中丢失上下文。
 *
 * 为什么 TS 编译时无法发现这些问题？
 * -----------------------------------------------------------
 * TypeScript 可以在函数参数中注解 `this` 类型（如 `function(this: Person)`），
 * 但这只是编译时的静态提示。`this` 的实际值在运行时由调用方式决定——
 * 同样的函数，用 `obj.method()`、`method()`、`method.call(obj)`、`new method()`
 * 调用，this 指向完全不同。TS 无法在编译期预测函数将以何种方式被调用，
 * 因此 this 绑定错误是运行时专属陷阱。
 *
 * 与 TS 类型系统的边界关系
 * -----------------------------------------------------------
 * TS 能做的是：当你写 `obj.method` 时检查 method 是否存在于 obj 的类型中；
 * 在回调参数上标注 `this: void` 表示"调用者不应依赖 this"。
 * TS 做不到的是：阻止你将 `obj.method` 赋值给变量后 this 丢失；
 * 也无法在编译期验证 `call`/`apply` 传入的 thisArg 类型是否匹配。
 * ============================================================
 */

// ============================================================
// 示例 1：原型链的三层结构图解
// ============================================================
// 场景：创建构造函数和实例，理解原型继承
// 预期结果：实例能直接访问构造函数 prototype 上定义的方法
// 实际结果：实例通过 __proto__ 链接到原型，形成链式查找
// 背后的 JS 引擎行为：
//   每个函数（除箭头函数）创建时自动拥有 prototype 属性，指向一个原型对象。
//   该原型对象有一个 constructor 属性指回函数。
//   用 new 调用函数时，创建的新对象其 [[Prototype]]（即 __proto__）
//   指向构造函数的 prototype。属性查找沿 __proto__ 链向上，直到 Object.prototype。

console.log('=== 示例 1: 原型链三层结构 ===');

function Person(this: any, name: string) {
  this.name = name;
}
Person.prototype.greet = function () {
  return `Hello, I'm ${this.name}`;
};

// @ts-expect-error 标注了 this 参数的函数不被 TS 视为构造函数签名，但运行时 new 调用是合法的
const p = new Person('Alice');
console.log('p.name:', p.name);                     // Alice
console.log('p.greet():', p.greet());               // Hello, I'm Alice

// 三层关系验证
console.log('p.__proto__ === Person.prototype:', p.__proto__ === Person.prototype);       // true
console.log('Person.prototype.constructor === Person:', Person.prototype.constructor === Person); // true
console.log('p.__proto__.__proto__ === Object.prototype:', p.__proto__.__proto__ === Object.prototype); // true

// instanceof 检查的是原型链，不是构造函数本身
console.log('p instanceof Person:', p instanceof Person);       // true
console.log('p instanceof Object:', p instanceof Object);       // true

// ============================================================
// 示例 2：ES6 Class 是语法糖
// ============================================================
// 场景：认为 class 引入了全新的面向对象模型
// 预期结果：class 与 Java 的类一样是静态的、封闭的类型定义
// 实际结果：class 完全基于原型链的语法糖，运行时本质不变
// 背后的 JS 引擎行为：
//   class 声明的代码在底层仍被翻译为构造函数 + prototype 赋值。
//   类中定义的方法自动成为原型方法；类字段（ES2022）则直接绑定到实例上。
//   class 体默认在严格模式下执行。

console.log('\n=== 示例 2: ES6 Class 是语法糖 ===');

class Animal {
  species = 'unknown'; // 类字段（ES2022）：直接绑定在实例上

  constructor(public name: string) {}

  speak() {
    return `${this.name} makes a sound`;
  }
}

const dog = new Animal('Buddy');
console.log('dog.name:', dog.name);                 // Buddy
console.log('dog.species:', dog.species);           // unknown
console.log('dog.speak():', dog.speak());           // Buddy makes a sound

// 方法在 prototype 上
console.log('speak on prototype:', 'speak' in Animal.prototype); // true
// 类字段在实例上
console.log('species on prototype:', 'species' in Animal.prototype); // false

// class 默认严格模式
class StrictCheck {
  test() {
    // @ts-ignore 故意测试运行时严格模式行为
    console.log('this in class method:', this);
  }
}
const strictCheck = new StrictCheck();
const extracted = strictCheck.test;
// extracted(); // 严格模式下 this 是 undefined，会报错

// ============================================================
// 示例 3：this 的四种绑定规则（核心）
// ============================================================
// 场景：在不同上下文中调用函数，预期 this 有统一规则
// 实际结果：this 由调用方式决定，共四种绑定规则
// 背后的 JS 引擎行为：
//   1. 默认绑定：独立调用 foo()，非严格模式指向 globalThis，严格模式 undefined
//   2. 隐式绑定：obj.foo()，this 指向 obj（注意：只有调用位置决定）
//   3. 显式绑定：foo.call(obj)、foo.apply(obj)、foo.bind(obj)
//   4. new 绑定：new Foo()，this 指向新创建的实例
//   优先级：new > 显式 > 隐式 > 默认

console.log('\n=== 示例 3: this 的四种绑定规则 ===');

function showThis(this: any) {
  return this;
}

// 1. 默认绑定（在非严格模式模块中运行时可能指向 global，此处用 try-catch 演示）
const globalThisValue = (() => {
  try {
    // @ts-ignore 故意测试默认绑定
    return showThis();
  } catch {
    return 'undefined (strict mode)';
  }
})();
console.log('默认绑定:', globalThisValue);

// 2. 隐式绑定
const context = { name: 'ContextObj', showThis };
console.log('隐式绑定:', context.showThis().name);   // ContextObj

// 3. 显式绑定
const boundObj = { name: 'BoundObj' };
console.log('显式绑定 call:', showThis.call(boundObj).name);   // BoundObj
console.log('显式绑定 apply:', showThis.apply(boundObj).name); // BoundObj
const boundFn = showThis.bind(boundObj);
console.log('显式绑定 bind:', boundFn().name);                 // BoundObj

// 4. new 绑定
function ConstructorThis(this: any) {
  this.label = 'from-new';
}
// @ts-expect-error 与 Person 同理：TS 严格检查与运行时行为不一致
const newInstance = new ConstructorThis();
console.log('new 绑定:', newInstance.label);                    // from-new

// ============================================================
// 示例 4：箭头函数的 this 锁定
// ============================================================
// 场景：在对象方法中使用箭头函数作为回调，期望 this 指向对象
// 预期结果：箭头函数像普通函数一样按调用方式决定 this
// 实际结果：箭头函数没有自己的 this，继承外层词法作用域的 this
// 背后的 JS 引擎行为：
//   箭头函数在定义时捕获其所在上下文的 this 值，写入内部 [[ThisMode]] 为 lexical。
//   因此 call/apply/bind 无法改变箭头函数的 this，new 也无法调用它。

console.log('\n=== 示例 4: 箭头函数的 this 锁定 ===');

const arrowHost = {
  name: 'ArrowHost',
  regular() {
    return this.name;
  },
  arrow: () => {
    // @ts-ignore 箭头函数内访问 this，此处继承的是模块顶层 this（可能为 undefined）
    return (this as any)?.name ?? 'lexical-this';
  },
};

console.log('regular():', arrowHost.regular());     // ArrowHost
console.log('arrow():', arrowHost.arrow());         // lexical-this（或 undefined）

// call/apply 无法改变箭头函数的 this
console.log('arrow.call({name:"X"}):', arrowHost.arrow.call({ name: 'X' })); // lexical-this

// 箭头函数不能作为构造函数
// new (() => {}); // TypeError: 不是构造函数

// ============================================================
// 示例 5：方法提取导致的 this 丢失
// ============================================================
// 场景：将对象方法赋值给变量后调用，或在事件监听中直接传入方法
// 预期结果：this 仍指向原对象
// 实际结果：this 丢失为 undefined（严格模式）或 globalThis（非严格模式）
// 背后的 JS 引擎行为：
//   this 只与"调用位置"有关。`obj.method()` 中 . 左侧是 obj，所以 this=obj。
//   `const fn = obj.method; fn()` 的调用位置是独立调用，应用默认绑定。

console.log('\n=== 示例 5: 方法提取导致 this 丢失 ===');

const user = {
  name: 'Bob',
  greet() {
    return `Hi, ${this.name}`;
  },
};

// this 丢失
const greetFn = user.greet;
try {
  // @ts-ignore 故意测试运行时 this 丢失
  console.log('提取后调用:', greetFn());
} catch (e: any) {
  console.log('提取后调用报错:', e.message); // Cannot read properties of undefined (reading 'name')
}

// 修复 1：箭头函数属性（定义时锁定 this）
const userArrow = {
  name: 'Bob',
  greet: () => {
    // 注意：这个箭头函数的 this 在定义时锁定，但模块顶层 this 可能是 undefined
    // 在对象字面量中，箭头函数不是好的方法定义方式！见错误示例。
    return 'arrow in object literal';
  },
};
console.log('箭头属性:', userArrow.greet());

// 修复 2：bind
const boundGreet = user.greet.bind(user);
console.log('bind 修复:', boundGreet());           // Hi, Bob

// 修复 3：包装箭头函数回调
const wrappedGreet = () => user.greet();
console.log('包装箭头修复:', wrappedGreet());       // Hi, Bob

// ============================================================
// 示例 6：call / apply / bind 的实战用法
// ============================================================
// 场景：需要借用其他对象的方法，或控制 this 指向
// 预期结果：方法必须在定义它的类上调用
// 实际结果：通过 call/apply/bind 可以"借用"方法
// 背后的 JS 引擎行为：
//   函数是独立的一等公民，只要签名兼容，就可以在任何对象上调用。

console.log('\n=== 示例 6: call/apply/bind 实战 ===');

// 类数组转数组（现代用法：Array.from，但老代码常见此技巧）
function argsToArray(this: any, ..._args: any[]) {
  // @ts-ignore 故意演示 arguments 借用
  return Array.prototype.slice.call(arguments);
}
console.log('类数组转数组:', argsToArray(1, 2, 3)); // [1, 2, 3]

// 借用方法求最大值
const nums = [5, 2, 9, 1];
console.log('Math.max.apply:', Math.max.apply(null, nums as any)); // 9
// 现代替代：Math.max(...nums)

// bind 偏函数应用
function multiply(a: number, b: number) {
  return a * b;
}
const double = multiply.bind(null, 2);
console.log('偏函数 double(5):', double(5));       // 10

// ============================================================
// 示例 7：TS 的 this 类型注解 vs 运行时
// ============================================================
// 场景：在 TS 中给函数标注 this 类型，以为运行时也会检查
// 预期结果：TS 报错就能阻止运行时 this 错误
// 实际结果：TS 的 this 注解编译后完全消失，运行时仍可能出错
// 背后的 JS 引擎行为：
//   TS 的 `this: Person` 参数是编译期伪参数，生成 JS 后会被移除。
//   运行时 this 仍由调用方式决定。回调中标注 `this: void` 是告诉调用者
//   "此函数不应依赖 this"，但引擎不会强制执行。

console.log('\n=== 示例 7: TS this 注解 vs 运行时 ===');

interface Person {
  name: string;
}

function greetPerson(this: Person, greeting: string) {
  return `${greeting}, ${this.name}`;
}

// TS 编译时：直接调用 greetPerson('Hi') 会报错，因为缺少 this
// 运行时：编译后的 JS 直接调用它，this 变成 undefined
const compiledGreet = greetPerson;
try {
  // @ts-ignore 故意测试运行时行为
  console.log('运行时直接调用:', compiledGreet('Hi'));
} catch (e: any) {
  console.log('运行时直接调用报错:', e.message);
}

// 正确调用
console.log('显式绑定:', compiledGreet.call({ name: 'TS' }, 'Hi')); // Hi, TS

// 回调中 this: void 的用法
function forEachCallback(this: void, item: string) {
  // TS 允许这样写，表示"不要在此函数中使用 this"
  console.log('  item:', item);
}
['a', 'b'].forEach(forEachCallback);

// ============================================================
// 示例 8：闭包与原型链的结合（模块模式）
// ============================================================
// 场景：对比 TS 的 private 修饰符与真正的运行时私有
// 预期结果：TS private 能在运行时阻止访问
// 实际结果：TS private 只是编译时检查，编译后属性完全可访问
// 背后的 JS 引擎行为：
//   TS 的 `private` 修饰符只在编译期报错，编译后的 JS 中该属性是公开的。
//   闭包私有变量利用函数作用域，外部真正无法直接访问（只能通过暴露的接口）。

console.log('\n=== 示例 8: 闭包私有 vs TS private ===');

// TS private（编译时保护）
class TSPrivate {
  constructor(private secret: string) {}
  reveal() {
    return this.secret;
  }
}
const tsPrivate = new TSPrivate('ts-secret');
console.log('TS private 通过方法访问:', tsPrivate.reveal()); // ts-secret
// tsPrivate.secret; // TS 编译报错，但编译后的 JS 可以访问！

// 闭包私有（运行时真正保护）
function createCounter() {
  let count = 0; // 闭包变量，外部无法直接访问
  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getCount() {
      return count;
    },
  };
}

const counter = createCounter();
console.log('counter.increment():', counter.increment()); // 1
console.log('counter.increment():', counter.increment()); // 2
console.log('counter.getCount():', counter.getCount());   // 2
// counter.count; // undefined，真正无法访问

// ============================================================
// 错误示例（看似合理但实际错误）
// ============================================================

console.log('\n=== 错误示例 ===');

// ---- 错误 1：在 setTimeout 中传入 obj.method ----
// 错误原因：setTimeout 回调是独立调用，method 中的 this 丢失
// 修复方案：用箭头函数包装，或提前 bind

const service = {
  value: 42,
  getValue() {
    return this.value;
  },
};

// 错误写法（用 setImmediate 模拟，避免真的等待）
setTimeout(() => {
  try {
    // @ts-ignore 故意测试错误写法
    const fn = service.getValue;
    console.log('setTimeout 错误:', fn());
  } catch (e: any) {
    console.log('setTimeout 错误结果:', e.message);
  }
}, 0);

// 正确写法
setTimeout(() => {
  console.log('setTimeout 正确:', service.getValue());       // 42
}, 0);

// ---- 错误 2：React/Vue 回调中使用普通函数 ----
// 错误原因：类组件的回调若用普通函数定义，this 指向运行时的调用上下文
// 修复方案：类字段箭头函数，或在构造函数中 bind

class MyComponent {
  state = { count: 0 };

  // 错误：普通方法
  handleClickWrong() {
    // @ts-ignore 故意测试
    this.state.count++; // 作为回调传入时 this 丢失
  }

  // 正确：类字段箭头函数（ES2022）
  handleClickCorrect = () => {
    this.state.count++;
    console.log('箭头回调中 this.state.count:', this.state.count);
  };
}

const comp = new MyComponent();
// const wrongFn = comp.handleClickWrong;
// wrongFn(); // 报错！this 是 undefined

const correctFn = comp.handleClickCorrect;
correctFn(); // 正常！箭头函数锁定了组件实例

// ---- 错误 3：箭头函数作为对象方法，期望访问对象其他属性 ----
// 错误原因：对象字面量中的箭头函数，其 this 继承自外部词法作用域（模块/函数），
//          而不是指向对象本身。
// 修复方案：使用普通方法定义，或使用 method shorthand

const badObj = {
  prefix: 'Hi',
  // 错误！箭头函数的 this 不指向 badObj
  greetArrow: () => {
    // @ts-ignore 此处 this 是模块顶层
    return `${(this as any)?.prefix ?? 'NO_THIS'}, there`;
  },
  // 正确：方法简写
  greetNormal() {
    return `${this.prefix}, there`;
  },
};

console.log('箭头方法（错误）:', badObj.greetArrow());     // NO_THIS, there
console.log('普通方法（正确）:', badObj.greetNormal());    // Hi, there

// ---- 错误 4：误以为 bind 后的函数可以被 new ----
// 错误原因：bind 返回的绑定函数没有 prototype 属性，不能被 new 调用
// 修复方案：使用原始构造函数，或改用类

function Original(this: any) {
  this.type = 'original';
}
const BoundOriginal = Original.bind({ type: 'forced' });
// new BoundOriginal(); // TypeError: BoundOriginal is not a constructor
console.log('bind 后函数 name:', BoundOriginal.name);     // bound Original

// ============================================================
// 本章小结
// ============================================================
/*
 * 必须记住的口诀 / 避坑检查清单：
 *
 * 1. 【this 不看定义看调用】this 的值由函数的调用位置决定，与定义位置无关。
 * 2. 【四种绑定要排序】new > call/apply/bind > obj.method() > 默认绑定。
 * 3. 【箭头函数没有 this】箭头函数的 this 继承外层词法作用域，call/bind/new 都无效。
 * 4. 【提取方法要 bind】const fn = obj.method; fn() 一定丢失 this，要么 bind，
 *    要么用 () => obj.method() 包装。
 * 5. 【类字段箭头救回调】React/Vue 类组件的回调用类字段箭头函数定义，避免 this 丢失。
 * 6. 【class 是糖】ES6 class 编译后仍是 prototype + 构造函数，没有真正的类封闭性。
 * 7. 【TS private 是纸老虎】编译后 private 属性完全可访问，真正私有用闭包或 # 私有字段。
 * 8. 【instanceof 查原型链】instanceof 检查的是原型链，不是构造函数标签，可被篡改。
 */
