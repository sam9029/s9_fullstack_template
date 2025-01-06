const knex = require('../../../../db/knexManager').knexProxy;
const { KEYWORD_CONTENT_TABLE, ACCOUNT_TABLE } = require('../../../../config/setting');
const { knexTransaction } = require("../../../../utils/tools")
const { insertLog, getLogData } = require("../../../public/operationLog")
const { getPermission } = require("../../../public/permission")
const { analysisSheet } = require("../../../public/upload")
const { access_user } = require("../../../../utils/marking");
const request = require("../../../../utils/request")

function getContentTitle(url) {
  return request({
    url,
    method: 'get',
    headers: {
      "content-type": "application/json",
    }
  })
}
async function list(query, userInfo) {
  const { oem_id } = userInfo
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  }
  let knexSql = knex.select('kct.id').from(`${KEYWORD_CONTENT_TABLE} as kct`).where('kct.oem_id', oem_id)
  knexSql = handler.searchFilter(knexSql, query);

  if (query.interface_id) {
    let account_ids = await getPermission(query, userInfo);
    if (account_ids.length) knexSql.whereIn('kct.create_user_id', account_ids)
  }
  let count = (await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`)))[0]
  retu.count = (count && count["count"]) || 0;
  retu.data = await knexSql.select('kct.*')
    .select(handler.selectName('kct', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
    .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", "desc");
  return retu
}

async function add(body, userInfo = {}) {
  body = handler.checkData(body, userInfo)
  let retu = {
    message: "添加关键词内容成功！",
    code: 0,
    data: null
  }
  let { content_url, advertiser_type } = body
  let before_data = (await knex(KEYWORD_CONTENT_TABLE).select('*').where({ content_url, advertiser_type }))[0]
  retu.data = await knexTransaction(async (trx) => {
    let id = (await trx(KEYWORD_CONTENT_TABLE).insert(body).onConflict(['content_url', 'advertiser_type']).merge())[0]
    await insertLog(trx, getLogData(id, 3421, body, userInfo, before_data))
    return id
  })
  return retu
}

async function edit(body = {}, userInfo) {
  const { id } = body
  const { oem_id } = userInfo
  if (!body || !id) return Promise.reject("请传入要修改的内容ID！")
  body = handler.checkData(body, userInfo, 'edit')
  let retu = {
    message: "编辑内容成功！",
    code: 0,
  }
  let before_data = (await knex(KEYWORD_CONTENT_TABLE).select('*').where({ id, oem_id }))[0]
  if (!before_data) return Promise.reject('修改数据不存在或无修改权限！')
  await knexTransaction(async (trx) => {
    let message = null
    await trx(KEYWORD_CONTENT_TABLE).update(body).where('id', id).catch(err => {
      message = err
    })
    if (message) return Promise.reject(`内容已经存在，请勿修改为已存在的内容链接！`)
    await insertLog(trx, getLogData(id, 3422, body, userInfo, before_data))
  })
  return retu
}

async function updateStatus(body, userInfo) {
  let { status, ids } = body || {}
  if (!ids) return Promise.reject('未设置关键词ids')
  if (!Array.isArray(ids)) return Promise.reject('ids为数组')
  if (!status) return Promise.reject('未设置状态status')
  // await handler.checkUser(userInfo, '更新状态')
  let checkData = await knex(KEYWORD_CONTENT_TABLE).select("id", 'status', 'update_user_id').whereIn("id", body.ids)
  if (!checkData.length) return Promise.reject("未查询到内容信息");
  await knexTransaction(async (trx) => {
    await trx(KEYWORD_CONTENT_TABLE).update({ status: status, update_user_id: userInfo.id }).whereIn('id', checkData.map(item => item.id))
    let log_data = checkData.map(item => {
      return getLogData(item.id, 3422, { status: status, update_user_id: userInfo.id }, userInfo, { status: item.status, update_user_id: item.update_user_id })
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: "更新状态成功"
  }
}

async function importData(body, userInfo) {
  let { url, advertiser_type } = body || {}
  if (!url) return Promise.reject('未设置导入文件！')
  if (!advertiser_type) return Promise.reject("未设置广告主类型advertiser_type！");
  let sheet_headers = []
  switch (Number(advertiser_type)) {
    case 6:
      sheet_headers = ['链接（必填）', '内容类型']
      break;
    case 7:
      sheet_headers = ['书籍ID（必填）', '书名']
      break;
    case 8:
      sheet_headers = ['书籍ID（必填）', '书名', '作者']
      break;
    default:
      return Promise.reject('暂不支持该项目！')
  }
  let { data, sheet_name } = await analysisSheet(url, sheet_headers, false, true)
  if (!data || !data.length) return Promise.reject('导入数据为空！')
  data = data.map(i => {
    let item = {}
    switch (Number(advertiser_type)) {
      case 6:
        item = {
          advertiser_type,
          type_name: sheet_name == 'Sheet1' ? null : sheet_name,
          content_url: i['链接（必填）'] || null,
          content_title: i['标题'] || null,
          book_name: i['书名'] || null,
          category_name: i['品类标签'] || null,
          content_keyword: i['关键词别名'] || null,
          content_type: i['内容类型'] == '会员内容' ? 2 : 1,
        }
        break;
      case 7:
        item = {
          advertiser_type,
          content_url: i['书籍ID（必填）'] || null,
          book_name: i['书名'] || null,
          category_name: i['品类标签'] || null,
        }
        break;
      case 8:
        item = {
          advertiser_type,
          content_url: i['书籍ID（必填）'] || null,
          content_title: i['作者'] || null,
          book_name: i['书名'] || null,
          category_name: i['品类标签'] || null,
        }
        break;
      default:
        break;
    }
    Object.keys(item).forEach(key => {
      if (Object.prototype.toString.call(item[key]) === '[object String]') item[key] = item[key].trim()
    })
    return item
  })
  return await addArray(data, userInfo, advertiser_type)
}
async function addArray(data = [], userInfo = {}, advertiser_type) {
  let error_data = []
  let checkd_data = []
  data.forEach(item => {
    try {
      checkd_data.push(handler.checkData(item, userInfo))
    } catch (error) {
      error_data.push({ ...item, message: String(error.message || error) })
    }
  })
  const { oem_id, id: user_id } = userInfo || {}
  data = data.filter(i => i.book_name)
  if (!checkd_data || !checkd_data.length) return Promise.reject('未填写新增数据！')
  let before_data = await knex(KEYWORD_CONTENT_TABLE).select('*').where({ advertiser_type, oem_id })
    .whereIn('content_url', checkd_data.map(i => i.content_url))
  let mapper = {}
  before_data.forEach(element => {
    mapper[element.content_url] = element
  });
  let back = await knexTransaction(async (trx) => {
    let ids = []
    let log_data = await Promise.all(checkd_data.map(async item => {
      let id = (await trx(KEYWORD_CONTENT_TABLE).insert(item).onConflict(['advertiser_type', 'content_url']).merge())[0]
      if (id) ids.push(id)
      return getLogData(id, 3421, item, userInfo, mapper[item.content_url] || {})
    }))
    await insertLog(trx, log_data.filter(i => i.relation_id))
    return ids
  })
  return {
    code: 0,
    data: back,
    error_data
  }
}

async function def(query, userInfo) {
  if (!query || !query.id) throw new Error("请传入要查询的内容ID")
  const { id } = query
  const { oem_id } = userInfo
  let retu = {
    code: 0,
    data: {}
  }
  retu.data = (await knex.select('kct.*')
    .select(handler.selectName('kct', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
    .from(`${KEYWORD_CONTENT_TABLE} as kct`).where({ 'kct.oem_id': oem_id, 'kct.id': id }))[0]
  if (!retu.data) throw new Error('暂未查询到内容信息！')
  return retu
}

function queryToJson(string) {
  let obj = {}, pairs = string.split('&'), d = decodeURIComponent, name, value;
  pairs.forEach(pair => {
    pair = pair.split('=');
    name = d(pair[0]);
    value = d(pair[1]);
    obj[name] = value;
  });
  return obj;
}
async function getTitle(url) {
  let title = ''
  // https://mparticle.uc.cn/article.html?uc_param_str=frdnsnpfvecpntnwprdssskt&wm_aid=35091bbae1514950b5048fbc952d31b0
  // https://mparticle.uc.cn/story.html?btifl=100&uc_param_str=frdnsnpfvecpntnwprdssskt#!wm_aid=0b626445dc0a4491a8135a0319af9696!!wm_id=1962ac140e734dfa9fcc8515006a9995&source=share-back
  // https://ff.dayu.com/contents/origin/0b626445dc0a4491a8135a0319af9696?biz_id=1002&_fetch_author=1
  if (url.indexOf('wm_aid') == -1) return ''
  let query_url = url.replace(/\#\!/g, '&').replace(/\!\!/g, '&')
  let url_data = queryToJson(query_url.split('?').pop())
  // let wm_aid = (url_arrays.find(i => i.indexOf('wm_aid') != -1) || '').replace(/wm_aid=/g, '')
  if (!url_data || !url_data.wm_aid) return ''
  let new_url = `https://ff.dayu.com/contents/origin/${url_data.wm_aid}?biz_id=1002&_fetch_author=1`
  let html_data = await getContentTitle(new_url).catch(err => {
    title = null
  })
  // console.log(html_data);
  if (html_data && html_data.data && html_data.data.title) return html_data.data.title
  return title
}
async function defUrl(body, userInfo) {
  if (!body || !body.content_urls || !body.content_urls.length) throw new Error("请传入要查询的内容链接！")
  const { oem_id } = userInfo
  let retu = {
    code: 0,
    data: []
  }
  retu.data = await knex.select('kct.*')
    .select(handler.selectName('kct', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
    .from(`${KEYWORD_CONTENT_TABLE} as kct`).where({ 'kct.oem_id': oem_id }).whereIn('kct.content_url', body.content_urls)
  if (!retu.data) throw new Error('暂未查询到内容信息！')
  let all_data = retu.data.map(async item => {
    if (!item.content_title && item.content_url) item.content_title = await getTitle(item.content_url)
    return item
  })
  retu.data = await Promise.all(all_data)
  return retu
}
async function defBookId(body, userInfo) {
  let { advertiser_type = 8 } = body
  if (advertiser_type == 8) {
    if (!body || !body.book_name || !body.author) throw new Error("请传入书籍名称及作者！")
  } else {
    if (!body || !body.book_name) throw new Error("请传入书籍名称！")
  }
  const { oem_id } = userInfo
  let retu = {
    code: 0,
    data: []
  }
  retu.data = (await knex.select('kct.id', 'kct.content_title as author', 'kct.book_name', 'kct.content_url as book_id')
    .from(`${KEYWORD_CONTENT_TABLE} as kct`).where({ 'kct.oem_id': oem_id })
    .where('advertiser_type', advertiser_type)
    .where('book_name', body.book_name)
    .where(builder => {
      if (advertiser_type == 8) builder.where('content_title', body.author)
    }))[0]
  if (!retu.data) throw new Error('暂未查询到内容信息！')
  return retu
}
let handler = {
  checkData(body = {}, userInfo = {}, type = "add") {
    let user_id = userInfo.id
    let checkKeys = ['advertiser_type', 'content_url']
    let dataKeys = ['content_title', 'book_name', 'category_name', 'content_keyword', 'status', 'type_name', 'content_type']
    let data = {}
    if (type == "add") {
      data = {
        create_user_id: user_id,
        update_user_id: user_id,
        oem_id: userInfo.oem_id
      }
      checkKeys.forEach(key => {
        if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`)
        data[key] = body[key]
      })
    } else if (type == "edit") {
      data = { update_user_id: user_id }
    }
    checkKeys.concat(dataKeys).forEach(key => {
      if (Object.hasOwnProperty.call(body, key)) data[key] = body[key]
    })
    return data
  },
  selectName(idTable, nameTable, idFiled, nameFiled = "name", asFiled) {
    return knex.raw(`(SELECT p.${nameFiled} FROM ${nameTable} p where ${idTable}.${idFiled} = p.id  LIMIT 0, 1 ) as ${asFiled}`)
  },
  searchFilter(knexSql, query) {
    knexSql.where('kct.advertiser_type', query.advertiser_type || 0)
    if (query.keyword) {
      let keyword = query.keyword.trim()
      knexSql.where(builder => {
        builder.where('kct.content_title', 'like', `%${keyword}%`).orWhere('kct.content_url', 'like', `%${keyword}%`)
          .orWhere('kct.content_keyword', 'like', `%${keyword}%`).orWhere('kct.id', 'like', `%${keyword}%`)
      })
    }
    if (query.content_url) {
      let content_url = query.content_url.trim()
      knexSql.where('kct.content_url', 'like', `%${content_url}%`)
    }
    if (query.content_title) {
      let content_title = query.content_title.trim()
      knexSql.where('kct.content_title', 'like', `%${content_title}%`)
    }
    if (query.status) knexSql.where('kct.status', query.status)
    else knexSql.whereIn('kct.status', [1, 2])
    return knexSql;
  },
  //校验是否是超管/access_user
  checkUser(userInfo, type = "新增") {
    let flag = userInfo.role_ids.split(',').includes('1') || access_user.includes(userInfo.id)
    if (!flag) throw new Error(`暂无${type}品类权限`)
  }
}

module.exports = {
  list,
  add,
  edit,
  importData,
  def,
  updateStatus,
  defUrl,
  defBookId
}