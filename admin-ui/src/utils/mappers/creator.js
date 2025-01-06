// 创作者相关的枚举

// 创作者类型
export const CREATOR_TYPE = {
  'personal': '个人',
  'business': '企业',
}

// 创作者角色类型
export const CREATOR_ROLE_TYPE = {
  5: '版权方',
  6: '承制方',
  7: '版权经纪人',
}

// 创作者合作状态
export const CREATOR_STATUS_MAPPER = {
  1: '合作中',
  2: '终止合作',
  3: '已删除',
  4: '已注销',
};

// 实名认证状态
export const CREATOR_REAL_STATUS_MAPPER = {
  'T': '已认证',
  'W': '待认证',
  'F': '未通过',
};

// 审核状态  tip:没有审核中
export const CREATOR_VERIFY_STATUS_MAPPER = {
  1: '待审核',
  2: '审核通过',
  3: '审核失败',
};

// 通过实名认证状态推断的审核状态，用于认证资质界面展示状态
export const CREATOR_VERIFY_STATUS_BY_REAL_STATUS_MAPPER = {
  'W': '待审核',
  'T': '审核通过',
  'F': '审核失败',
};