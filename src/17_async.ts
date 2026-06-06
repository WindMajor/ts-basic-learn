/**
 * 学习目标：
 * 1. 理解 Promise<T> 的泛型本质
 * 2. 掌握 async/await 的返回类型推断
 * 3. 了解 Promise.all、Promise.race、Promise.allSettled 的泛型行为
 * 4. 学会异步函数的错误处理与类型
 * 5. 了解异步迭代器 AsyncGenerator 类型
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 3.5+ 的 asyncio 与 TS 的 async/await 概念类似，但 Python 有事件循环显式管理
 * - Java 的 CompletableFuture<T> 与 Promise<T> 类似，但 API 更复杂
 * - Rust 的 async/await 是零成本抽象，编译为状态机；TS 编译为生成器/Promise，依赖 JS 引擎
 * - Rust 的 Future 是惰性求值的，调用 .await 才执行；TS 的 Promise 在创建时立即执行
 */

// ==========================================
// 示例 1：Promise<T> 的泛型本质
// 使用场景：创建和使用带类型的 Promise
// ==========================================

const stringPromise: Promise<string> = new Promise((resolve) => {
  setTimeout(() => resolve("Hello from Promise"), 100);
});

stringPromise.then((value) => {
  console.log(value.toUpperCase()); // value 被推断为 string
});

// Promise 链式调用中的类型传递
const numberPromise = Promise.resolve(42);
numberPromise
  .then((n) => n * 2)
  .then((n) => console.log(n.toFixed(2))); // n 仍是 number

// ==========================================
// 示例 2：async/await 的返回类型推断
// 使用场景：用同步的写法处理异步逻辑
// ==========================================

async function fetchUser(id: number): Promise<{ id: number; name: string }> {
  // 模拟 API 调用
  return { id, name: `User ${id}` };
}

// async 函数总是返回 Promise<T>
async function getUserName(id: number): Promise<string> {
  const user = await fetchUser(id);
  return user.name; // 返回 string，函数整体返回 Promise<string>
}

// 调用 async 函数
getUserName(1).then((name) => console.log(name));

// ==========================================
// 示例 3：Promise.all 的泛型行为
// 使用场景：并行执行多个异步操作，等待全部完成
// ==========================================

async function fetchMultiple(): Promise<void> {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    Promise.resolve(["post1", "post2"]),
    Promise.resolve(["comment1"]),
  ]);

  // TypeScript 正确推断每个元素的类型：
  // user: { id: number; name: string }
  // posts: string[]
  // comments: string[]
  console.log(user.name, posts.length, comments.length);
}

fetchMultiple();

// ==========================================
// 示例 4：Promise.race 的泛型行为
// 使用场景：多个异步操作竞争，返回最先完成的那个
// ==========================================

async function raceDemo(): Promise<void> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout!")), 1000);
  });

  const result = await Promise.race([fetchUser(1), timeout]);
  console.log(result.name);
}

// ==========================================
// 示例 5：Promise.allSettled 的泛型行为
// 使用场景：并行执行多个操作，获取每个的结果（无论成功或失败）
// ==========================================

async function allSettledDemo(): Promise<void> {
  const results = await Promise.allSettled([
    fetchUser(1),
    Promise.reject(new Error("Failed")),
    Promise.resolve("ok"),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log("Success:", result.value);
    } else {
      console.log("Failed:", result.reason);
    }
  }
}

allSettledDemo();

// ==========================================
// 示例 6：异步函数的错误处理
// 使用场景：处理 async/await 中的异常
// ==========================================

async function fetchWithError(): Promise<string> {
  try {
    const response = await fetch("https://api.example.com/data");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Fetch error: ${error.message}`);
    }
    throw error; // 重新抛出，让调用方处理
  }
}

// ==========================================
// 示例 7：返回 Result 类型的异步函数
// 使用场景：类型安全的异步错误处理
// ==========================================

type Result<T, E> = { success: true; data: T } | { success: false; error: E };

async function safeFetch(url: string): Promise<Result<string, Error>> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return { success: true, data: text };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

// ==========================================
// 示例 8：异步迭代器 AsyncGenerator
// 使用场景：处理异步数据流，逐块读取大数据
// ==========================================

async function* asyncCounter(max: number): AsyncGenerator<number, void, unknown> {
  for (let i = 1; i <= max; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    yield i;
  }
}

async function consumeAsyncIterator(): Promise<void> {
  for await (const num of asyncCounter(5)) {
    console.log(`Received: ${num}`);
  }
}

consumeAsyncIterator();

// ==========================================
// 示例 9：将回调转换为 Promise
// 使用场景：为旧版基于回调的 API 提供 Promise 接口
// ==========================================

function readFileAsync(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 模拟 Node.js 风格的回调
    setTimeout(() => {
      if (path.endsWith(".txt")) {
        resolve(`Content of ${path}`);
      } else {
        reject(new Error("Invalid file type"));
      }
    }, 10);
  });
}

readFileAsync("data.txt")
  .then((content) => console.log(content))
  .catch((error) => console.error(error));

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// const badAwait = await 42; // ❌ await 只能用于 Promise 或 async 函数中

async function returnsPlain(): Promise<number> {
  // async 函数返回的值会被自动包装为 Promise
  return 42; // 实际返回 Promise<number>
}

async function wrongPromiseAll(): Promise<void> {
  const results = await Promise.all([Promise.resolve(1), Promise.resolve("two")]);
  // results 的类型是 [number, string]
  // @ts-expect-error results[0] 是 number，不能赋值给 boolean
  const wrong: boolean = results[0];
}

async function forgotAwait(): Promise<void> {
  const user = fetchUser(1);
  // user 是 Promise<{ id: number; name: string }>，不是实际值
  // @ts-expect-error user 是 Promise，不是对象，忘记 await 了
  console.log(user.name);
}

// ==========================================
// 本章小结
// ==========================================
// 1. Promise<T> 是 TS 异步编程的核心，T 是 resolve 时的值类型
// 2. async 函数总是返回 Promise<T>，await 会解包 Promise 的值
// 3. Promise.all 返回所有结果的组合类型；Promise.race 返回最快完成的类型
// 4. Promise.allSettled 返回 {status, value|reason} 数组，不会 reject
// 5. 异步错误处理用 try/catch，也可用 Result<T, E> 实现类型安全
// 6. AsyncGenerator 用于异步数据流，for await...of 是消费的标准方式
// 7. 对比：Rust 的 Future 是惰性的，TS 的 Promise 是立即执行的
