// // 创建一个新的指令

import { render, h, computed } from 'vue';
import { Loading } from 'vant';
import { useAppStoreWithOut } from '@/store/modules/app';

// 获取H5自定义颜色
const appStore = useAppStoreWithOut();
const themeColor = computed(() => appStore.getThemeColor);

const loadingIconColor = themeColor.value;
const loadingMaskBgColor = 'rgba(255, 255, 255, 0.3)';

const mount = (el) => {
  el.childNodes.forEach((item) => {
    item.style && (item.style.opacity = '0');
  });
  // 绑定节点下创建子节点
  let parent = el.querySelector('#__LOADING_PARENT__');
  if (!parent) {
    parent = document.createElement('div');
    parent.style.position = 'relative';
    parent.id = '__LOADING_PARENT__';
    if (el.firstChild) {
      el.insertBefore(parent, el.firstChild);
    } else {
      el.appendChild(parent);
    }
  }
  parent.style.opacity = '1';
  const elStyle = window.getComputedStyle(el, null);
  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    flexDirection: 'column',
    left: `-${elStyle.paddingLeft}`,
    width: `${el.clientWidth}px`,
    height: `${el.clientHeight}px`,
    // backgroundColor: loadingMaskBgColor,
    opacity: 1,
    zIndex: 1000,
  };
  render(
    h(Loading, {
      class: 'directive-baseLoading',
      color: loadingIconColor,
      size: '40px',
      style,
    }),
    parent,
  );
};

const unmount = (el) => {
  el.childNodes.forEach((item) => {
    item.style && (item.style.opacity = '1');
  });
  const loading = el.querySelector('#__LOADING_PARENT__');
  if (!loading) return;
  el.removeChild(loading);
};

export const baseLoading = {
  // 在绑定元素的父组件 及他自己的所有子节点都挂载完成后调用
  mounted: (el, binding) => {
    binding.value && mount(el);
  },
  // 在绑定元素的父组件 及他自己的所有子节点都更新后调用
  updated: (el, binding) => {
    binding.value ? mount(el) : unmount(el);
  },
};
