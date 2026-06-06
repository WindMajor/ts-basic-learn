/**
 * 学习目标：
 * 1. 掌握 Map<K, V> 与 Set<T> 的泛型使用
 * 2. 理解 WeakMap 和 WeakSet 的特性与对象引用的类型安全
 * 3. 学会使用 Record<K, T> 工具类型
 * 4. 对比普通对象 {} 与 Map 在类型系统上的差异
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 的 dict 对应 TS 的普通对象 {}，但 TS 的 Record 类型更严格；Python 的 dict 键可以是任何可哈希类型
 * - Java 的 HashMap<K, V> 和 HashSet<T> 与 TS 的 Map/Set API 非常相似
 * - Rust 的 HashMap<K, V> 和 HashSet<T> 也是类似概念；Rust 没有 WeakMap/WeakSet 的标准库支持
 * - TS 的 Map 键可以是任意类型（包括对象），而普通对象的键只能是 string 或 symbol
 */

// ==========================================
// 示例 1：Map<K, V> 的基本用法
// 使用场景：需要任意类型作为键的有序键值对集合
// ==========================================

const userMap = new Map<number, string>();
userMap.set(1, "Alice");
userMap.set(2, "Bob");
userMap.set(3, "Charlie");

console.log(userMap.get(1)); // "Alice"
console.log(userMap.has(2)); // true
console.log(userMap.size); // 3

// 使用对象作为键（Map 的独特优势）
const keyObj = { id: 100 };
const objectMap = new Map<object, string>();
objectMap.set(keyObj, "value for keyObj");
console.log(objectMap.get(keyObj)); // "value for keyObj"

// 遍历 Map
for (const [key, value] of userMap) {
  console.log(`${key}: ${value}`);
}

// ==========================================
// 示例 2：Set<T> 的基本用法
// 使用场景：存储唯一值的去重集合
// ==========================================

const uniqueNumbers = new Set<number>([1, 2, 2, 3, 3, 3]);
console.log(uniqueNumbers.size); // 3

uniqueNumbers.add(4);
uniqueNumbers.delete(1);
console.log(uniqueNumbers.has(2)); // true

// Set 的遍历
for (const num of uniqueNumbers) {
  console.log(num);
}

// ==========================================
// 示例 3：WeakMap —— 弱引用键的 Map
// 使用场景：与对象关联的私有数据，不阻止垃圾回收
// ==========================================

interface CacheData {
  visits: number;
  lastVisit: Date;
}

const privateCache = new WeakMap<object, CacheData>();

function trackObject(obj: object): void {
  const data = privateCache.get(obj);
  if (data) {
    data.visits++;
    data.lastVisit = new Date();
  } else {
    privateCache.set(obj, { visits: 1, lastVisit: new Date() });
  }
}

const trackedUser = { name: "Alice" };
trackObject(trackedUser);
trackObject(trackedUser);
console.log(privateCache.get(trackedUser));

// WeakMap 的键必须是对象，且不可遍历
// privateCache.set("string", {}); // ❌

// ==========================================
// 示例 4：WeakSet —— 弱引用对象的 Set
// 使用场景：标记对象是否被处理过，不阻止垃圾回收
// ==========================================

const processedItems = new WeakSet<object>();

function processItem(item: object): void {
  if (processedItems.has(item)) {
    console.log("Already processed");
    return;
  }
  processedItems.add(item);
  console.log("Processing...");
}

const item1 = { id: 1 };
processItem(item1); // Processing...
processItem(item1); // Already processed

// ==========================================
// 示例 5：Record<K, T> 工具类型
// 使用场景：定义键类型和值类型都固定的对象类型
// ==========================================

type UserRoles = "admin" | "editor" | "viewer";
type Permissions = { read: boolean; write: boolean };

const rolePermissions: Record<UserRoles, Permissions> = {
  admin: { read: true, write: true },
  editor: { read: true, write: true },
  viewer: { read: true, write: false },
};

console.log(rolePermissions.editor);

// Record 与索引签名的区别：
// - Record<K, T>：键的范围被 K 精确限定
// - { [key: string]: T }：接受任意字符串键

// ==========================================
// 示例 6：普通对象 vs Map 的类型差异
// 使用场景：根据需求选择合适的数据结构
// ==========================================

// 普通对象
interface ConfigMap {
  [key: string]: string;
}

const config: ConfigMap = {
  host: "localhost",
  port: "3000",
};

// Map
const configMap = new Map<string, string>();
configMap.set("host", "localhost");
configMap.set("port", "3000");

// 差异对比：
// | 特性           | 普通对象 {}      | Map                |
// |---------------|-----------------|-------------------|
// | 键类型         | string/symbol   | 任意类型           |
// | 顺序保证       | 部分保证         | 完全保证插入顺序    |
// | 大小获取       | Object.keys()   | .size 属性         |
// | 迭代性能       | 较差            | 更好               |
// | 原型链污染     | 有风险          | 无                 |

// ==========================================
// 示例 7：Map 与数组的转换
// 使用场景：在 Map 和数组之间进行数据转换
// ==========================================

const entries: [string, number][] = [
  ["a", 1],
  ["b", 2],
  ["c", 3],
];

const fromEntries = new Map<string, number>(entries);
console.log(fromEntries.get("b")); // 2

// Map 转对象（键必须是 string）
const objFromMap = Object.fromEntries(fromEntries);
console.log(objFromMap); // { a: 1, b: 2, c: 3 }

// ==========================================
// 示例 8：Set 的集合运算
// 使用场景：并集、交集、差集等集合操作
// ==========================================

const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// 交集
const intersection = new Set([...setA].filter((x) => setB.has(x)));
console.log(intersection); // {3, 4}

// 差集
const difference = new Set([...setA].filter((x) => !setB.has(x)));
console.log(difference); // {1, 2}

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error WeakMap 的键必须是对象类型
const weakMap = new WeakMap<string, number>();

// @ts-expect-error Record 要求包含所有联合类型的键
const incompleteRoles: Record<UserRoles, Permissions> = {
  admin: { read: true, write: true },
  // 缺少 editor 和 viewer
};

// @ts-expect-error Map.get 可能返回 undefined，在 strict 模式下需要处理
const maybeUser: string = userMap.get(999);

// ==========================================
// 本章小结
// ==========================================
// 1. Map<K, V> 提供任意类型键的有序集合，API 与 Java 的 HashMap 类似
// 2. Set<T> 存储唯一值，去重场景的首选
// 3. WeakMap/WeakSet 使用弱引用，适合与对象生命周期绑定的私有数据，不阻止垃圾回收
// 4. Record<K, T> 是定义固定键集合对象的便捷工具类型
// 5. 普通对象 {} 适合简单配置，Map 适合复杂键值集合和频繁增删场景
// 6. Map/Set 的迭代性能优于普通对象，且避免了原型链污染问题
