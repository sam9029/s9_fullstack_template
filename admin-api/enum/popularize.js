exports.CONFIGURE_STATUS_MAPPER = {
  1: "未验证",
  2: "成功",
  3: "失败",
};

exports.FEEDBACK_OPTION = [
  {
    label: "图文",
    value: 1,
  },
  {
    label: "视频",
    value: 2,
  },
];
exports.FEEDBACK_TYPE_MAPPER = {
  1: "图文",
  2: "视频",
};

exports.VERIFY_STATUS_OPTIONS = [
  {
    label: "审核中",
    value: 1,
  },
  {
    label: "审核通过",
    value: 2,
  },
  {
    label: "审核拒绝",
    value: 3,
  },
  {
    label: "待送审",
    value: 4,
  },
];
const BASE_VERIFY_STATUS = {
  1: "审核中",
  2: "审核通过",
  3: "审核拒绝",
  4: "待送审",
};
exports.VERIFY_STATUS_MAPPER = {
  ...BASE_VERIFY_STATUS,
  5: "干预过期",
};

exports.PERIOD_VERIFY_MAPPER = {
  ...BASE_VERIFY_STATUS,
  5: "部分通过",
};

// 关键词内容类型
exports.KEYWORD_CONTENT_TYPE_MAPPER = {
  1: "非会员内容",
  2: "会员内容",
};
exports.PUBLISH_STATUS_OPTIONS = [
  { label: "发布待审核", value: 4 },
  { label: "发布中", value: 5 },
  { label: "发布无效", value: 6 },
  { label: "发布过期", value: 7 },
];

exports.IMPORT_STATUS_MAPPER = {
  1: "匹配成功",
  2: "匹配失败",
  3: "重复导入",
};

exports.SETTLE_DATA_MAPPER = {
  1: "待结算",
  2: "结算中",
  3: "已结算",
};

exports.TASK_SETTLE_TYPE_MAPPER = {
  1: "广告分成",
  2: "支付分成",
  3: "支付分成绑定",
  6: "新增日活用户",
};

exports.VERSION_MAPPER = {
  1: "V1版本",
  2: "V2版本",
};

exports.CONTENT_HEADERS = {
  advertiser_type: "项目产品",
  cover_url: "封面链接",
  describe: "内容简介",
  link: "内容链接",
  preview: "精彩试读",
  order: "排序",
  book_name: "内容名称",
  book_id: "内容ID",
  book_author: "作者",
  title: "标题",
  content_summary: "预览概述",
  serialized_status: "连载状态",
  copyright: "版权",
};
exports.SERIALIZED_STATUS_MAPPER = {
  1: "完结",
  2: "连载",
};

exports.COPYRIGHT_MAPPER = {
  1: "番茄版权",
  2: "晋江版权",
  3: "其他",
};

exports.VIDEO_MAPPER = {
  1: "是",
  2: "否",
};

exports.JUMP_LINK_MAPPER = [
  {
    label: "提现",
    value: "https://www.baidu.com",
  },
  {
    label: "个人中心",
    value: "https://www",
  },
];

exports.REBATE_VERIFY_MAPPER = {
  1: "未提交",
  2: "审核中",
  3: "审核通过",
  4: "审核拒绝",
};

exports.PUBLISH_STATUS_MAPPER = {
  1: '待发布',
  2: '已发布待审核',
  3: '发布生效中',
  4: '发布审核拒绝',
};

exports.AUTH_ACCOUNT_MAPPER = {
  IN_APPROVE: '审核中',
  APPROVED: '审核通过',
  REJECT: '审核拒绝',
  REBIND_APPROVE: '换绑审核中',
  REBIND_REJECT: '审核拒绝，已在其他平台绑定',
};

exports.MAIN_CONTENT_MAPPER = {
  1: '最新热剧',
  2: '爆款短剧',
  3: '爆款小说',
  4: '爆款漫画',
  5: '找任务',
};


exports.BUDGET_LEVEL = {
  ONE_HUNDRED_THOUSAND: "十万级预算",
  MILLION: "百万级预算",
  TEN_MILLION: "千万级预算",
  UN_LIMIT: "不限预算"
}

// 星图-结算方式(星图文档)
// exports.XT_PAY_TYPE_MAPPER = {
//   1: '视频按等级发奖（按等级结算）',
//   2: '自定义（自定义结算）',
//   3: '按激活付费（按转化结算）',
//   4: '按效果付费（按有效播放量结算）',
//   5: '按cps付费（按销售量结算）',
//   8: '按广告分成结算（按广告分成结算）',
//   9: '按核销量付费（按核销量结算）',
//   10: '暗投CPA（按转化结算）',
//   11: '新版按广告分成结算（按广告分成结算）',
//   12: '一口价招募模式（按一口价结算）',
//   13: '根据业务方分成（自定义结算）',
//   14: '按分成付费（按付费分佣结算）',
//   15: '交换作品（达人作品和客户的物品）、好物测评',
//   16: 'ocpm付费',
// };

// 星图-结算方式（运营自定义)
exports.XT_PAY_TYPE_MAPPER = {
  1: '按视频等级结算',
  3: '激活单价',
  4: '播放量结算',
  5: '按销售量结算',
  8: '广告分成',
  9: '核销量单价',
  11: '广告分成',
  12: '一口价结算',
  14: '支付分成',
};

exports.TASK_STATUS_MAPPER = {
  WAIT_LINE: "未上线",
  NOT_START: "未开始",
  ONLINE: "投稿进行中",
  ENDED: "已结束",
  OFFLINE: "已下线",
};

// 星图推广--结算方式
// 视频类型
exports.XINGTU_VIDEO_TYPE_MAPPER = {
  6: '短视频任务',
  55: '直播任务',
};

// 星图结算--推广--结算方式
exports.XINGTU_PAY_TYPE_MAPPER = {
  1: '视频按等级发奖（按等级结算）',
  2: '自定义（自定义结算）',
  3: '按激活付费（按转化结算）',
  4: '按效果付费（按有效播放量结算）',
  5: '按cps付费（按销售量结算）',
  8: '按广告分成结算（按广告分成结算）',
  9: '按核销量付费（按核销量结算）',
  10: '暗投CPA（按转化结算）',
  11: '新版按广告分成结算（按广告分成结算）',
  12: '一口价招募模式（按一口价结算）',
  13: '根据业务方分成（自定义结算）',
  14: '按分成付费（按付费分佣结算）',
  15: '交换作品（达人作品和客户的物品）、好物测评',
  16: 'ocpm付费',
};
// 考核指标
exports.XINGTU_EVALUATE_TYPE_MAPPER = {
  1: '视频播放量',
  2: '视频转赞评总量',
  3: '视频效果',
  4: '视频转化量',
  5: '视频有效播放量',
  6: '线索数量',
  7: '销售量',
  8: '组件点击',
  9: '组件展示',
  10: '下载数量',
  11: '有效线索数量',
  12: '有效销售额',
  13: '广告分成',
  14: '团购券核销量',
  15: '广告分成',
  16: '一口价招募模式',
  31: '引流到站-组件点击',
  32: '引流到站-APP唤起',
  33: '注册量',
  34: '首单转化量',
  35: '预约量',
  36: '付费量',
  121: '按分成付费-游戏cps',
  131: '小程序直播推广计划',
  132: '按安装付费-游戏发行人',
  133: '按激活付费-游戏发行人',
  134: '按播放量付费-游戏发行人',
  135: '按播放量付费-游戏发行人v2',
  136: '按安装付费-游戏发行人v2',
  137: '按激活付费-游戏发行人v2',
  138: '按预约付费-游戏发行人v2',
  140: '按安装付费-授权挂载',
  141: '按激活付费-授权挂载',
  142: '按线索付费-授权挂载',
  201: '客户自定义',
  150: '按播放量付费-好物测评',
  151: '组件点击量-好物测评',
  152: '自然播放量',
  153: '自然流量的激活',
};

// 一级行业
exports.XINGTU_FIRST_CLASS_CATEGORY = {
  1901: '3C及电器',
  1902: '快速消费品',
  1903: '食品饮料',
  1904: '服装配饰',
  1905: '医疗健康',
  1906: '商务服务',
  1907: '本地服务',
  1908: '房地产',
  1909: '家居建材',
  1910: '教育',
  1911: '出行旅游',
  1912: '社会公共',
  1913: '游戏',
  1914: '零售',
  1915: '交通工具',
  1916: '汽车',
  1917: '农林牧畜渔',
  1918: '化工及能源',
  1919: '电子电工',
  1920: '机械设备',
  1921: '文体娱乐',
  1922: '传媒资讯',
  1923: '物流业',
  1924: '通信',
  1925: '金融业',
  1927: '餐饮服务',
  1928: '工具类软件',
  1929: '招商加盟',
  1930: '美妆',
  1931: '母婴宠物',
  1933: '日化',
  1934: '实体书籍',
  1935: '社交通讯',
};

// 二级行业
exports.XINGTU_SECOND_CLASS_CATEGORY = {
  190301: '零食/坚果/特产',
  190309: '其他食品饮料',
  190602: '传媒服务商',
  190701: '生活服务综合平台',
  190715: '结婚服务',
  190917: '家装平台',
  191103: 'OTA（online travel Agent）',
  191301: '休闲游戏',
  191302: '棋牌桌游',
  191303: '角色扮演',
  191305: '体育竞技',
  191308: 'MOBA',
  191309: '其他游戏',
  191310: '射击游戏',
  191311: '动作游戏',
  191312: 'SLG',
  191313: '塔防游戏',
  191314: '模拟经营',
  191315: '卡牌游戏',
  191317: '游戏平台',
  191401: '综合类2B电商',
  191403: '综合类2C电商',
  191601: '汽车厂商',
  191606: '汽车综合服务平台',
  192114: '其他文体娱乐',
  192203: '影视综艺音像制作',
  192204: '数字版权',
  192208: '网络视听',
  192209: '其他传媒资讯',
  192211: '资讯',
  192401: '电信运营商',
  192501: '银行业',
  192801: '软件工具',
  192804: '实用工具',
  192805: '其他工具类软件',
  193502: '交友类社交通讯',
};

// 组件类型
exports.XINGTU_ITEM_COMPONENT_TYPE = {
  1: '落地页',
  2: '门店',
  3: '电商',
  4: '游戏站',
  5: '影视',
  6: '小程序/小游戏',
  9: '汽车行业锚点',
  10: '电商行业锚点',
  12: '保险行业锚点',
  13: '教育行业锚点',
  14: '家装行业锚点',
  15: '网服下载锚点',
  23: '招商行业锚点',
  26: '游戏行业锚点',
  27: '通信行业锚点',
  40: '直播小程序组件',
  41: '商城锚点',
  42: '店铺锚点',
  43: '直播小手柄组件',
  46: '短剧/合集组件',
  48: '高级在线预约组件',
  49: '在线咨询组件',
  56: '直播小游戏',
}