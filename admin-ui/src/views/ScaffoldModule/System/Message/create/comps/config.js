export const SETTLE_MAPPER = [
  { label: 'CPA订单', value: 1 },
  { label: 'CPA拉新', value: 2 },
  { label: 'CPS分成', value: 3 },
  { label: 'CPM分成', value: 4 },
];
export const SETTLEMENTCOLUMNS = [
  {
    show: true,
    prop: 'name',
    label: '结算方式',
    minWidth: '150',
    align: 'center',
  },
  {
    show: true,
    prop: 'publish',
    label: '发布',
    minWidth: '150',
    slots: { customRender: 'publish' },
    align: 'center',
  },
  // {
  //   show: true,
  //   prop: 'service',
  //   label: '服务',
  //   minWidth: '150',
  //   slots: { customRender: 'service' },
  //   align: 'center',
  // },
];

import { Boot } from '@wangeditor/editor';
class MyButtonMenu {
  constructor() {
    this.title = '预览'; // 自定义菜单标题
    // this.iconSvg = '<svg>...</svg>' // 可选
    this.tag = 'button';
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
    editor.emit('preview');
  }
}
let registered = false;
export function registerMenu() {
  if (registered) return;
  registered = true;
  // const menu1Conf = {
  //   key: 'preview', // 定义 menu key ：要保证唯一、不重复（重要）
  //   factory() {
  //     return new MyButtonMenu();
  //   },
  // };
  // Boot.registerMenu(menu1Conf);
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
