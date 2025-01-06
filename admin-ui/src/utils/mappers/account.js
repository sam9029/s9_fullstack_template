// export const BLOGGER_TYPE_OPTIONS = [
//   // {
//   //   label: "签约博主",
//   //   value: 1,
//   // },
//   {
//     label: '直营博主',
//     value: 2,
//   },
//   {
//     label: '投顾博主',
//     value: 3,
//   },
//   {
//     label: '自营博主',
//     value: 4,
//   },
//   {
//     label: '自建账号',
//     value: 5,
//   },
//   // {
//   //   label: "投顾",
//   //   value: 6,
//   // }
// ];
// export const BLOGGER_TYPE_MAPPER = {
//   // 1: "签约博主",
//   2: '直营博主',
//   3: '投顾博主',
//   4: '自营博主',
//   5: '自建账号',
//   6: '投顾',
// };



// 会员状态
export const BLOGGER_TYPE_MAPPER = {
  1: "非会员",
  2: "会员"
  // 2: '普通会员',
  // 3: '种子会员',
  // 4: '原始种子会员',
};
export const BLOGGER_TYPE_OPTIONS = [
  { label: '非会员', value: 1 },
  { label: '会员', value: 2 },
  // { label: '普通会员', value: 2 },
  // { label: '种子会员', value: 3 },
  // { label: '原始种子会员', value: 4 }
];

// 商务与否
export const SALER_TYPE_MAPPER = {
  1: "非商务",
  2: '商务',
};
export const SALER_TYPE_OPTIONS = [
  { label: '非商务', value: 0 },
  { label: '商务', value: 1 },
];

// 账户状态
export const ACCOUNT_STATUS_MAPPER = {
  1:'正常',   
  2:'停用', 
  3:'已删除',  
  4:'已注销'
};
export const ACCOUNT_STATUS_OPTIONS = [
  { label: '正常', value: 1 },
  { label: '停用', value: 2 },
  { label: '已删除', value: 3 },
  { label: '已注销', value: 4 }
];

export const POLICY_BLOGGER_MAPPER = [
  {
    label: '不限（不含投顾博主）',
    value: 6,
  },
  {
    label: '不限',
    value: 0,
  },
  {
    label: '签约博主',
    value: 1,
  },
  {
    label: '直营博主',
    value: 2,
  },
  {
    label: '投顾博主',
    value: 3,
  },
  {
    label: '自营博主',
    value: 4,
  },
];

export const SIGN_TYPE = {
  1: '已签约',
  2: '未签约',
  3: '签约过期',
  4: '签约即将到期',
};

export const ACCOUNT_TYPE_MAPPER = {
  1: '博主',
  2: '投顾',
  3: '其他',
};

export const BANK_MAPPER = {
  1: '有',
  2: '无',
  3: '不全',
};

export const PROBATE_TYPE = {
  0: '',
  1: '试用中',
  2: '试用结束',
};

export const DUOLAI_ACCOUNT_MAPPER = {
  1: '超级管理员',
  3: '博主',
  6: '承制方'
}