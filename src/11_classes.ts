/**
 * 学习目标：
 * 1. 掌握类定义、构造函数、属性类型的基本写法
 * 2. 理解访问修饰符 public、private、protected、readonly 的作用
 * 3. 学会参数属性（Parameter Properties）简化写法
 * 4. 掌握继承 extends 与 super() 调用
 * 5. 了解抽象类 abstract 与抽象方法
 * 6. 掌握 getter/setter 与静态成员
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 的类用 __init__ 构造，没有访问修饰符（用 _ 和 __ 约定）；TS 有显式的 public/private/protected
 * - Java 的类系统与 TS 非常相似（都继承自 C++ 传统），TS 的 protected 行为与 Java 基本一致
 * - Rust 没有类（只有 struct + impl + trait），TS 的类更接近 Java/C++ 的面向对象模型
 * - TS 的参数属性是语法糖，Python/Java/Rust 都没有直接等价物
 */

// ==========================================
// 示例 1：基本类定义
// 使用场景：创建具有属性和方法的对象模板
// ==========================================

class Animal {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  move(distance: number = 0): void {
    console.log(`${this.name} moved ${distance}m`);
  }
}

const dog = new Animal("Buddy", 3);
dog.move(10);

// ==========================================
// 示例 2：访问修饰符
// 使用场景：控制属性和方法的可见性
// ==========================================

class BankAccount {
  public owner: string; // 公开（默认）
  private balance: number; // 私有，类外部不可访问
  protected accountType: string; // 受保护，子类可访问

  constructor(owner: string, balance: number) {
    this.owner = owner;
    this.balance = balance;
    this.accountType = "standard";
  }

  public deposit(amount: number): void {
    if (amount > 0) {
      this.balance += amount;
    }
  }

  public getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount("Alice", 1000);
account.deposit(500);
console.log(account.getBalance()); // 1500
// console.log(account.balance); // ❌ 私有属性不可访问

// ==========================================
// 示例 3：参数属性（Parameter Properties）简化写法
// 使用场景：减少构造函数中重复的属性声明和赋值
// ==========================================

class User {
  // 一行声明 + 初始化 + 赋值
  constructor(
    public readonly id: number,
    public name: string,
    private email: string
  ) {}

  getEmail(): string {
    return this.email;
  }
}

const user = new User(1, "Alice", "alice@example.com");
console.log(user.id, user.name);
// user.id = 2; // ❌ readonly
console.log(user.getEmail());

// ==========================================
// 示例 4：继承 extends 与 super()
// 使用场景：基于已有类创建更具体的子类
// ==========================================

class Cat extends Animal {
  breed: string;

  constructor(name: string, age: number, breed: string) {
    super(name, age); // 必须首先调用 super()
    this.breed = breed;
  }

  move(distance = 5): void {
    console.log("Sneaking...");
    super.move(distance);
  }

  meow(): void {
    console.log("Meow!");
  }
}

const kitty = new Cat("Whiskers", 2, "Persian");
kitty.move();
kitty.meow();

// ==========================================
// 示例 5：抽象类与抽象方法
// 使用场景：定义必须由子类实现的接口，提供部分默认实现
// ==========================================

abstract class Shape {
  abstract getArea(): number; // 抽象方法，无实现

  describe(): string {
    return `This shape has an area of ${this.getArea()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }

  getArea(): number {
    return this.width * this.height;
  }
}

const circle = new Circle(5);
console.log(circle.describe());

// const shape = new Shape(); // ❌ 不能实例化抽象类

// ==========================================
// 示例 6：getter 与 setter
// 使用场景：封装属性访问，在读写时添加逻辑
// ==========================================

class Temperature {
  private _celsius = 0;

  get celsius(): number {
    return this._celsius;
  }

  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error("Temperature below absolute zero!");
    }
    this._celsius = value;
  }

  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }

  set fahrenheit(value: number) {
    this.celsius = (value - 32) * 5 / 9;
  }
}

const temp = new Temperature();
temp.celsius = 25;
console.log(temp.fahrenheit); // 77

// ==========================================
// 示例 7：静态成员
// 使用场景：与类本身相关而非实例的属性和方法
// ==========================================

class MathUtils {
  static readonly PI = 3.14159;

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}

console.log(MathUtils.PI);
console.log(MathUtils.clamp(150, 0, 100)); // 100

// ==========================================
// 示例 8：类实现接口
// 使用场景：强制类遵循某种契约
// ==========================================

interface Printable {
  print(): void;
}

interface Serializable {
  serialize(): string;
}

class Report implements Printable, Serializable {
  constructor(public title: string, public content: string) {}

  print(): void {
    console.log(`Report: ${this.title}`);
    console.log(this.content);
  }

  serialize(): string {
    return JSON.stringify({ title: this.title, content: this.content });
  }
}

const report = new Report("Q1 Summary", "Revenue increased by 20%");
report.print();
console.log(report.serialize());

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error 抽象方法必须在子类中实现，否则会报错
class IncompleteShape extends Shape {
  // 忘记实现 getArea()
}

class BadCat extends Animal {
  constructor(name: string) {
    // @ts-expect-error 构造函数中访问 this 之前必须先调用 super()
    this.name = name;
    super(name, 0);
  }
}

class Hacker extends BankAccount {
  steal(): number {
    // @ts-expect-error private 属性不能在子类中访问（protected 才可以）
    return this.balance;
  }
}

// ==========================================
// 本章小结
// ==========================================
// 1. TS 的类系统与 Java 非常相似，有 public/private/protected/readonly 修饰符
// 2. 参数属性是 TS 独有的语法糖，可大幅简化构造函数的写法
// 3. 子类构造函数中必须先调用 super() 才能使用 this
// 4. 抽象类用 abstract 标记，不能实例化，抽象方法必须在子类中实现
// 5. getter/setter 提供封装，可在访问属性时添加验证/转换逻辑
// 6. 静态成员属于类本身，常用于工具函数和常量
// 7. 类可以实现多个接口，类似 Java；但 TS 没有多重继承
