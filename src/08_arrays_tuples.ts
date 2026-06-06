/**
 * 学习目标：
 * 1. 掌握数组类型注解的两种写法：number[] 与 Array<string>
 * 2. 理解元组 Tuple 的概念：固定长度、命名元组、可选元素、剩余元素
 * 3. 了解只读数组 readonly 与 ReadonlyArray<T>
 * 4. 掌握数组解构、展开运算符与泛型数组方法
 * 5. 学会多维数组与元组的类型标注
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 的 list 是动态数组，所有元素类型可混用（除非用类型提示）；TS 数组要求元素类型一致
 * - Java 的数组是定长的，泛型集合（List<T>）更常用；TS 数组类似 Java ArrayList，可动态增长
 * - Rust 的元组 (i32, String) 与 TS 的 [number, string] 非常相似；Rust 的 Vec<T> 对应 TS 的 T[]
 * - Rust 的数组 [T; N] 是定长的，TS 没有直接对应的定长数组（用元组替代）
 */

// ==========================================
// 示例 1：数组类型注解
// 使用场景：存储同类型数据的集合
// ==========================================

// 写法一：T[]（更常用，简洁）
const numbers: number[] = [1, 2, 3, 4, 5];

// 写法二：Array<T>（泛型写法）
const names: Array<string> = ["Alice", "Bob", "Charlie"];

// 联合类型数组
const mixed: (string | number)[] = ["a", 1, "b", 2];

console.log(numbers, names, mixed);

// ==========================================
// 示例 2：元组（Tuple）—— 固定长度和类型
// 使用场景：表示有固定结构的少量数据，如坐标、键值对
// ==========================================

const point: [number, number] = [10, 20];
const person: [string, number] = ["Alice", 30];

console.log(point[0], point[1]);

// ==========================================
// 示例 3：命名元组（Labeled Tuple Elements）
// 使用场景：提高元组的可读性，但不影响类型检查
// ==========================================

type RGB = [red: number, green: number, blue: number];

const red: RGB = [255, 0, 0];
console.log(red);

// ==========================================
// 示例 4：可选元素与剩余元素
// 使用场景：元组中某些位置可以省略，或接受任意数量的尾部元素
// ==========================================

// 可选元素
type OptionalTuple = [string, number?];
const withOptional: OptionalTuple = ["hello"];
const fullTuple: OptionalTuple = ["hello", 42];

// 剩余元素
type RestTuple = [string, ...number[]];
const withRest: RestTuple = ["scores", 90, 85, 88];

console.log(withOptional, fullTuple, withRest);

// ==========================================
// 示例 5：只读数组
// 使用场景：防止数组被修改，传递不可变数据
// ==========================================

const readonlyNumbers: readonly number[] = [1, 2, 3];
// readonlyNumbers.push(4); // ❌ 不能修改只读数组

// 使用 ReadonlyArray<T>（readonly T[] 的别名）
const readonlyNames: ReadonlyArray<string> = ["a", "b", "c"];
// readonlyNames[0] = "x"; // ❌ 不能修改

// 只读元组
const readonlyPoint: readonly [number, number] = [1, 2];
// readonlyPoint[0] = 10; // ❌

// ==========================================
// 示例 6：数组解构
// 使用场景：从数组中提取元素，赋予有意义的变量名
// ==========================================

const coords: [number, number, number] = [10, 20, 30];
const [cx, cy, cz] = coords;
console.log(cx, cy, cz);

// 跳过元素
const [, second] = ["first", "second", "third"];
console.log(second);

// 剩余元素解构
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head, tail); // 1, [2, 3, 4, 5]

// ==========================================
// 示例 7：展开运算符（Spread Operator）
// 使用场景：合并数组、复制数组、函数参数传递
// ==========================================

const arr1 = [1, 2];
const arr2 = [3, 4];
const combined = [...arr1, ...arr2];
console.log(combined); // [1, 2, 3, 4]

// 复制数组（浅拷贝）
const original = ["a", "b", "c"];
const copy = [...original];
copy[0] = "x";
console.log(original); // ["a", "b", "c"]（不变）

// ==========================================
// 示例 8：泛型数组方法
// 使用场景：map, filter, reduce 等方法的类型推断
// ==========================================

const scores = [85, 90, 78, 92];

// map 会自动推断返回类型
const doubled: number[] = scores.map((n) => n * 2);

// filter 配合类型谓词实现类型收窄
const strings = ["a", 1, "b", 2, "c"];
const onlyStrings = strings.filter((item): item is string => typeof item === "string");
console.log(onlyStrings); // ["a", "b", "c"]

// reduce 需要显式注解累加器类型
const sum = scores.reduce((acc: number, curr) => acc + curr, 0);
console.log(sum);

// ==========================================
// 示例 9：多维数组与元组
// 使用场景：矩阵、表格数据、嵌套结构
// ==========================================

// 二维数组（矩阵）
const matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
console.log(matrix[1]![2]); // 6（noUncheckedIndexedAccess 下需要非空断言）

// 固定维度的元组数组
type Point3D = [number, number, number];
const points: Point3D[] = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
];
console.log(points);

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error 元组长度固定，访问越界索引会报错（在 noUncheckedIndexedAccess 下）
const outOfBounds: string | undefined = point[2];

// @ts-expect-error 元组不能赋值长度不匹配的值
const wrongTuple: [string, number] = ["only string"];

// @ts-expect-error 只读数组不能调用 push 等修改方法
readonlyNumbers.push(4);

// ==========================================
// 本章小结
// ==========================================
// 1. T[] 和 Array<T> 完全等价，T[] 更常用；联合类型数组需加括号 (A | B)[]
// 2. 元组 [T, U] 表示固定长度和类型的数组，适合表示结构化小数据
// 3. 命名元组、可选元素、剩余元素让元组更加灵活和可读
// 4. readonly 数组和 ReadonlyArray<T> 防止运行时修改，但只是浅层不可变
// 5. 解构和展开运算符是处理数组的利器，复制数组时做浅拷贝
// 6. 多维数组用 T[][] 标注，固定结构的多维数据可用元组数组 [T, U][]
