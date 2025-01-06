// 财务复核状态
export const REVIEWER_STATUS_MAPPER = {
  RECEIVED: '已到账',
  UNRECEIVED: '未到账',
  REFOUND:'已退款',
  NOTCALLBACK:'退款未回调'
};

// 列表-结算状态
export const SETTLE_STATUS_MAPPER = {
  1: '待结算',
  2: '部分结算中',
  3: '结算中',
  4: '部分已结算',
  5: '已结算',
};

// 导入详情-结算状态
export const DETAIL_SETTLE_STATUS_MAPPER = {
  1: '待结算',
  2: '结算中',
  3: '已结算',
};

// 列表-导入状态
export const IMPORT_STATUS_MAPPER = {
  1: '导入失败',
  2: '部分成功',
  3: '全部成功',
};

// 导入详情-导入状态
export const DETAIL_IMPORT_STATUS_MAPPER = {
  1: '匹配成功',
  2: '匹配失败',
  3: '重复导入失败',
  4: '已删除',
};

// 同步数据-同步状态
export const DETAIL_SYNC_STATUS_MAPPER = {
  1: '匹配成功',
  2: '匹配失败',
  3: '重复同步失败',
  4: '已删除',
};

// KOC结算--文件导入状态
export const KOCSETTLE_FILE_IMPORT = {
  1: '导入失败',
  2: '部分成功',
  3: '全部成功',
};

// KOC结算--文件结算状态
export const KOCSETTLE_FILE_SETTLE = {
  1: '待结算',
  2: '部分结算中',
  3: '结算中',
  4: '部分已结算',
  5: '已结算',
};

// KOC结算--文件单条数据匹配状态
export const KOCSETTLE_DATA_MATCH = {
  1: '匹配成功',
  2: '匹配失败',
  3: '重复导入',
  4: '已删除',
};

// KOC结算--文件单条数据结算状态
export const KOCSETTLE_DATA_SETTLE = {
  1: '待结算',
  2: '结算中',
  3: '已结算',
};

// KOC结算--文件单条数据结算状态
export const SERVICE_RATIO_TYPE = {
  1: '博主收益分成',
  2: '充值金额分成',
};

// 付款审核状态
export const KOC_PAY_VERIFY = {
  1: '待提交', // 待提交申请 补充费率
  2: '待审核', // 待提交审核
  3: '审核中',
  4: '审核通过',
  5: '打款中',
  6: '已付款',
  7: '博主待提交',
  8: '审核失败',
};

// // 付款状态
// export const KOC_PAY_VERIFY = {
//   1: '待提交', // 待提交申请 补充费率
//   2: '待审核', // 待提交审核
//   3: '审核中',
//   4: '待付款',
//   5: '付款拒绝',
//   6: '已付款',
//   7: '博主待提交',
// };

export const BANK_CARD_TYPE = {
  1: '本人卡',
  2: '代收款人卡',
};

export const PLATFROM_PAY_STATUS = {
  1: '未打款至平台',
  2: '已打款至平台',
};
export const PAY_STATUS = {
  1: '待提交',
  2: '待审核',
  3: '审核中',
  4: '审核通过',
  5: '打款中',
  6: '已打款',
  7: '打款失败',
  8: '驳回',
};

// 奖励状态
export const KOC_REWARD_VERIFY = {
  1: '待提交',
  2: '待审核',
  3: '审核中',
  4: '审核通过',
  5: '审核拒绝',
};

// 提现方式
export const PAY_WAY_MAPPER = {
  // WXPAY: '微信',
  ALIPAY: '支付宝',
  BANK: '银行卡',
};
export const PAY_WAY_STATUS = {
  1: '微信',
  2: '已打款至平台',
  3: '已打款至平台',
};
export const PAY_WAY_OPTIONS = [
  // { label: '微信', value: 'WXPAY' },
  { label: '支付宝', value: 'ALIPAY' },
  { label: '银行卡', value: 'BANK' },
];

// 审批状态
export const PAY_VERIFY_STATUS = {
  1: '待提交',
  2: '待审核',
  3: '审核中',
  4: '审核通过',
  5: '审核拒绝',
};
// 服务商单
export const SERVICE_STATUS = {
  1: '正常',
  2: '删除',
  3: '归档',
};
// 结算-会员佣金-结算状态
export const MEMBER_COMMISSION_SETTLE_STATUS_MAPPER = {
  1:'未达标',
  2:'已达标'
}
// 结算-会员佣金-审核状态
export const MEMBER_COMMISSION_VERIFY_STATUS_MAPPER = {
  1:'未提交' ,
  2:'审核中',
  3:'审核通过',
  4:'审核拒绝',
}
// 博主支付状态下拉
// export const BLOGGER_PAYMENT_STATUS_MAPPER = {
//   1:'支付成功' ,
//   2:'支付失败',
//   3:'待支付',
// }
// export const BLOGGER_PAYMENT_STATUS_MAPPER = {
//   1:'待提交' ,
//   2:'待审核',
//   3:'审核中',
//   4:'审核通过',
//   5:'打款中',
//   6:'打款成功',
//   7:'打款失败',
//   8:'审核失败',
// }
export const BLOGGER_PAYMENT_STATUS_MAPPER = {
  1:'已驳回待提交' ,
  2:'待受理',
  3:'审核中',
  4:'审核通过待付款',
  5:'已付款',
  6:'付款失败',
}
// 博主支付状态列表展示
export const BLOGGER_LIST_PAYMENT_STATUS_MAPPER = {
  1:'待受理' ,
  2:'审核中',
  3:'审核中',
  4:'审核通过待付款',
  5:'审核通过待付款',
  6:'已付款',
  7:'已驳回待提交',
  8:'已驳回待提交',
}



// KOC结算--数据类型
export const KOC_DATA_TYPE_MAPPER = {
  1: '分发任务',
  2: '推广计划',
  3: '关键词推广',
};


// 小程序推广-抖音推广
export const DOUYIN_SETTLE_METHODS_MAPPER = {
  1: "广告分成",
  2: "支付分成",
  3: "支付分成绑定",
  6: "新增日活用户",
}