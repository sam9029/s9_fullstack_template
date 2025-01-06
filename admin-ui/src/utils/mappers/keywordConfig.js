//字段类型
export const PROP_TYPE_MAPPER = {
  1: 'keyword', // 关键词要求 和 提词关联要求
  2: 'content', // 内容字段
  3: 'publish', // 发布作品字段
  4: 'keywordVerify', // 关键词审核导入导出
  5: 'opusVerify' // 作品审核导入导出
}

//组件类型
export const COMP_TYPE_MAPPER = {
  1: '输入框', // 输入框
  2: '下拉多选',  // 下拉
  3: '下拉多选', // 接口获取下拉
  4: '日期选择器' // 日期选择
}

//查询项目配置类型
export const PROJECT_RENDER_TYPE_MAPPER = {
  1: 'keyword', // 关键词要求 和 提词关联要求
  2: 'content', // 内容字段
  3: 'publish', // 发布作品字段
  11: 'KeywordVerifyExport', // 关键词审核导出
  12: 'KeywordVerifyImport', // 关键词审核导入
  31: 'OpusVerifyExport', // 作品审核导入
  32: 'OpusVerifyImport' // 作品审核导入
}