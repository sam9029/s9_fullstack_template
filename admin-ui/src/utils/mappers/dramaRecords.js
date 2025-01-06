// 剧集收益相关枚举

// 内部结算状态
export const INTERNAL_SETTLE_STATUS_MAPPER = {
  1: '待结算',
  2: '结算中',
  3: '已结算',
  4: '已归档',
  5: '无流程'
}

// 内部核销状态
export const INTERNAL_CANCEL_STATUS_MAPPER = {
  1: '正常结算',
  2: '实时结算',
  3: '人工核销',
  4: '系统核销',
  5: '匹配失败',
  6: '无流程',
}

// 财务复核状态
export const INTERNAL_REVIEW_STATUS_MAPPER = {
  'UNREVIEW': '未复核',
  'RECEIVED': '已到账',
  'UNRECEIVED': '未到账',
  'REFOUND': '已退款',
  'NOTCALLBACK': '退款未回调',
}

// 操作系统
export const INTERNAL_SYSTEM_MAPPER = {
  'AND': '安卓',
  'IOS': '苹果',
  'MP': '小程序',
}

// 支付方式
export const DRAMA_PAY_PLATFORM_MAPPER = {
  'WXPAY': '微信支付',
  'APPLE': '苹果支付',
  'ALIPAY': '支付宝支付',
  'TTPAY': '抖音支付',
  'DIAMOND': '钻石支付',
  'UNKNOWN': '订单未创建',
}

// 支付方式
export const DRAMA_PAY_PLATFORM_MAPPER_WITHOUT_UNKNOWN = {
  'WXPAY': '微信支付',
  'APPLE': '苹果支付',
  'ALIPAY': '支付宝支付',
  'TTPAY': '抖音支付',
  'DIAMOND': '钻石支付',
}

// 订单状态
export const DRAMA_PAY_STATUS_MAPPER = {
  1: '待支付',
  2: '已支付',
  3: '已退款',
  9: '取消订单',
}

// 剧集收费状态
export const DRAMA_CHARGE_STATUS_MAPPER = {
  'T': '免费',
  'F': '收费',
}

// 流量来源
export const SOURCE_TYPE_MAPPER = {
  0:'未知流量',
  1:'自然流量',
  2:'锚点挂载',
  3:'搜索口令',
  4:'巨量星图',
  5:'广告投放',
  6:'归因超期',
}