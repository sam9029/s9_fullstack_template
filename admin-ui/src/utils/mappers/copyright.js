export const LISTED_STATUS = {
  1: '已上架',
  2: '已下架',
  3: '已删除',
};

export const DRAMA_TYPE = {
  SINGEL: '单集',
  MULTIPLE: '合集',
};

export const REALIZE_TYPE = {
  MONEY: '充值付费解锁 ',
  AD: '激励视频解锁',
};

export const PRICING_TYPE = {
  CUSTOM: '单集自定义定价',
  UNIQUE: '统一定价',
  BYTIME: '按视频时长定价',
};

export const SYSTEM_TYPE = {
  NOLIMIT: '不限',
  AND: '安卓',
  IOS: 'IOS',
};

export const COPYRIGHT_TYPE = {
  1: '图书出版物',
  2: '网文小说',
};

export const DRAMA_PAID_TIME_TYPE = {
  1: '立即充值',
  5: '统一前五秒',
  30: '统一前30秒',
  60: '统一前60秒',
  null: '单集自定义',
};

// 视频类型
export const VIDEO_TYPE_MAPPER = {
  SINGEL: '单集',
  MULTIPLE: '合集',
};

export const COPYRIGHT_VERIFY_STATUS = {
  1: '未提交',
  2: '审核中',
  3: '审核通过',
  4: '审核拒绝',
};

export const ZIP_LEVEL_MAPPER = {
  'LOWTEST': '最低',
  'LOW': '标清',
  'MID': '高清',
  'HIGH': '超清',
  'HIGHEST': '无损'
}

export const IS_SHOW_MAPPER = {
  'T': '是',
  'F': '否'
}

export const ZIP_STATUS_MAPPER = {
  'UNZIP': '待转码',
  'BEZIP': '待处理',
  'DOWNLOADING': '下载中',
  'ZPING': '转码中',
  'DECODING': '转码中',
  'UPLOADING': '上传中',
  'SUCCESS': '转码成功',
  'FAIL': '转码失败',
}

export const USE_ZIP_MAPPER = {
  'T': '是',
  'F': '否'
}

export const COPYRIGHT_VERIFY_STATUS_V2 = {
  ...COPYRIGHT_VERIFY_STATUS,
  1: '待送审',
};

export const COPYRIGHT_ORIGIN_MAPPER = {
  1: '原始所有',
  2: '被授权',
};

export const COPYRIGHT_APPLICATION_MAPPER = {
  1: '授权',
  2: '作品版权证明',
};

export const COPYRIGHT_RECIPIENT_MAPPER = {
  1: '原始版权所有人',
  2: '承制版权授权人',
  3: '承制方',
};

export const AUTHORIZER_MAPPER = {
  author: '作者',
  other: '其他转授权方',
};

export const AUTHORIZER_OBJECT_MAPPER = {
  txg: '重庆推小果传媒科技有限公司',
};

export const AUTHORIZER_TYPE_MAPPER = {
  ...AUTHORIZER_MAPPER,
  ...AUTHORIZER_OBJECT_MAPPER,
};

// 免责声明
const text = `
  <p>1. 本声明适用于所有访问和使用本产品的用户。</p>

  <p>2. 用户在使用本产品时，必须确保所提供的所有信息真实、准确、完整且有效。本产品不承担因用户信息不实或不完整而导致的任何责任。</p>
  
  <p>3. 用户应自行确保上传的内容不侵犯任何第三方的版权、商标权、专利权、商业秘密或其他知识产权。若用户上传的内容存在侵权行为，由用户自行承担相应的法律责任。</p>
  
  <p>4. 本产品对于用户上传的内容，仅提供存储和展示服务，不构成对内容真实性、合法性、完整性的保证或认可。</p>
  
  <p>5. 本产品不承担因用户上传内容而引发的任何直接、间接、特殊、附带或后果性的损失和责任。</p>
  
  <p>6. 用户应遵守相关法律法规，不得利用本产品从事违法活动。如有违反，本产品有权立即停止服务，并依法追究用户的法律责任。</p>
  
  <p>7. 本声明的解释权和修改权归本产品所有。如有更新，我们将在本页面发布最新版本的免责声明。请您定期查看并遵守最新版本的声明。</p>
`;
export const DISCLAIMER_TEXT = {
  title: '免责声明',
  text,
};

export const REVIEW_STATUS_MAPPER = {
  1: '待审核',
  2: '审核中',
  3: '审核通过',
  4: '审核拒绝',
} 

export const PREHEAT_STATUS_MAPPER = {
  'Complete': '已完成',
  'Pending': '等待刷新',
  'Refreshing': '预热中',
  'Failed': '预热失败',
  'Unput': '未预热',
  'Waiting': '等待执行'
} 

export const  COMPLETION_STATUS_MAPPER = {
  'SERIALIZING': '连载中',
  'COMPLETED': '已完结',
  'PAUSED': '暂停更新',
}


export const  DRAMA_TAG_TYPE_MAPPER = {
  DRAMA: '剧集',
  STORY: '故事'
}
