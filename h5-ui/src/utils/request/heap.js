class Heap {
  /**@type {T[]} */
  collection = [];

  constructor(compare) {
    /**
     * @member
     * @type {(a:T, b:T) => number}
     */
    this.compare = compare;
  }

  get size() {
    return this.collection.length;
  }

  getLeftIndex(parentIndex) {
    return parentIndex * 2 + 1;
  }
  getRightIndex(parentIndex) {
    return parentIndex * 2 + 2;
  }
  getParentIndex(childIndex) {
    return Math.floor((childIndex - 1) / 2);
  }

  hasLeftChild(parentIndex) {
    return this.getLeftIndex(parentIndex) < this.collection.length;
  }
  hasRightChild(parentIndex) {
    return this.getRightIndex(parentIndex) < this.collection.length;
  }
  hasParent(childIndex) {
    return this.getParentIndex(childIndex) >= 0;
  }

  getLeftChild(parentIndex) {
    return this.collection[this.getLeftIndex(parentIndex)];
  }
  getRightChild(parentIndex) {
    return this.collection[this.getRightIndex(parentIndex)];
  }
  getParent(childIndex) {
    return this.collection[this.getParentIndex(childIndex)];
  }

  swapWithOutFix(idx1, idx2) {
    [this.collection[idx1], this.collection[idx2]] = [this.collection[idx2], this.collection[idx1]];
  }

  /** @returns { T? } */
  peek() {
    if (this.collection.length == 0) return null;
    return this.collection[0];
  }

  /** @returns { T? } */
  poll() {
    if (this.collection.length === 0) {
      return null;
    }

    if (this.collection.length === 1) {
      return this.collection.pop();
    }

    const item = this.collection[0];

    // 将叶节点移至根 修正
    this.collection[0] = this.collection.pop();
    this.heapifyDown();

    return item;
  }

  /**
   * @param {T} parent
   * @param {T} child
   * @returns { boolean }
   */
  isParentChildCorrect(parent, child) {
    throw 'need imp1';
  }

  /**
   * @param { T } item
   * @returns { this }
   */
  add(item) {
    this.collection.push(item);
    this.heapifyUp();
    return this;
  }

  remove(item) {
    const removeItems = this.find(item);

    removeItems.forEach((i) => {
      if (i == this.collection.length - 1) {
        this.collection.pop();
      } else {
        this.collection[i] = this.collection.pop();

        if (!this.hasParent(i)) {
          return this.heapifyDown(i);
        }
        if (this.isParentChildCorrect(this.getParent(i), this.collection[i])) {
          return this.heapifyDown(i);
        }
        return this.heapifyUp(i);
      }
    });

    return this;
  }

  /** @returns { number[] } */
  find(item) {
    let indexs = [];
    this.collection.forEach((v, i) => {
      if (this.compare(item, v) === 0) {
        indexs.push(i);
      }
    });
    return indexs;
  }

  isEmpty() {
    return !this.collection.length;
  }

  heapifyUp(index) {
    // 默认叶节点向根
    let i = index || this.collection.length - 1;

    while (this.hasParent(i)) {
      let parent = this.getParent(i);
      if (!this.isParentChildCorrect(parent, this.collection[i])) {
        let parIdx = this.getParentIndex(i);
        this.swapWithOutFix(i, parIdx);
        i = parIdx;
      } else {
        break;
      }
    }
  }

  _downNext(i) {
    let next = null;
    let left = 0,
      right = 0;
    if (this.hasLeftChild(i)) {
      left = this.getLeftIndex(i);
    }
    if (this.hasRightChild(i)) {
      right = this.getRightIndex(i);
    }

    if (!left && !right) return null;
    if (!left) next = right;
    if (!right) next = left;
    if (!next) {
      let isLeftCorrectRight = this.isParentChildCorrect(
        this.collection[left],
        this.collection[right],
      );
      next = isLeftCorrectRight ? left : right;
    }
    return next;
  }

  heapifyDown(index) {
    let i = index || 0;

    let next = this._downNext(i);
    while (next) {
      if (!this.isParentChildCorrect(this.collection[i], this.collection[next])) {
        this.swapWithOutFix(i, next);
        i = next;
        next = this._downNext(i);
      } else {
        break;
      }
    }
  }
}

function maxCompare(task1, task2) {
  return task1.priority - task2.priority;
}

export class Queue extends Heap {
  constructor() {
    super(maxCompare);
  }

  isParentChildCorrect(parnet, child) {
    return parnet.priority >= child.priority;
  }
}
