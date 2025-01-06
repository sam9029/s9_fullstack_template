export default {
  inserted: function (el, obj, vnode) {
    let isUse = obj.value || {
      top: true,
      left: true,
    }; // false  禁用top {left}
    // 鼠标手型
    el.style.cursor = 'move';
    // 通用的获取浏览器长宽
    let browerWidth = document.documentElement.clientWidth || document.body.clientWidth;
    let browerHeight = document.documentElement.clientHeight || document.body.clientHeight;
    let boxWidth = el.offsetWidth;
    let boxHeight = el.offsetHeight;
    el.onmousedown = (e) => {
      // 记录按下时鼠标的坐标和目标元素的 left、top 值
      let setLeft = e.clientX - el.offsetLeft; // 点击位置-元素距离边框位置
      let setTop = e.clientY - el.offsetTop;
      document.onmousemove = (event) => {
        // 鼠标移动时计算每次移动的距离，并改变拖拽元素的定位
        let left = event.clientX - setLeft; // 元素最终位置
        let top = event.clientY - setTop;
        // 边界控制
        if (left < 0) {
          left = 0;
        } else if (left > browerWidth - boxWidth) {
          left = browerWidth - boxWidth;
        }
        if (top < 0) {
          top = 0;
        } else if (top > browerHeight - boxHeight) {
          top = browerHeight - boxHeight;
        }
        // 判断使用情况
        isUse.left && (el.style.left = `${left}px`);
        isUse.top && (el.style.top = `${top}px`);
        // 阻止事件的默认行为，可以解决选中文本的时候拖不动
        return false;
      };
      // 鼠标松开时，拖拽结束
      document.onmouseup = () => {
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  },
};
