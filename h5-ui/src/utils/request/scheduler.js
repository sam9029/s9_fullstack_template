import { Queue } from './heap';

function getIdleCallback() {
  if (window?.requestIdleCallback) return window.requestIdleCallback.bind(window);

  return function (callback) {
    return setTimeout(callback, 50);
  };
}

function getCancelCallback() {
  if (window?.cancelIdleCallback) return window.cancelIdleCallback.bind(window);
  return window.clearTimeout.bind(window);
}

class Scheduler {
  constructor() {
    this.maxTaskNum = 1; // 每秒最多任务数
    this.runHandler = null;
    this.queue = new Queue();

    this.idleCallback = getIdleCallback();
    this.cancelCallback = getCancelCallback();
  }

  add(task) {
    let taskConstructor = task.getConstructor();
    // 更新最大任务限制数
    this.maxTaskNum = Math.max(this.maxTaskNum, taskConstructor.sizeLimit);
    this.queue.add(task);
    // 新加入任务 开启队列
    if (!this.runHandler) {
      this.start();
    }
  }

  run() {
    // 清除handle id
    this.stop();

    // TODO 根据任务类型不同 取出各类型任务 独立计算
    const pool = [];
    while (!this.queue.isEmpty() && pool.length < this.maxTaskNum) {
      let task = this.queue.poll();
      pool.push(task);
    }

    for (let i = 0; i < pool.length; i++) {
      let waked = pool[i].waker();
      // 未唤醒的 提升优先级 继续等待
      if (!waked) {
        pool[i].updatePriorityWhenUnWake();
        scheduler.add(pool[i]);
      }
    }

    // 还有任务 继续等待
    if (!this.queue.isEmpty()) {
      return this.start();
    }
  }

  start() {
    if (this.runHandler) return;
    this.runHandler = this.idleCallback(this.run.bind(this));
  }

  stop() {
    if (!this.runHandler) return;
    this.cancelCallback(this.runHandler);
    this.runHandler = null;
  }
}

const scheduler = new Scheduler();

export default scheduler;
