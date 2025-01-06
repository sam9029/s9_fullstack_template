import { values } from "lodash";

export const PRODUCT_TYPE = {
  app: 'App',
  applet: '小程序',
};

export const REWARD_MAPPER = {
  custom: '客户',
  platform: '平台',
};

export const STATUS_MAPPER = {
  1: '启用',
  2: '停用',
  3: '删除',
};

export const STATUS_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '停用', value: 2 },
  { label: '删除', value: 3 },
];

// 广告主
export const ADVERTISER_TYPE_MAPPER = {
  1: '知乎',
  2: '书旗小说',
  3: 'QQ阅读',
  4: '快看漫画',
  5: '夸克',
  6: 'UC故事',
  7: '番茄小说',
  8: '番茄畅听',
  9: '开间小店',
};

// 广告主简称
export const ADVERTISER_TYPE_SHORT = {
  1: 'ZH',
  2: 'SQ',
  3: 'Q阅',
  4: 'KKMH',
  5: 'KK',
  6: 'UC',
  7: 'FQXS',
  8: 'FQCT',
  9: 'KJXD',
};

export const HAS_POLICY_MAPPER = {
  1: '已报价',
  2: '未报价',
};

export const EFFECTIVE_POLICY_MAPPER = {
  1: '有效',
  2: '无效',
};

export const POLICY_STATUS_MAPPER = {
  //0: 未创建 1：未提交 2：审核中，3：审核通过，4：审核拒绝，5:已召回 6: 已过期', 8、删除或停用
  0: '未创建报价',
  1: '报价未提交',
  2: '报价审核中',
  3: '报价审核通过',
  4: '报价审核拒绝',
  5: '报价已召回',
  6: '报价已过期',
  8: '报价删除或停用',
};

export const MESSAGE_TEMPLATE = {
  //关键词送审通知
  101: [
    {
      label: '项目名称',
      model: 'project_name',
      type: 'text',
    },
    {
      label: '送审时间',
      model: 'verify_time',
      type: 'DateTimePicker',
      format: 'yyyy-MM-dd HH:mm',
      valueFormat: 'yyyy-MM-dd HH:mm',
    },
    {
      label: '温馨提示',
      model: 'remark',
      type: 'textarea',
    },
  ],
  //发布作品送审通知
  102: [
    {
      label: '项目名称',
      model: 'project_name',
      type: 'text',
    },
    {
      label: '送审时间',
      model: 'verify_time',
      type: 'DateTimePicker',
      format: 'yyyy-MM-dd HH:mm',
      valueFormat: 'yyyy-MM-dd HH:mm',
    },
    {
      label: '温馨提示',
      model: 'remark',
      type: 'textarea',
    },
  ],
  201: {
    //关键词审核通知
    项目名称: 'project_name',
    审核时间: 'verify_feedback_time',
    审核通过: 'verify_success',
    审核拒绝: 'verify_reject',
  },
  202: {
    //发布作品审核通知
    项目名称: 'project_name',
    审核时间: 'verify_feedback_time',
    审核通过: 'verify_success',
    审核拒绝: 'verify_reject',
  },
  301: {
    //新增收益结算通知
    结算日期: 'date',
    新增收益: 'income',
  },
  401: {
    //收益入账通知
    入账时间: 'date',
    入账金额: 'income',
    收款账户: 'reciver_bank',
    收款人姓名: 'reciver_name',
  },
  601: '关键词通用预警',
  602: '待发布提醒消息',
  603: '发布到期提醒',
  604: {
    //博主入驻提醒
    入驻时间: 'create_time',
    博主姓名: 'blogger_id',
    博主ID: 'blogger_name',
  },
  605: [
    {
      label: '反馈时间',
      model: 'feedback_time',
      type: 'text',
    },
    {
      label: '反馈主题',
      model: 'title',
      type: 'text',
    },
    {
      label: '回复内容',
      type: 'textarea',
      model: 'content',
    },
    {
      label: '回复时间',
      type: 'text',
      model: 'reply_time',
    },
  ],
  default: {
    内容: 'remark',
    发送时间: 'create_time',
  },
};

export const VERIFY_MAPPER = {
  1: '待送审',
  2: '审核中',
  3: '审核通过',
  4: '审核拒绝',
};


// 政策状态
export const POLICY_MAPPER = {
  1: '未提交',
  2: '审核中',
  3: '审核通过',
  4: '审核拒绝',
  5: '已召回',
  6: '已过期',
};

// 审批流状态
export const APPROVAL_PROCESS_MAPPER = POLICY_MAPPER;

// 项目产品-推广方式
export const ADVERTISERPROMOTIONTYPE = {
  /* before */ 
  // 1: '关键词推广',
  // 2: '小程序推广',

  /* 小果繁星 xgfx */ 
  1:"关键词推广",
  2:"分发任务",
  3:"聚星推广",
  4:"小程序推广计划",
  5:"星图推广",
  6:"星广联投",

  /* 铂耀 boyao
    - 如上同样
  */ 
};
export const ADVERTISER_PROMOTIONTYPE_OPTS = [
  {label:"关键词推广",value:1},
  {label:"分发任务",value:2},
  {label:"聚星推广",value:3},
  {label:"小程序推广计划",value:4},
  {label:"星图推广",value:5},
  {label:"星广联投",value:6},
];

// 推广方式

// 财务单单独用的推广方式
export const PROMOTIONTYPE = {
  1: '关键词推广',
  2: '小程序推广',
  3: '抖音推广计划',
  4: 'UID推广',
  5: '星图推广'
};

// 小程序推广类型
export const DATA_TYPE_MAPPER = {
  1: '分发任务',
  2: '推广计划',
};
// 小程序推广又分为：搜索口令、锚点挂载、直播挂载

// 合作状态
export const COOPERATESTATUS = {
  1: '合作中',
  2: '终止合作',
  3: '已删除',
  4: '不限',
  5: '不限(含己删除)',
};

// 项目上线状态
export const PROJECTONLINESTATUS = {
  1: '已上线',
  2: '未上线',
};

// 提现开放日 mapper
export const WEEKMAPPER = {
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五',
  6: '星期六',
  7: '星期天',
};

// 系统System
export const OSMAPPER = {
  AND: '安卓',
  IOS: 'IOS',
};

export const RECHARGE_ORDER_TYPE = {
  1: '会员购买',
  2: '增值服务',
};

export const PAY_STATUS_MAPPER = {
  1: '待支付',
  2: '已支付',
  3: '已退款',
  9: '未知状态',
};

export const PAY_PLATFORM_MAPPER = {
  WXPAY: '微信',
  ALIPAY: '支付宝',
  APPLE: '苹果支付',
};

export const MOUNT_TYPE_MAPPER = {
  1: '作品挂载',
  2: '直播挂载',
  3: '口令推广',
  4: '私域推广',
  5: '视频号推广',
  6: '二维码推广',
  7: '作品挂载(uid)',
};

export const MOUNT_TYPE_OPTIONS = [
  { label: '作品挂载', value: 1 }, //必选
  { label: '直播挂载', value: 2 },
  { label: '口令推广', value: 3 },
  { label: '私域推广', value: 4 },
  { label: '视频号推广', value: 5 },
  { label: '二维码推广', value: 6 },
];

export const MENBER_STATUS_MAPPER = {
  1: '非会员',
  2: '会员',
};

export const INVITER_BIND_STATUS = {
  1: '有效',
  2: '无效',
};

export const REBATE_STATUS = {
  REBATE: '是',
  UNREBATE: '否',
};

export const MAIN_CONTENT_TYPE = {
  movie: {
    1: '最新热剧',
    2: '爆款短剧',
    5: '找任务',
  },
  novel: {
    3: '爆款小说',
    5: '找任务',
  },
  caricature: {
    4: '爆款漫画',
    5: '找任务',
  },
};

export const NEW_MAIN_CONTENT_TYPE = {
  movie: {
    1: '爆款短剧',
  },
  novel: {
    2: '爆款小说',
  },
  caricature: {
    3: '爆款漫画',
  },
  appletPopularize: {
    1: '爆款短剧',
    2: '爆款小说',
  },
};

export const CDN_MAPPER = {
  'ALIYUN': '阿里云',
  'SHOUYUN': '首云',
  'WANGSU': '网宿'
}


export const COMPANY_MAPPER = {
  "TXG": "推小果",
  "FENGX": "风行",
  "HEIY": "黑岩"
}
