exports.MESSAGE_TYPE_MAPPER = {
  1: "审核通知",
  2: "财务消息",
  3: "提醒消息",
  4: "官方通知",
};
exports.MESSAGE_SUB_TYPE_MAPPER = {
  101: {
    message_type: 1,
    title: "关键词审核通过",
  },
  102: {
    message_type: 1,
    title: "关键词审核失败",
  },
  103: {
    message_type: 1,
    title: "关键词下架",
  },

  201: {
    message_type: 2,
    title: "收益结算通知",
  },
  202: {
    message_type: 2,
    title: "基础变现佣金收益",
  },
  203: {
    message_type: 2,
    title: "月度变现佣金收益",
  },
  204: {
    message_type: 2,
    title: "季度变现佣金收益",
  },
  205: {
    message_type: 2,
    title: "年度变现佣金收益",
  },
  206: {
    message_type: 2,
    title: "提现受理",
  },
  207: {
    message_type: 2,
    title: "提现驳回",
  },
  208: {
    message_type: 2,
    title: "提现到账",
  },
  209: {
    message_type: 2,
    title: "好友开通会员分成通知",
  },
  210: {
    message_type: 2,
    title: "收益结算通知",  // 奖励专用
  },

  301: {
    message_type: 3,
    title: "会员到期",
  },
  302: {
    message_type: 3,
    title: "会员续费",
  },
  303: {
    message_type: 3,
    title: "权益到期",
  },
  304: {
    message_type: 3,
    title: "任务下架",
  },

  402: {
    message_type: 4,
    title: "新项目上线",
  },
  402: {
    message_type: 4,
    title: "激励政策",
  },
  403: {
    message_type: 4,
    title: "爆款任务推荐",
  },
  404: {
    message_type: 4,
    title: "政策变更",
  },
};
