import { Boot } from '@wangeditor/editor';
class MyButtonMenu {
  constructor(_options) {
    let { title, tag, keyName } = _options;
    this.title = title; // 自定义菜单标题
    this.tag = tag; // 自定义菜单按钮类型
    this.keyName = keyName; // 自定义菜单键名称
    // this.iconSvg = '<svg>...</svg>' // 可选
  }

  // 获取菜单执行时的 value ，用不到则返回空 字符串或 false
  getValue(editor) {
    return false;
  }

  // 菜单是否需要激活（如选中加粗文本，“加粗”菜单会激活），用不到则返回 false
  isActive(editor) {
    return false;
  }

  // 菜单是否需要禁用（如选中 H1 ，“引用”菜单被禁用），用不到则返回 false
  isDisabled(editor) {
    return false;
  }

  // 点击菜单时触发的函数
  exec(editor, value) {
    if (this.isDisabled(editor)) return;
    editor.emit(this.keyName);
  }
}

let registered = false;
export function registerMenu() {
  if (registered) return;
  registered = true;
  const menu1Conf = {
    key: 'preview', // 定义 menu key ：要保证唯一、不重复（重要）
    factory() {
      return new MyButtonMenu({ title: '预览', tag: 'button', keyName: 'preview' });
    },
  };
  Boot.registerMenu(menu1Conf);
}

import { streamUpload } from '@/api/public.js';
import { promiseFileMd5 } from '@/utils/common/tools.js';

export function editorUpload(file) {
  return promiseFileMd5(file)
    .then((md5) => {
      const params = {
        name: file.name,
        md5,
        allow_repeat: true,
      };
      return streamUpload(file, params);
    })
    .then((res) => {
      return res.data;
    });
}
