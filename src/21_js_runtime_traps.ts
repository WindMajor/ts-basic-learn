/*
 * ============================================================
 * 学习目标
 * ============================================================
 * 掌握 JS 引擎在运行时的隐式类型转换规则，避免写出 TS 编译通过但执行结果
 * 诡异的代码。重点理解：类型正确 ≠ 行为正确。
 *
 * 为什么 TS 编译时无法发现这些问题？
 * -----------------------------------------------------------
 * TypeScript 是静态类型检查器，它在编译期验证的是"值的类型标签"是否匹配。
 * 但 JS 引擎在运行时有一套完全独立的抽象操作规则（如 ToPrimitive、
 * Abstract Equality Comparison），这些规则与 TS 的类型系统无关。
 * 例如：TS 认为 string 和 number 在 `==` 下是合法的（因为有类型兼容性），
 * 但运行时会发生什么转换，TS 不做也无法保证。
 *
 * 与 TS 类型系统的边界关系
 * -----------------------------------------------------------
 * TS 负责：编译时类型匹配、属性存在性检查、函数签名校验。
 * JS 运行时负责：类型转换、原型链查找、this 绑定、事件循环、内存回收。
 * 两者是互补关系，而非替代关系。TS 编译通过了，只代表"类型层面"没问题；
 * 运行时行为仍需要开发者对 JS 引擎机制有深刻理解。
 * ============================================================
 */

// ============================================================
// 示例 1：== 的隐式类型转换规则（永远不要使用 ==）
// ============================================================
// 场景：开发中为了"简洁"使用 == 进行值比较
// 预期结果：直觉上认为比较的是"语义相等"
// 实际结果：引擎执行了一套复杂的抽象相等比较算法，结果经常出乎意料
// 背后的 JS 引擎行为：
//   Abstract Equality Comparison 规则：
//   1. 若类型相同，按 === 比较
//   2. 若一方是 null，另一方是 undefined，返回 true
//   3. 若一方是 number，另一方是 string，将 string 转 number
//   4. 若一方是 boolean，将其转 number（true→1, false→0）
//   5. 若一方是 object，另一方是原始类型，将 object 转原始类型（ToPrimitive）
//   6. 以上都不满足，返回 false

console.log('=== 示例 1: == 的隐式转换 ===');

// 字符串 '0' 被转换为数字 0
// @ts-ignore 故意演示 == 弱类型行为
console.log('0 == "0":', 0 == '0');           // true

// 空数组 [] 被转原始类型得到 ''，再转数字得到 0
// @ts-ignore 故意演示 == 弱类型行为
console.log('0 == []:', 0 == []);             // true

// '' 转 boolean 为 false，然后 false 转 number 为 0
// @ts-ignore 故意演示 == 弱类型行为
console.log('"" == false:', '' == false);     // true

// null 和 undefined 在 == 下互相相等，但不等于其他值
console.log('null == undefined:', null == undefined); // true
console.log('null == 0:', null == 0);          // false

// 口诀：== 比较的不是值，而是"转换后的值"。永远用 === 和 !==。

// ============================================================
// 示例 2：falsy 值大全与逻辑运算陷阱
// ============================================================
// 场景：使用 || 设置默认值，或 && 进行条件执行
// 预期结果：|| 和 && 返回布尔值
// 实际结果：它们返回的是"决定结果的那个操作数本身"
// 背后的 JS 引擎行为：
//   ||：从左到右找第一个 truthy 值，若找不到返回最后一个值
//   &&：从左到右找第一个 falsy 值，若找不到返回最后一个值
//   ??：空值合并，仅当左侧为 null 或 undefined 时才取右侧

console.log('\n=== 示例 2: falsy 值与逻辑运算 ===');

// 完整的 falsy 列表（共 8 个）
const falsyValues = [0, -0, 0n, '', null, undefined, NaN, false];
console.log('falsy 值数量:', falsyValues.length); // 8

// || 返回操作数本身，不是布尔值
// @ts-ignore 故意演示 || 返回操作数（'' 是 falsy）
console.log('"" || "default":', '' || 'default');   // "default"
console.log('0 || 100:', 0 || 100);                   // 100
// @ts-ignore 故意演示 && 返回第一个 falsy（0 是 always falsy，但整体表达式演示意图明确）
console.log('1 && 2 && 0:', 1 && 2 && 0);            // 0（第一个 falsy）

// ?? 与 || 的本质区别：?? 只认 null/undefined
// @ts-ignore 故意演示 ?? 与 || 的区别（0 不是 nullish）
console.log('0 ?? 100:', 0 ?? 100);                   // 0
console.log('0 || 100:', 0 || 100);                   // 100
// @ts-ignore 故意演示 ?? 与 || 的区别（空字符串不是 nullish）
console.log('"" ?? "default":', '' ?? 'default');   // ""

// ============================================================
// 示例 3：typeof 的怪癖
// ============================================================
// 场景：使用 typeof 进行运行时类型检查
// 预期结果：typeof null 返回 'null'
// 实际结果：typeof null 返回 'object'
// 背后的 JS 引擎行为：
//   JS 值在引擎内部以类型标签+值的形式存储。null 表示"空指针"，
//   在早期的 V8 实现中其二进制表示与 object 类型标签冲突（全 0），
//   为了兼容性这个历史 bug 被永久保留。
//   typeof NaN === 'number' 是因为 NaN 是 IEEE 754 标准定义的"非数字"，
//   但它确实占用一个 number 的存储位置。

console.log('\n=== 示例 3: typeof 的怪癖 ===');

console.log('typeof null:', typeof null);           // "object"
console.log('typeof []:', typeof []);               // "object"
console.log('typeof NaN:', typeof NaN);             // "number"

// 正确的判断方法
console.log('Array.isArray([]):', Array.isArray([]));           // true
console.log('Number.isNaN(NaN):', Number.isNaN(NaN));           // true
console.log('null === null:', null === null);                   // true

// ============================================================
// 示例 4：浮点数精度问题
// ============================================================
// 场景：进行货币金额计算
// 预期结果：0.1 + 0.2 === 0.3
// 实际结果：0.30000000000000004
// 背后的 JS 引擎行为：
//   JS 使用 IEEE 754 双精度浮点数（64 位）表示所有数字。
//   0.1 和 0.2 在二进制下是无限循环小数，存储时被截断，相加后误差累积。

console.log('\n=== 示例 4: 浮点数精度 ===');

console.log('0.1 + 0.2:', 0.1 + 0.2);                          // 0.30000000000000004
console.log('0.1 + 0.2 === 0.3:', 0.1 + 0.2 === 0.3);         // false

// 解决方案 1：先转整数运算
const total = (0.1 * 10 + 0.2 * 10) / 10;
console.log('整数转换法:', total);                               // 0.3

// 解决方案 2：toFixed 后转 Number（适合货币展示）
const fixed = Number((0.1 + 0.2).toFixed(2));
console.log('toFixed 法:', fixed);                               // 0.3

// Number.EPSILON 表示 1 与大于 1 的最小浮点数之差，可用于误差容忍比较
console.log('Number.EPSILON:', Number.EPSILON);                  // 2.220446049250313e-16
console.log('近似相等:', Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON); // true

// ============================================================
// 示例 5：对象与原始类型的比较
// ============================================================
// 场景：对象参与 == 运算或算术运算
// 预期结果：对象按某种直觉方式转换
// 实际结果：对象先调用 ToPrimitive，优先 valueOf → toString → Number
// 背后的 JS 引擎行为：
//   ToPrimitive(hint) 中 hint 为 'default' 时按 'number' 处理。
//   但除了 Date 对象，大部分对象先尝试 valueOf，若返回非原始值再试 toString。
//   数组的 toString 行为是 join(',')。

console.log('\n=== 示例 5: 对象与原始类型的比较 ===');

// 数组先转字符串 "1,2"，再与 '1,2' 比较
// @ts-ignore 故意演示 == 弱类型行为
console.log('[1,2] == "1,2":', [1, 2] == '1,2');   // true

// [] 转字符串 ''，再转数字 0，false 也转 0
// @ts-ignore 故意演示 == 弱类型行为
console.log('[] == false:', [] == false);            // true

// 对象 {} 在语句开头被解析为代码块，不是对象字面量
// 所以 {} + [] 实际上是 +[]，即 Number('') = 0
// @ts-ignore 故意演示对象与原始类型运算
console.log('{} + [] 的结果:', {} + []);             // 0（在浏览器控制台可能显示不同）

// 自定义 valueOf
const obj = {
  valueOf() {
    return 42;
  },
};
console.log('obj + 1:', (obj as any) + 1);           // 43

// ============================================================
// 示例 6：parseInt / parseFloat 的隐藏参数
// ============================================================
// 场景：使用 parseInt 转换用户输入的数字字符串
// 预期结果：parseInt('08') 返回 8
// 实际结果：ES3 中某些实现将 '08' 按八进制解析返回 0（现代环境已修复）
// 背后的 JS 引擎行为：
//   parseInt(string, radix) 若省略 radix：
//   - 字符串以 0x 开头 → 按 16 进制
//   - 字符串以 0 开头 + 旧引擎 → 可能按 8 进制（ES3 bug）
//   - 其他 → 按 10 进制
//   parseInt 会先将其参数转为字符串！所以 parseInt(0.0000008) 先得到 ".0000008"

console.log('\n=== 示例 6: parseInt 的陷阱 ===');

// 历史问题：ES3 中 parseInt('08') 可能返回 0（八进制中 8 非法）
// 现代引擎已按 ES5+ 规范修复，但仍建议始终指定进制
console.log("parseInt('08'):", parseInt('08'));      // 8（现代引擎）
console.log("parseInt('08', 10):", parseInt('08', 10)); // 8（安全写法）

// 惊人陷阱：先转字符串！
// @ts-ignore 故意演示 parseInt 接收非字符串参数
console.log("parseInt(0.0000008):", parseInt(0.0000008)); // 8（因为转成 ".0000008"）

// 始终指定 radix
console.log("parseInt('ff', 16):", parseInt('ff', 16));   // 255

// ============================================================
// 示例 7：自动分号插入（ASI）陷阱
// ============================================================
// 场景：return 语句后换行写返回值
// 预期结果：return 后面的对象字面量
// 实际结果：return 后自动插入分号，返回 undefined
// 背后的 JS 引擎行为：
//   JS 解析器在换行处若发现缺少分号会尝试自动插入，规则包括：
//   1. 换行且下一行不能作为当前语句的延续时插入分号
//   2. 但 (, [, `, +, -, / 开头的行会被视为上一行的延续
//   3. return/break/continue 后紧跟换行时，一定插入分号

console.log('\n=== 示例 7: ASI 陷阱 ===');

// 错误写法（演示 ASI 问题，用函数包裹）
function badReturn() {
  return
  // ASI 在此处自动插入分号，变成 `return;`
  // 下面的对象字面量被解析为独立的块语句+标签语句，而非返回值
  ({
    ok: true,
  });
}
console.log('badReturn():', badReturn());   // undefined

// 正确写法
function goodReturn() {
  return {
    ok: true,
  };
}
console.log('goodReturn():', goodReturn()); // { ok: true }

// 以 ( 开头的行被解析为函数调用
const a = 1;
const b = 2;
// 下面这行会被解析为 a = 1(2)，报错！（这里用注释避免实际报错）
// const c = a
// (b).toString()

// 防御性写法：行首运算符风格
const d = a
  + b;
console.log('行首运算符:', d);   // 3

// ============================================================
// 示例 8：模板字符串的隐式调用（标签模板）
// ============================================================
// 场景：看到类似 styled.div`color: red` 的语法
// 预期结果：模板字符串只是字符串拼接
// 实际结果：标签模板函数接收的是 (strings: TemplateStringsArray, ...values)
// 背后的 JS 引擎行为：
//   标签模板将模板按 ${} 分割成字符串数组 + 插值数组传入函数。
//   String.raw 可获取原始字符串（不转义）。

console.log('\n=== 示例 8: 标签模板字符串 ===');

function tag(strings: TemplateStringsArray, ...values: unknown[]) {
  console.log('  strings:', strings);
  console.log('  values:', values);
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '');
}

const name = 'TS';
const result = tag`Hello ${name}! Welcome to ${'JS'} runtime.`;
console.log('tag 结果:', result);

// String.raw 获取原始字符串（\n 不转义为换行）
console.log('String.raw:', String.raw`C:\Users\name\file.txt`);

// ============================================================
// 示例 9：数字字面量与下划线
// ============================================================
// 场景：使用下划线增强大数字可读性
// 预期结果：Number('1_000') 返回 1000
// 实际结果：返回 NaN（下划线仅限字面量语法）
// 背后的 JS 引擎行为：
//   ES2021 允许数字字面量中使用下划线 _ 作为分隔符，但 Number() / parseInt()
//   的字符串解析器不识别它。

console.log('\n=== 示例 9: 数字字面量下划线 ===');

const million = 1_000_000;
const hex = 0xFF;
const octal = 0o77;
const binary = 0b11;

console.log('1_000_000:', million);   // 1000000
console.log('0xFF:', hex);            // 255
console.log('0o77:', octal);          // 63
console.log('0b11:', binary);         // 3

// 注意：下划线不能用于字符串转数字
console.log("Number('1_000'):", Number('1_000'));   // NaN
console.log("parseInt('1_000'):", parseInt('1_000')); // 1（解析到 _ 停止）

// ============================================================
// 示例 10：JSON.stringify 的隐蔽行为
// ============================================================
// 场景：将任意对象序列化为 JSON
// 预期结果：所有属性都被保留
// 实际结果：undefined/function/Symbol 被忽略或转为 null
// 背后的 JS 引擎行为：
//   JSON.stringify 遍历可枚举自有属性，值若不是标准 JSON 类型
//   （string/number/boolean/object/array/null）则按规则处理。
//   循环引用会抛出 TypeError。对象若有 toJSON 方法则调用它。

console.log('\n=== 示例 10: JSON.stringify 隐蔽行为 ===');

const objForJson = {
  name: 'test',
  nothing: undefined,
  action: function () { return 1; },
  sym: Symbol('sym'),
  count: 42,
};
console.log('对象序列化:', JSON.stringify(objForJson)); // {"name":"test","count":42}

// 数组中 undefined 转为 null
console.log('数组序列化:', JSON.stringify([1, undefined, 3])); // [1,null,3]

// toJSON 自定义
const custom = {
  secret: 'hidden',
  visible: 'shown',
  toJSON() {
    return { visible: this.visible };
  },
};
console.log('toJSON:', JSON.stringify(custom)); // {"visible":"shown"}

// ============================================================
// 错误示例（看似合理但实际错误）
// ============================================================

// ---- 错误 1：依赖 == 判断空值 ----
// 错误原因：0 和 '' 会被 == 视为 falsy，与 null/undefined 混为一谈
// 修复方案：使用 === 分别判断，或用 ?? 只处理 null/undefined

function getValue_wrong(value: number | string | null | undefined) {
  // 传入 0 或 '' 时会错误地返回 'default'！
  if (value == null || value == undefined) {
    return 'default';
  }
  return value;
}
// 实际 bug：如果业务逻辑本意是只替换 null/undefined，但上面代码并不包含 0 和 ''
// 正确写法：
function getValue_correct(value: number | string | null | undefined) {
  return value ?? 'default'; // 仅 null/undefined 时取默认值
}

console.log('\n=== 错误示例演示 ===');
// @ts-ignore 故意演示 == 误判
console.log('错误: 0 == "":', 0 == '');              // true（灾难！）
// @ts-ignore 故意演示 ?? 只认 nullish
console.log('正确 0 ?? 100:', 0 ?? 100);              // 0
// @ts-ignore 故意演示 ?? 只认 nullish
console.log('正确 "" ?? "default":', '' ?? 'default'); // ""

// ---- 错误 2：使用 typeof 判断数组 ----
// 错误原因：typeof [] === 'object'，typeof null 也是 'object'
// 修复方案：使用 Array.isArray()

function processData_wrong(data: unknown) {
  if (typeof data === 'object') {
    // 如果传入 null，这里会进入分支并尝试调用 .map，导致运行时错误！
    return (data as any).map((x: unknown) => x);
  }
  return data;
}
function processData_correct(data: unknown) {
  if (Array.isArray(data)) {
    return data.map((x) => x);
  }
  return data;
}

console.log('typeof null === object:', typeof null === 'object'); // true
console.log('Array.isArray(null):', Array.isArray(null));         // false

// ---- 错误 3：parseInt 不带进制参数 ----
// 错误原因：某些输入可能被按非 10 进制解析（如 0x 开头按 16 进制）
// 修复方案：始终传入第二个参数 10

const userInput = '0x10';
console.log("parseInt('0x10'):", parseInt(userInput));          // 16（被当 16 进制！）
console.log("parseInt('0x10', 10):", parseInt(userInput, 10));  // 0（符合预期）

// ---- 错误 4：用 JSON.stringify 做深拷贝 ----
// 错误原因：丢失 function/undefined/Symbol，不支持循环引用，不支持 Map/Set/Date
// 修复方案：使用 structuredClone（现代环境）或专门的深拷贝库

const original = {
  date: new Date(),
  map: new Map([['key', 'value']]),
  fn: () => 1,
};
const cloned = JSON.parse(JSON.stringify(original as any));
console.log('深拷贝后 date 变成:', typeof cloned.date);   // string（ISO 格式）
console.log('深拷贝后 map 变成:', cloned.map);             // undefined

// ============================================================
// 本章小结
// ============================================================
/*
 * 必须记住的口诀 / 避坑检查清单：
 *
 * 1. 【== 是毒药】永远使用 === 和 !==，避免一切隐式类型转换。
 * 2. 【默认值用 ??】只有 null/undefined 才需要默认值时用 ??，不是 ||。
 * 3. 【typeof 判数组会翻车】判断数组用 Array.isArray，判断 NaN 用 Number.isNaN，
 *    判断 null 用 === null。
 * 4. 【小数是炸弹】货币计算先转整数，或用 toFixed + Number 转换。
 * 5. 【parseInt 要传底】永远写 parseInt(str, 10)，避免进制歧义。
 * 6. 【return 别换行】return 后的 { 必须与 return 在同一行，否则 ASI 插入分号。
 * 7. 【JSON.stringify 不完整】不要用它做深拷贝，会丢失函数/undefined/Symbol/Map/Set。
 * 8. 【数字下划线仅字面量】Number('1_000') 是 NaN，不要把带下划线的数字字符串直接转数字。
 */
