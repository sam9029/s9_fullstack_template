export default {
  inserted: function (el, binding) {
    // 获取element-ui定义好的scroll盒子
    const SELECTWRAP_DOM = el.querySelector('.el-select-dropdown .el-select-dropdown__wrap');
    if (SELECTWRAP_DOM) {
      el.__SCROLL_ELEMENT = SELECTWRAP_DOM;
      el.__loadMoreScrollHander = function () {
        /**
         * scrollHeight 获取元素内容高度(只读)
         * scrollTop 获取或者设置元素的偏移值,
         *  常用于:计算滚动条的位置, 当一个元素的容器没有产生垂直方向的滚动条, 那它的scrollTop的值默认为0.
         * clientHeight 读取元素的可见高度(只读)
         * 如果元素滚动到底, 下面等式返回true, 没有则返回false:
         * ele.scrollHeight - ele.scrollTop === ele.clientHeight;
         */
        const condition = this.scrollHeight - this.scrollTop <= this.clientHeight + 5;
        if (condition) binding.value();
      };
      SELECTWRAP_DOM.addEventListener('scroll', el.__loadMoreScrollHander);
    }
  },
  unbind: function (el, binding) {
    const SELECTWRAP_DOM = el.__SCROLL_ELEMENT;
    if (SELECTWRAP_DOM) {
      SELECTWRAP_DOM.removeEventListener('scroll', el.__loadMoreScrollHander);
    }
    delete el.__loadMoreScrollHander;
    delete el.__SCROLL_ELEMENT;
  },
};
