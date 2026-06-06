/**
 * 学习目标：
 * 1. 掌握 typeof 类型保护
 * 2. 掌握 instanceof 类型保护
 * 3. 掌握 in 操作符类型保护
 * 4. 理解字面量相等保护（=== 收窄）
 * 5. 学会自定义类型保护函数（parameter is Type）
 * 6. 可辨识联合的 switch 收窄与 never 穷尽检查
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 是动态类型，不需要类型收窄；TS 的类型收窄是编译期静态分析的核心特性
 * - Java 的 instanceof 与 TS 类似，但 Java 16+ 有模式匹配；TS 的类型收窄更强大
 * - Rust 的 match 表达式天然具有穷尽检查和模式匹配，TS 通过 switch + never 模拟穷尽检查
 * - TS 的自定义类型保护函数（is）是独特的特性，Rust/Python/Java 都没有直接等价物
 */

// ==========================================
// 示例 1：typeof 类型保护
// 使用场景：区分 string/number/boolean/undefined 等原始类型
// ==========================================

function processValue(value: string | number | boolean): string {
  if (typeof value === "string") {
    return value.toUpperCase(); // 此处 value 被收窄为 string
  }
  if (typeof value === "number") {
    return value.toFixed(2); // 此处 value 被收窄为 number
  }
  // 此时 value 被收窄为 boolean
  return value ? "YES" : "NO";
}

console.log(processValue("hello")); // HELLO
console.log(processValue(3.14159)); // 3.14
console.log(processValue(true)); // YES

// ==========================================
// 示例 2：instanceof 类型保护
// 使用场景：区分不同的类实例
// ==========================================

class Dog {
  bark(): void {
    console.log("Woof!");
  }
}

class Cat {
  meow(): void {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat): void {
  if (animal instanceof Dog) {
    animal.bark(); // 被收窄为 Dog
  } else {
    animal.meow(); // 被收窄为 Cat
  }
}

makeSound(new Dog());
makeSound(new Cat());

// ==========================================
// 示例 3：in 操作符类型保护
// 使用场景：根据对象是否具有某个属性来区分类型
// ==========================================

type Car = { drive(): void; wheels: number };
type Boat = { sail(): void; draft: number };

function operate(vehicle: Car | Boat): void {
  if ("drive" in vehicle) {
    vehicle.drive(); // 被收窄为 Car
  } else {
    vehicle.sail(); // 被收窄为 Boat
  }
}

const car: Car = {
  drive() {
    console.log("Driving on road");
  },
  wheels: 4,
};

const boat: Boat = {
  sail() {
    console.log("Sailing on water");
  },
  draft: 2.5,
};

operate(car);
operate(boat);

// ==========================================
// 示例 4：字面量相等保护（=== 收窄）
// 使用场景：可辨识联合中的分支判断
// ==========================================

type LoadingState = { status: "loading" };
type SuccessState = { status: "success"; data: string };
type ErrorState = { status: "error"; message: string };

type AsyncState = LoadingState | SuccessState | ErrorState;

function render(state: AsyncState): string {
  if (state.status === "loading") {
    return "加载中...";
  }
  if (state.status === "success") {
    return `数据: ${state.data}`;
  }
  return `错误: ${state.message}`;
}

console.log(render({ status: "success", data: "hello" }));

// ==========================================
// 示例 5：自定义类型保护函数（parameter is Type）
// 使用场景：封装复杂的类型判断逻辑，复用于多处
// ==========================================

interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

function isBird(animal: Bird | Fish): animal is Bird {
  return "fly" in animal;
}

function move(animal: Bird | Fish): void {
  if (isBird(animal)) {
    animal.fly(); // 被收窄为 Bird
  } else {
    animal.swim(); // 被收窄为 Fish
  }
}

const bird: Bird = {
  fly() {
    console.log("Flying");
  },
  layEggs() {
    console.log("Laying eggs");
  },
};

move(bird);

// ==========================================
// 示例 6：自定义类型保护处理运行时数据
// 使用场景：验证 API 响应结构是否符合预期
// ==========================================

interface ApiUser {
  id: number;
  name: string;
  email: string;
}

function isApiUser(obj: unknown): obj is ApiUser {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof (obj as Record<string, unknown>).id === "number" &&
    "name" in obj &&
    typeof (obj as Record<string, unknown>).name === "string"
  );
}

const rawData: unknown = { id: 1, name: "Alice", email: "a@example.com" };
if (isApiUser(rawData)) {
  console.log(`User: ${rawData.name}`);
}

// ==========================================
// 示例 7：可辨识联合的 switch 收窄
// 使用场景：处理多种相关但结构不同的数据类型
// ==========================================

type Circle = { kind: "circle"; radius: number };
type Rectangle = { kind: "rectangle"; width: number; height: number };
type Triangle = { kind: "triangle"; base: number; height: number };

type Shape = Circle | Rectangle | Triangle;

function describeShape(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `圆，半径 ${shape.radius}`;
    case "rectangle":
      return `矩形，${shape.width} x ${shape.height}`;
    case "triangle":
      return `三角形，底 ${shape.base} 高 ${shape.height}`;
  }
}

console.log(describeShape({ kind: "circle", radius: 5 }));

// ==========================================
// 示例 8：switch + never 穷尽检查
// 使用场景：确保所有联合类型分支都被处理
// ==========================================

function getAreaSafe(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}

// ==========================================
// 示例 9：类型收窄的链式使用
// 使用场景：逐步缩小复杂联合类型的范围
// ==========================================

function process(input: string | number | string[] | null): string {
  if (input === null) {
    return "null input";
  }

  if (Array.isArray(input)) {
    return `array with ${input.length} items`;
  }

  if (typeof input === "string") {
    return `string: ${input}`;
  }

  // 此时 input 被收窄为 number
  return `number: ${input}`;
}

console.log(process("hello"));
console.log(process(42));
console.log(process(["a", "b"]));
console.log(process(null));

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

function wrongNarrow(value: string | number): void {
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  }
  // @ts-expect-error 类型收窄后，在块外访问已排除类型的方法会报错：value 仍可能是 number
  console.log(value.toUpperCase());
}

function badInstanceof(value: string | number): void {
  // @ts-expect-error instanceof 对原始类型无效（string/number 等不是类）
  if (value instanceof String) {
    console.log(value);
  }
}

function wrongGuard(animal: Bird | Fish): void {
  if (!isBird(animal)) {
    // animal 被收窄为 Fish
    animal.swim();
  }
  // @ts-expect-error 自定义类型保护返回 false 时不会收窄，此处 animal 仍是 Bird | Fish
  animal.swim();
}

// ==========================================
// 本章小结
// ==========================================
// 1. typeof 用于原始类型收窄，instanceof 用于类实例收窄
// 2. in 操作符检查对象属性存在性，适合区分结构相似的对象类型
// 3. 字面量相等保护（===）是可辨识联合的核心收窄手段
// 4. 自定义类型保护函数（is）封装复杂判断逻辑，是最强大的收窄工具
// 5. switch + default 中的 never 赋值实现穷尽检查，是防御性编程的利器
// 6. 类型收窄可以链式使用，逐步缩小联合类型的范围
