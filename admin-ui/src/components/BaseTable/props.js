// table props 默认
export const tableProps = {
  data: {
    type: Array,
    default: () => [],
  },
  height: {
    type: [String, Number],
  },
  maxHeight: {
    type: [String, Number],
  },
  stripe: {
    type: Boolean,
    default: true,
  },
  border: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'small',
    validator: function (value) {
      return ['medium', 'small', 'mini'].indexOf(value) !== -1;
    },
  },
  fit: { type: Boolean, default: true },
  showHeader: {
    type: Boolean,
    default: true,
  },
  // 不建议使用原有的行点击事单选这个事件;
  // highlightCurrentRow: {
  //   type: Boolean,
  //   default: false,
  // },

  currentRowKey: {
    type: [String, Number],
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  defaultExpandAll: {
    type: Boolean,
    default: false,
  },
  expandRowKeys: {
    type: Array,
  },
  tooltipEffect: {
    type: String,
    default: 'dark',
  },
  rowClassName: {
    type: Function,
  },
  treeProps: {
    type: Object,
    default: null,
  },
  spanMethod: {},
};

// pagination props 默认
export const paginationProps = {
  small: {
    type: Boolean,
    default: false,
  },
  background: {
    type: Boolean,
    default: true,
  },
  pagerCount: {
    type: Number,
    default: 5,
  },
  layout: {
    type: String,
    default: 'total, prev, pager, next, sizes, jumper',
  },
  prevText: {
    type: String,
    default: '<',
  },
  nextText: {
    type: String,
    default: '>',
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 80, 100],
  },
  pagination: {
    type: [Object, Boolean],
    default: () => {},
  },
  hideOnSinglePage: {
    type: Boolean,
  },
  useCount: {
    type: Boolean,
    default: true,
  },
  pageMode: {
    type: String,
    default: 'site', //分页模式，site 指分页不传page，只传next_page_site 和page_size , page 是指传page 和page_size
  },
};

// 新增可传入props
export const basicProps = {
  model: {
    type: String,
    default: 'block',
  },
  header: {
    type: Boolean,
    default: true,
  },
  title: {
    // 表格左上角标题 优先级高于插槽title
    type: String,
    default: '',
  },
  type: {
    // 单选 多选 展开 index
    // radio selection expand index
    type: [String, Array],
  },
  selectable: {
    type: Function,
  },
  canResize: {
    // 自适应高度
    type: Boolean,
    default: true,
  },
  columns: {
    type: Array,
    default: () => [],
  },
  columnsGroup: {
    // 自定义类 分组
    type: Array,
    default: () => [],
  },
  columnsKey: {
    // 自定义列存储 Key
    type: String,
    default: '',
  },
  loading: {
    // 表格主体部分加载状态
    type: Boolean,
    default: false,
  },
  unFullscreen: {
    // 不启用全屏按钮
    type: Boolean,
    default: false,
  },
  unRefresh: {
    // 不启用刷新按钮
    type: Boolean,
    default: false,
  },
  unCustom: {
    // 不启用自定义列
    type: Boolean,
    default: false,
  },
  paginationShow: {
    // 启用分页
    type: Boolean,
    default: true,
  },

  minHeight: {
    type: Number,
    default: 300,
  },

  ...tableProps,
  ...paginationProps,
};
