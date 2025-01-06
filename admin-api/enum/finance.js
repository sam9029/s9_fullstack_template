exports.APPLET_PAY_STATUS = {
  SUCCESS: "支付成功",
  REFUND: "已退款",
  NOTPAY: "未支付"
}

exports.DLKD_PAY_STATUS = {
  SUCCESS: "支付成功",
  REFUND: "已退款",
  NOTPAY: "未支付"
}

exports.APPLET_CANCEL_STATUS = {
  1: "正常结算",
  2: "实时结算",
  3: "人工核销",
  4: "系统核销",
  5: "匹配失败",
  6: "", // 无流程
}


exports.APPLET_SETTLE_STATUS = {
  1: "待结算",
  2: "结算中",
  3: "已结算",
  4: "已归档",
  5: "", // 无流程
}

exports.PAY_WAY_MAPPER = {
  "WXPAY": "微信",
  "ALIPAY": "支付宝",
  "BANK": "银行卡"
}

exports.PAY_WAY_VALUE_MAPPER = {
  "WXPAY": 2,
  "ALIPAY": 1,
  "BANK": 0
}

exports.WITHDRAW_TYPE_MAPPER = {
  1: '做任务变现收益',
  2: '邀约发布任务佣金',
  3: '邀约充值会员佣金',
  4: '做活动奖励收益'
}


exports.SETTLE_METHOD_DESC = {
  1: `CPA拉新`,
  2: `CPA订单`,
  3: `CPS充值分成`,
  4: `CPM广告分成`,
}

exports.REWARD_MAPPER = {
  custom: `客户奖励`,
  platform: `平台奖励`,
}

exports.REWARD_VERIFY_MAPPER = {
  1: "待审核",
  2: "审核中",
  3: "审核通过",
  4: "审核拒绝",
};

exports.PAYMENT_VERIFY_MAPPER = {
  1: "待提交",
  2: "待审核",
  3: "审核中",
  4: "审核通过",
  5: "审核拒绝"
}

exports.PAYMENT_TAB_TYPE_MAPPER = {
  1: "提现申请",
  2: "付款审批中",
  3: "已审批",
  4: "付款失败",
  5: "付款成功",
  6: "付款报表"
}

exports.PAYMENT_TYPE_MAPPER = {
  1: "变现收益",
  2: "变现佣金",
  3: "会员佣金",
  4: "活动奖励"
}

exports.PAYMENT_PAY_STATUS_MAPPER = {
  1: "待提交",
  2: "待审核",
  3: "审核中",
  4: "审核通过",
  5: "打款中",
  6: "打款成功",
  7: '打款失败',
  8: '审核失败'
}

exports.PAY_TYPE_MAPPER = {
  3: "按转化结算",
  14: "按付费分佣结算",
};

exports.EVALUATE_TYPE_MAPPER = {
  121: "按分成付费-游戏cps",
  133: "按激活付费-游戏发行人",
};

exports.AMOUNT_PROMOTION_TYPE = {
  1: "关键词推广",
  2: "小程序推广",
  3: "抖音推广计划",
  4: "uid推广",
  5: "奖励",
};


// 系统System
exports.OSMAPPER = {
  AND: '安卓',
  IOS: 'IOS',
};

exports.RECHARGE_ORDER_TYPE = {
  1: '会员购买',
  2: '增值服务',
};

exports.PAY_STATUS_MAPPER = {
  1: '待支付',
  2: '已支付',
  3: '已退款',
  9: '未知状态',
};

// 财务复核状态
exports.REVIEWER_STATUS_MAPPER = {
  RECEIVED: '已到账',
  UNRECEIVED: '未到账',
  REFOUND: '已退款',
  NOTCALLBACK: '退款未回调'
};

exports.PAY_PLATFORM_MAPPER = {
  WXPAY: '微信',
  ALIPAY: '支付宝',
  APPLE: '苹果支付',
};

exports.MENBER_STATUS_MAPPER = {
  1: '非会员',
  2: '会员',
};


// 支付环境
exports.ENVIRONMENT_MAPPER = {
  production: '正式支付',
  sandbox: '沙盒支付',
};

// 是否首次
exports.FIRST_PAY_VIP_MAPPER = {
  1: '否',
  2: '是',
};

// 邀请人绑定状态
exports.INVITER_BIND_STATUS = {
  1: '有效',
  2: '无效',
};

// 是否返利
exports.REBATE_STATUS = {
  REBATE: '是',
  UNREBATE: '否',
};
