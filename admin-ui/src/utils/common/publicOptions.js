// dsp账户角色
const DSP_ACCOUNT_ROLE_OPPTIONS = [
  //   {
  //       label: "DSP管理员",
  //       value: "11"
  //   },
  {
    label: '平面设计师',
    value: '19',
  },
  {
    label: '平面负责人',
    value: '93',
  },
  {
    label: '视频编导',
    value: '20',
  },
  {
    label: '制片人',
    value: '60',
  },
  {
    label: '摄像师',
    value: '61',
  },
  {
    label: '后期制作',
    value: '62',
  },
  {
    label: '优化师',
    value: '63',
  },
  {
    label: '优化组长',
    value: '64',
  },
  {
    label: '优化指导',
    value: '65',
  },
  {
    label: '事业部负责人',
    value: '66',
  },
  {
    label: '运管',
    value: '67',
  },
  {
    label: '销售', // DSP销售=>销售
    value: '44',
  },
  {
    label: '服务中心',
    value: '68',
  },
  {
    label: '媒介',
    value: '69',
  },
  {
    label: '媒介负责人',
    value: '53',
  },
  {
    label: '编导组长',
    value: '81',
  },
  {
    label: '编导负责人',
    value: '82',
  },
  {
    label: '拍剪',
    value: '83',
  },
  {
    label: '拍剪组长',
    value: '84',
  },
  {
    label: '拍剪负责人',
    value: '85',
  },
  {
    label: '演员统筹',
    value: '86',
  },
  {
    label: '场地统筹',
    value: '87',
  },
  {
    label: '制片负责人',
    value: '88',
  },
  {
    label: '服化道统筹',
    value: '89',
  },
  {
    label: '场务',
    value: '90',
  },
  {
    label: '区域负责人',
    value: '91',
  },
  {
    label: '财务负责人',
    value: '36',
  },
  {
    label: '财务核算',
    value: '38',
  },
  {
    label: 'HR',
    value: '92',
  },
];

// 事业部
// const DEPARTMENT_OPTIONS_MAPPER = [
//     {
//         label: '加应',
//         value: 1,
//     },
//     {
//         label: '今日头条',
//         value: 2,
//     },
//     {
//         label: '网易易效',
//         value: 3,
//     },
//     {
//         label: '网易云音乐',
//         value: 4,
//     },
//     {
//         label: '爱奇艺',
//         value: 5,
//     },
//     {
//         label: '京东',
//         value: 6,
//     },
//     {
//         label: '网易品牌',
//         value: 7,
//     },
//     {
//         label: '搜狗',
//         value: 8,
//     },
//     {
//         label: '广点通',
//         value: 9,
//     }
// ]

// 事业部
const DEPARTMENT_OPTIONS_MAPPER = [
  {
    label: '加应DSP业务部',
    value: 1,
  },
  {
    label: '今日头条事业部',
    value: 2,
  },
  {
    label: '网易事业部',
    value: 3,
  },
  // {
  //     label: '网易云音乐',
  //     value: 4,
  // },
  {
    label: '爱奇艺事业部',
    value: 5,
  },
  {
    label: '京东项目部',
    value: 6,
  },
  // {
  //     label: '网易品牌',
  //     value: 7,
  // },
  {
    label: '搜狗事业部',
    value: 8,
  },
  {
    label: '广点通事业部',
    value: 9,
  },
  {
    label: '品牌事业部',
    value: 10,
  },
  {
    label: '创意部',
    value: 11,
  },
  {
    label: '技术部',
    value: 12,
  },
  {
    label: '快手事业部',
    value: 13,
  },
];

// 权限类型
const ROLE_TYPE_OPTIONS = [
  {
    label: '管理员',
    value: '2',
  },
  {
    label: '代理商',
    value: '3',
  },
  {
    label: '运营',
    value: '4',
  },
  {
    label: '客户',
    value: '5',
  },
  {
    label: '访客',
    value: '6',
  },
];

const AD_POSITION_OPTIONS = [
  { label: '信息流', value: 1 },
  { label: 'BANNER', value: 2 },
  { label: '开屏', value: 3 },
  { label: '插屏', value: 6 },
  { label: '竖版视频', value: 12 },
  { label: '贴片广告', value: 15 },
  { label: '激励视频', value: 16 },
];

const REGION_OPTIONS = [
  { label: '北京', value: 1 },
  { label: '成都', value: 2 },
  { label: '合肥', value: 3 },
  { label: '重庆', value: 4 },
];
const AD_CONTENT_OPTIONS = {
  1: [
    // 信息流
    { value: '101', label: '信息流大图' },
    { value: '102', label: '信息流组图' },
    { value: '103', label: '信息流小图' },
    { value: '407', label: '信息流小图下载' },
    { value: '408', label: '信息流大图下载' },
    { value: '201', label: '横版视频-信息流' },
    { value: '202', label: '竖版视频-信息流' },
    { value: '405', label: '文字链' },
    { value: '406', label: 'GIF横版大图' },
    { value: '409', label: 'GIF竖版大图' },
    { value: '104', label: '普通博文' },
    { value: '105', label: '大Card' },
    { value: '106', label: '九宫格' },
    { value: '212', label: '普通博文横版视频' },
    { value: '213', label: '普通博文竖版视频' },
    { value: '204', label: '大Card横版视频' },
    { value: '205', label: '大Card横版视频' },
  ],
  2: [
    // banner
    { value: '107', label: '通栏' },
    { value: '410', label: '通栏GIF' },
    { value: '411', label: '通栏SWF' },
    { value: '108', label: '矩形' },
    { value: '412', label: '矩形GIF' },
    { value: '413', label: '矩形SWF' },
    { value: '109', label: '焦点图' },
    { value: '414', label: '焦点图GIF' },
    { value: '415', label: '焦点图SWF' },
  ],
  3: [
    // 开屏
    { value: '110', label: '开屏图文' },
    { value: '210', label: '开屏视频' },
    { value: '416', label: '开屏GIF' },
  ],
  6: [
    // 插屏
    { value: '111', label: '插屏' },
  ],
  12: [
    // 竖版视频
    { value: '306', label: '竖版视频-视频' },
  ],
  15: [
    // 贴片
    { value: '401', label: '视频' },
    { value: '402', label: '图片' },
  ],
  16: [
    // 激励视频
    { value: '403', label: '横版视频-激励视频' },
    { value: '404', label: '竖版视频-激励视频' },
  ],
};

const SPREAD_OPTIONS = [
  { label: '应用下载', value: '1,3' },
  { label: '销售线索收集', value: '4' },
  { label: '商品推广', value: '2,5' },
];

const STATUS_OPTIONS = [
  {
    label: '全部',
    value: null,
  },
  {
    label: '开启',
    value: 0,
  },
  {
    label: '关闭',
    value: 2,
  },
];

const STATUS_FLAG_OPTIONS = [
  {
    label: '开启',
    value: 0,
  },
  {
    label: '关闭',
    value: 2,
  },
];

const AUTH_TYPE = [
  {
    label: '系统默认',
    value: 1,
  },
  // {
  //     label: "角色",
  //     value: 2
  // },
  {
    label: '部门',
    value: 3,
  },
  // {
  //     label: "区域",
  //     value: 4
  // },
  {
    label: '公司',
    value: 4,
  },
];

const CHANNEL_OPTIONS = [
  { label: '巨量引擎', value: 1 },
  { label: '爱奇艺', value: 2 },
  { label: '广点通', value: 3 },
  { label: '磁力引擎', value: 4 },
  { label: '巨量千川', value: 5 },
];

export {
  DSP_ACCOUNT_ROLE_OPPTIONS,
  DEPARTMENT_OPTIONS_MAPPER,
  ROLE_TYPE_OPTIONS,
  AD_POSITION_OPTIONS,
  AD_CONTENT_OPTIONS,
  SPREAD_OPTIONS,
  STATUS_OPTIONS,
  STATUS_FLAG_OPTIONS,
  REGION_OPTIONS,
  AUTH_TYPE,
  CHANNEL_OPTIONS,
};
