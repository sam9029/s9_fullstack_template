export const TASK_PUBLISH_STATUS = {
  1: '待发布',
  2: '发布中',
  3: '已过期',
  4: '预算耗尽'
}

export const REMAINDER_BUDGET_TYPE = {
  1: '系统算法',
  2: '自定义'
}

export const PARTICIPATE_TYPE = {
  1: '全案供应',
  2: '共创合作',
}



export const CONFIGURE_STATUS_MAPPER = {
  1: '未验证',
  2: '成功',
  3: '失败',
};

export const FEEDBACK_OPTION = [
  {
    label: '图文',
    value: 1,
  },
  {
    label: '视频',
    value: 2,
  },
];
export const FEEDBACK_TYPE_MAPPER = {
  1: '图文',
  2: '视频',
};

export const VERIFY_STATUS_OPTIONS = [
  {
    label: '审核中',
    value: 1,
  },
  {
    label: '审核通过',
    value: 2,
  },
  {
    label: '审核拒绝',
    value: 3,
  },
  {
    label: '待送审',
    value: 4,
  },
];
const BASE_VERIFY_STATUS = {
  1: '审核中',
  2: '审核通过',
  3: '审核拒绝',
  4: '待送审',
}
export const VERIFY_STATUS_MAPPER = {
  ...BASE_VERIFY_STATUS,
  5: '干预过期',
};

export const PERIOD_VERIFY_MAPPER = {
  ...BASE_VERIFY_STATUS,
  5: '部分通过',
};

// 关键词内容类型
export const KEYWORD_CONTENT_TYPE_MAPPER = {
  1: '非会员内容',
  2: '会员内容',
};

// export const PUBLISH_STATUS_MAPPER = {
//   // 1: '词未审核',
//   // 2: '待分配',
//   // 3: '待发布',
//   // 4: '发布待审核',
//   // 5: '发布中',
//   // 6: '发布无效',
//   // 7: '发布过期',
//   1: '未发布',
//   2: '待审核',
//   3: '发布中',
// };
// export const PUBLISH_STATUS_OPTIONS = [
//   { label: '发布待审核', value: 4 },
//   { label: '发布中', value: 5 },
//   { label: '发布无效', value: 6 },
//   { label: '发布过期', value: 7 },
// ];
// export const PUBLISH_STATUS_OPTIONS = [
//   // { label: '待发布', value: 1 },
//   { label: '发布中', value: 2 },
//   { label: '已发布', value: 3 },
// ];
export const PUBLISH_STATUS_MAPPER = {
  1: '待发布',
  2: '已发布待审核',
  3: '发布生效中',
  4: '发布审核拒绝',
};
export const PUBLISH_STATUS_OPTIONS = [
  { label: '待发布', value: 1 },
  { label: '已发布待审核', value: 2 },
  { label: '发布生效中', value: 3 },
  { label: '发布审核拒绝', value: 4 },
];

export const JOIN_ACTIVITY = {
  1: "是",
  2: "否"
};

// 发布状态
export const VIDIO_PUBLISH_STATUS_OPTIONS = [
  { label: '待发布', value: 1 },
  { label: '已发布', value: 2 },
];
export const VIDIO_PUBLISH_STATUS_MAPPER = {
  1: '待发布',
  2: '已发布',
};
// 领取状态
export const RECEIVE_STATUS_OPTIONS = [
  { label: '待领取', value: 1 },
  { label: '已领取', value: 2 },
];
export const RECEIVE_STATUS_MAPPER = {
  1: '待领取',
  2: '已领取',
};
// 视频状态
export const VIDIO_STATUS_OPTIONS = [
  { label: '正常', value: 1 },
  { label: '删除', value: 2 },
  { label: '撤销', value: 3 },
  { label: '归档', value: 4 },
];