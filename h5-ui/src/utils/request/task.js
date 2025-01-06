import request from './request';

class BaseTask {
  static name = 'task name';
  static sizeLimit = 1; // 限制任务数
  static timeLimit = 1000; // 限制时间长度
  static size = 0; // 限制时间长度内已执行多少任务
  static lastTime = 0; // 限制时间长度的起始记录点

  createTime = 0; // 任务的创建时间
  priority = 0; // 任务优先级
  success = Promise.resolve; // 成功执行后回调
  fail = Promise.resolve; // 失败回调

  constructor() {
    this.createTime = performance.now();
  }

  // 获取class 方便取静态属性
  getConstructor() {
    return Object.getPrototypeOf(this).constructor;
  }

  // 每种任务判断是否可以唤醒(尝试执行)
  waker() {
    const now = performance.now();
    let classConstructor = this.getConstructor();

    if (now - classConstructor.lastTime >= classConstructor.timeLimit) {
      classConstructor.lastTime = now;
      classConstructor.size = 0;
    }
    if (classConstructor.size >= classConstructor.sizeLimit) return false;
    classConstructor.size += 1;

    this.exec();
    return true;
  }

  // 未能唤醒时 是否更改优先级防止低优先级一直不执行
  updatePriorityWhenUnWake() {
    this.priority += 0;
  }

  // 执行具体任务
  exec() {
    console.error('need impl!');
    this.clearCallbackRef();
  }

  // 清理回调引用 promise持有resolve、reject不会释放
  clearCallbackRef() {
    delete this.success;
    delete this.fail;
  }
}

const PriorityRequest = {
  get: 20,
  post: 10,
  put: 10,
};

export class ReuestTask extends BaseTask {
  static name = 'ReuestTask';
  static sizeLimit = 5;
  static timeLimit = 1000;
  // static size = 0;
  // static lastTime = 0;

  // priority = 0;
  // success = Promise.resolve;
  // fail = Promise.resolve;
  method = 'get';

  constructor(config) {
    super();
    this.config = config;
    this.method = this.getMethodName(config);
    this.priority = PriorityRequest[this.method] || PriorityRequest.get;
  }

  getMethodName(config) {
    let method = config.method || 'get';
    return method.toLocaleLowerCase();
  }

  updatePriorityWhenUnWake() {
    let now = performance.now();
    // 尝试唤醒过任务的降低优先级 给其他任务机会 但不能降太低
    if (now - this.createTime <= 3000 && this.priority >= 10) {
      this.priority -= 2;
    }
  }

  exec() {
    request(this.config)
      .then((data) => {
        this.success(data);
        this.clearCallbackRef();
      })
      .catch((err) => {
        this.fail(err);
        this.clearCallbackRef();
      });
  }

  clearCallbackRef() {
    delete this.success;
    delete this.fail;
  }
}
