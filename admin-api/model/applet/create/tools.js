const knex = require('../../../db/knexManager').knexProxy;
const AipContentCensorClient = require("baidu-aip-sdk").contentCensor;
const APP_ID = "36106367";
const API_KEY = "TPGEGBtOmhRhsAIjR4VWDiIg";
const SECRET_KEY = "SXPzcF504itb9UqR2owVa05G0ZGQKNdI";
//百度的key信息
// 新建一个对象，建议只保存一个对象调用服务接口
const bd_client = new AipContentCensorClient(APP_ID, API_KEY, SECRET_KEY);
const CacheKey = 'xgfx:applet:tools:check_word:'
const CryptoJs = require("crypto-js")
const { getCustomCache, setCustomCache } = require("../../../db/redis");
const { checkKeys, isArrayHas } = require("../../../utils/check_type");
const { TOOLS_RECORD, SOURCE_TYPE, SOURCE_DUB } = require("../../../config/setting")
const request = require("../../../utils/request")
const { timestampSec, knexTransaction, getUuid, sleep } = require("../../../utils/tools");
const { getLogData, insertLog } = require('../../public/operationLog');
const { getMoYinMp3 } = require("../../../utils/create/moyin")
// const { jieziyun_make_video, update_result } = require("../../../utils/create/jieziyun")
const { queryEquity, operateEquity } = require("../../../utils/payment/equity")
const moment = require("moment")
const { dub_text } = require("../../../config/index")
const XUNFEI_KEY = {
  key: '9413b13d',
  secretkey: '42990cb80e882085784b865383e0aba8',
  callbackUrl: "https://test.domain.cn/api/public/callback/xunfei",
  cacheKey: "xgfx:applet:external:xunfei:",
  domain: "https://raasr.xfyun.cn/v2/api/getResult"
  // key: '595f23df',
  // secretkey: 'd9f4aa7ea6d94faca62cd88a28fd5234',
}
const DEWATERMARK = {
  domain: process.env.NODE_ENV == "production" ?
    "http://192.168.4.1:8600/video/share/url/parse" : "http://192.168.50.105:8600/video/share/url/parse",
}
const TYPE_ARRAY = ["CHECK_WORD", "LINK_TO_WORD", "VIDEO_TO_WORD", "REMOVE_WATER", "SMART_CREATE"]
const TOOL_COST_MAPPER = {
  CHECK_WORD: { vip_status: 1, every_day_free: 999 },
  LINK_TO_WORD: { vip_status: 1, every_day_free: 3 },
  VIDEO_TO_WORD: { vip_status: 1, every_day_free: 3 },
  REMOVE_WATER: { vip_status: 1, every_day_free: 999 },
  SMART_CREATE: { vip_status: 2, every_day_free: 'VIP_DAY_FREE', not_vip_free: 2, other_pack: true },
}
async function deWaterMark(body = {}, userInfo = {}) {
  let { url } = checkKeys(body, [{
    key: "url", type: String, required: true
  }])
  let record_id = CryptoJs.MD5(url).toString()
  let result = await getDewatermark({ url })
  await record({
    record_id, result: JSON.stringify(result), make_status: 2,
    type: "REMOVE_WATER", title: result?.title, cover_url: result?.cover_url
  }, userInfo)
  return { code: 0, data: result }
}
function getDewatermark(params) {
  return request({
    url: DEWATERMARK.domain,
    method: 'get',
    headers: {
      "content-type": "application/json",
    },
    params
  }).then(res => {
    // console.log(res);
    if (res?.code != 200) return Promise.reject(String(res.msg || res || '未知异常！'))
    return res.data
  })
}
async function checkWord(body, userInfo = {}) {
  let { word } = body
  if (!word) return Promise.reject('参数异常，请检查参数！')
  let { cost_equity_type } = await checkEquity('CHECK_WORD', userInfo)
  word = String(word)
  let word_md5 = CryptoJs.MD5(word).toString()
  let cache = await getCustomCache(`${CacheKey}${word_md5}`)
  // console.log(cache);
  if (cache) return { code: 0, data: cache }
  let data = await bd_client.textCensorUserDefined(word)
  await record({
    type: "CHECK_WORD",
    cost_equity_type,
    make_status: (data?.error_code) ? 3 : 2,
    result: JSON.stringify(data),
    record_id: data?.log_id || 0
  }, userInfo).catch(err => { console.log(err); })
  if (data?.error_code) return Promise.reject(data?.error_msg || data?.message || '未知异常！')
  await setCustomCache(data, `${CacheKey}${word_md5}`, 3600 * 12) //默认缓存12小时
  return { code: 0, data }
}

async function getXunFeiSigna(query = {}, userInfo = {}) {
  let ts = timestampSec() - 5
  if (!ts) return Promise.reject('参数异常，请检查参数！')
  // let baseString = 
  let md5_str = CryptoJs.MD5(XUNFEI_KEY.key + ts).toString()
  let signa = CryptoJs.HmacSHA1(md5_str, XUNFEI_KEY.secretkey).toString(CryptoJs.enc.Base64)
  console.log(ts, signa);
  // console.log(signa);
  return { code: 0, data: { signa, callback_url: XUNFEI_KEY.callbackUrl, app_id: XUNFEI_KEY.key, ts } }
}
async function record(data = {}, userInfo = {}, trx = knex) {
  let insert = checkKeys(data, [{
    key: "type", type: String, required: true, validator: val => isArrayHas(TYPE_ARRAY, val)
  }, "record_id?", "result?", "make_status?", "title?", "cover_url?", "cost_equity_type?"])
  let { id: account_id, oem_id } = userInfo
  insert = {
    ...insert,
    create_user_id: account_id,
    account_id,
    update_user_id: account_id,
    oem_id
  }
  let data_id = (await trx(TOOLS_RECORD).insert(insert))[0]
  // console.log(insert);
  return data_id

}
async function getXunFeiResult(params = {}) {
  let data = await getXunFeiSigna(params)
  params.ts = data?.data?.ts
  params.signa = data.data?.signa
  params.appId = XUNFEI_KEY.key
  return request({
    url: XUNFEI_KEY.domain,
    method: 'get',
    headers: {
      "content-type": "application/json",
    },
    params
  }).then(res => {
    if (res?.code != '000000') return Promise.reject(String(res.descInfo || res || '未知异常！'))
    return res
  })
}

async function xunfeiStatus(query = {}) {
  console.log('讯飞回调', query);
  // {"status": "1", "orderId": "DKHJQ20230726222833803nfB7YX04FF8Z6K6L", "resultType": "transfer"}
  let { orderId, status } = checkKeys(query, [
    { key: "orderId", required: true, },
    { key: "status", required: true, },])
  let order_id = await getCustomCache(XUNFEI_KEY.cacheKey + orderId)
  if (!order_id) return Promise.reject('讯飞非法回调！')
  let update_data = { make_status: 3 }
  if (status == 1) {
    update_data.make_status = 2
    let result = await getXunFeiResult({ orderId }).catch(err => {
      console.log(err);
      update_data.make_status = 3
    })
    let words = ''
    if (result) update_data.raw_result = JSON.stringify(result)
    // console.log(result);
    if (result?.content?.orderInfo?.status == 3) update_data.make_status = 1
    if (result?.content?.orderInfo?.status == -1) update_data.make_status = 3
    if (result?.content?.orderResult) {
      let text = JSON.parse(result.content.orderResult || '[]')
      if (text.lattice) {
        text.lattice.forEach(element => {
          // console.log(element);
          if (element?.json_1best) element.json_1best = JSON.parse(element.json_1best)
          // console.log(element.json_1best);
          if (element.json_1best?.st?.rt) {
            element.json_1best?.st?.rt.forEach(rt => {
              if (rt?.ws) rt.ws.forEach(ws => {
                if (ws.cw[0]) {
                  switch (ws.cw[0]?.wp) {
                    case 'g':
                      words += '\n'
                      break;
                    default:
                      words += ws.cw[0]?.w
                      break;
                  }
                }
              })
            })
          }
        });
      }
      // console.log(text.lattice2);
    }
    if (words) update_data.result = words
    // console.log(words);
  }
  await knex(TOOLS_RECORD).update(update_data).where({ record_id: order_id }).whereIn('type', ["VIDEO_TO_WORD", "LINK_TO_WORD"])
  return { code: 0, data: { message: 'success' } }
}

async function xunFeiToWord(body = {}, userInfo = {}) {
  let { order_id, type, title, cover_url } = checkKeys(body, [{ key: "order_id", required: true, }, { key: "type", required: true, type: String, validator: val => isArrayHas(["LINK_TO_WORD", "VIDEO_TO_WORD"], val) }, "cover_url?", "title?"])
  let data = { title, cover_url, type, make_status: 1, record_id: order_id }
  await setCustomCache(data.record_id, XUNFEI_KEY.cacheKey + data.record_id, 3600 * 24)
  let data_id = await record(data, userInfo)
  return { code: 0, data: { data_id } }
}
async function recordList(query = {}, userInfo = {}) {
  let { type, make_status, status, page_size = 10, pagesize, next_page_site = null } = checkKeys(query, [{
    key: "type", type: String, required: true, validator: val => isArrayHas(TYPE_ARRAY, val)
  }, "make_status?", "status?", "page_size?", 'pagesize?', "next_page_site?"])
  let { id: account_id } = userInfo
  let dataSql = knex(TOOLS_RECORD).select('*').where({ type, account_id })
  if (make_status) dataSql.where({ make_status })
  if (status) dataSql.where({ status })
  else dataSql.where({ status: 1 })
  if (next_page_site) dataSql.where('id', '<', next_page_site)
  let list = await dataSql.orderBy('id', 'desc').limit(page_size || pagesize)
  next_page_site = null
  if (list.length) {
    let last = list[list.length - 1]
    next_page_site = last?.id || null
  }
  if (list.length < (page_size || pagesize)) next_page_site = null
  return { code: 0, data: { list, next_page_site } }
}
async function updateRecord(body = {}, userInfo = {}) {
  let { status, ids } = checkKeys(body, [{
    key: "ids", type: Array, required: true,
  }, "status"])
  let { id: account_id } = userInfo
  await knexTransaction(async trx => {
    let old_data = await trx(TOOLS_RECORD).select('*').where({ account_id }).whereIn('id', ids)
    ids = old_data.map(i => i.id)
    if (!ids?.length) return Promise.reject("无有效操作数据！")
    await trx(TOOLS_RECORD).update({ status }).whereIn('id', ids)
    await insertLog(trx, old_data.map(old => getLogData(old.id, 20101, { status }, userInfo, old)))
    return ids
  })
  return { code: 0, data: { ids } }
}
// getDewatermark({url:"3.00 EHv:/ 复制打开抖音，看看【橘颂的作品】鹿糖故事会作品测试  https://v.douyin.com/itptByV/"})
async function intelligentCreation(body = {}, userInfo = {}) {
  let data = checkKeys(body, [
    { key: "video_category_id", required: true, type: Number },
    { key: "speaker_id", required: true, type: Number },
    {
      key: "dub_text", required: true, type: String, validator: val => {
        if (val?.length > 3000) throw new Error('字数超出3000字！')
        return true
      }
    },
    {
      key: "dub_volume", required: true, type: Number, validator: val => {
        if (val > 100 || val < 0) throw new Error('配音音量设置错误！')
        return true
      }
    },
    {
      key: "dub_speed", type: Number, validator: val => {
        if (val > 2 || val < 0.5) throw new Error('配音语速设置错误！')
        let y = String(val).indexOf(".") + 1;//获取小数点的位置
        let count = String(val).length - y;//获取小数点后的个数
        if (count > 1) throw new Error('配音语速仅支持一位小数！')
        return true
      }
    },
    {
      key: "back_audio_volume", type: Number, validator: val => {
        if (val > 100 || val < 0) throw new Error('背景音量设置错误！')
        return true
      }
    },
    { key: "config", required: true, type: Object }, "video_name?", "back_audio_id?"])

  data.config = checkKeys(data.config, [
    { key: "aspect_ratio", required: true, type: String, validator: val => isArrayHas(['16:9', '9:16', '1:1', '4:3', '3:4'], val) },
    { key: "definition", required: true, type: Number, validator: val => isArrayHas([0, 11, 12], val) },
    { key: "subtitle_visible", required: true, type: Boolean },
    {
      key: "subtitle_vertical", required: true, type: Number, validator: val => {
        if (val > 1 || val <= 0) throw new Error('字幕位置设置错误！')
        return true
      }
    },
    {
      key: "font_size", type: Number, validator: val => {
        if (val > 100 || val <= 0) throw new Error('字幕大小设置错误！')
        return true
      }
    },
  ])
  // console.log(data);
  //这个地方检查权益
  let message = null
  let eqty_info = await checkEquity('SMART_CREATE', userInfo).catch(err => {
    message = String(err)
    if (message == '该权益仅会员使用，请开通会员后使用！') message = 'BUY_VIP'
    if (message == '权益可使用量不足，请购买权益包后使用！') message = 'BUY_EQUITY'
  })
  if (message) return { code: 0, data: { message } }
  let { cost_equity_type } = eqty_info || {}
  await knexTransaction(async trx => {
    let speaker_info = (await trx(SOURCE_DUB).select('style_call as speaker').where({ id: data.speaker_id, status: 1 }))[0]
    let video_category_info = (await trx(SOURCE_TYPE).select('id as video_category').where({ id: data.video_category_id, status: 1 }))[0]
    // console.log(speaker_info, video_category_info);
    if (!speaker_info || !video_category_info) return Promise.reject('音色或素材类型错误！')
    let { speaker } = speaker_info
    let { video_category } = video_category_info
    let dub_url = await getMoYinMp3(data.dub_text, speaker, data.dub_speed || 1.2)
    let video_data = {
      parameter: {
        name: data?.video_name || getUuid(),
        video_category,
        audio: [],
        dub: { volume: data.dub_volume, file_url: dub_url },
        conf: data.config
      },
    }
    if (data.back_audio_id) video_data.parameter.audio = [{ id: Number(data.back_audio_id), volume: data.back_audio_volume }]
    let { task_id: record_id } = await jieziyun_make_video(video_data)
    console.log("记录ID：", record_id, "请求参数：", JSON.stringify(video_data));
    if (!record_id) return Promise.reject("视频合成失败！")
    if (cost_equity_type == 'TOOL_PACKAGE') await operateEquity({ diff_type: 'use_tool', times: 1, account_id: userInfo.id }, 'diff', userInfo, trx)
    let record_data = { record_id, type: "SMART_CREATE", make_status: 1, title: data?.video_name, cost_equity_type }
    let data_id = await record(record_data, userInfo, trx)
    //同时递归调用权益更新数据
    updateIntelligentCreateResult({ id: data_id, record_id, account_id: userInfo.id, cost_equity_type }).catch(err => {
      console.log(err);
    })
    //这个地方开始扣减权益
    return data_id
  })
  return { code: 0, data: { message: "SUCCESS" } }
}

async function updateIntelligentCreateResult(params = {}, times = 1) {
  await sleep(times * 1000)
  console.log(`第${times}次更新${params.id}状态`);
  let data = await update_result(params)
  if (data) return '更新状态成功！'
  times++
  if (times > 10) return '未成功更新状态！'
  return await updateIntelligentCreateResult(params, times)
}
// FREE 完全免费 ACCOUNT_FREE 账户免费次数 VIP_DAY_FREE 会员每天免费 TOOL_PACKAGE 权益包

async function checkEquity(type = '', userInfo = {}) {
  let data = TOOL_COST_MAPPER[type]
  if (!data) return Promise.reject('权益类型错误！')
  let { id: account_id, vip_status } = userInfo
  //这块儿是免费使用 每日限制次数/不限次数
  if (data.vip_status != 2 && !data.every_day_free) {
    return { cost_equity_type: 'FREE', times: data.every_day_free, limit_times: null }
  }

  if (data.vip_status != 2 && data.every_day_free) {
    let free_count = (await knex(TOOLS_RECORD).count('id as num').whereIn('make_status', [1, 2]).where({ account_id, type, cost_equity_type: 'FREE' }))[0]
    if ((data.every_day_free - (free_count?.num || 0)) <= 0) return Promise.reject('今日免费次数已使用完毕！')
    return { cost_equity_type: 'FREE', times: data.every_day_free, limit_times: data.every_day_free - (free_count?.num || 0) }
  }

  if (data.vip_status == 2 && data.not_vip_free) {
    let free_count = (await knex(TOOLS_RECORD).count('id as num').whereIn('make_status', [1, 2]).where({ account_id, type, cost_equity_type: 'ACCOUNT_FREE' }))[0]
    if ((data.not_vip_free - (free_count?.num || 0)) > 0) {
      return { cost_equity_type: 'ACCOUNT_FREE', times: data.not_vip_free, limit_times: data.not_vip_free - (free_count?.num || 0) }
    }
  }
  //该权益为会员权益 且可以购买权益包，没有会员时去查询权益包
  if (data.vip_status == 2 && vip_status != 2 && !data.other_pack) return Promise.reject('该权益仅会员使用，请开通会员后使用！')

  // 两种情况，会员提供免费次数 非会员 查询权益包次数
  if (data.every_day_free && vip_status == 2) {
    let vip_day_free = (await knex(TOOLS_RECORD).count('id as num')
      .whereIn('make_status', [1, 2])
      .where({ account_id, type, cost_equity_type: 'VIP_DAY_FREE', create_date: moment().format('YYYY-MM-DD') }))[0]

    if (data.every_day_free == 'VIP_DAY_FREE') {
      let vip_data = await queryEquity({ diff_type: 'intelligent_creation' }, userInfo)
      // console.log(vip_data);
      if (vip_data.tool_equity_type?.mixed_shear) {
        data.every_day_free = vip_data?.tool_equity_type?.mixed_shear
        if ((vip_data.tool_equity_type.mixed_shear - (vip_day_free?.num || 0)) > 0) {
          return { cost_equity_type: 'VIP_DAY_FREE', times: data.every_day_free, limit_times: (vip_data.tool_equity_type.mixed_shear - (vip_day_free?.num || 0)) }
        }
      }
    } else {
      if ((data.every_day_free - (vip_day_free?.num || 0)) > 0) {
        return { cost_equity_type: 'VIP_DAY_FREE', times: data.every_day_free, limit_times: (data.every_day_free - (vip_day_free?.num || 0)) }
      }
      // return Promise.reject('可用次数已使用完毕！')
    }
  }

  //开始查询权益包
  let tool_equity_data = await queryEquity({ diff_type: 'use_tool' }, userInfo)
  if (tool_equity_data?.limit_num) {
    return { cost_equity_type: 'TOOL_PACKAGE', times: tool_equity_data.total_num, limit_times: tool_equity_data.limit_num }
  }
  return Promise.reject('权益可使用量不足，请购买权益包后使用！')
}

async function getIntelligentCreateTimes(params = {}, userInfo = {}) {
  let { type = 'SMART_CREATE' } = params
  let message = null
  let data = await checkEquity(type, userInfo).catch(err => {
    message = String(err)
    if (message == '该权益仅会员使用，请开通会员后使用！') message = 'BUY_VIP'
    if (message == '权益可使用量不足，请购买权益包后使用！') message = 'BUY_EQUITY'
  })
  if (message) return { code: 0, data: { message } }
  // console.log(data);
  return { code: 0, data }
}
// 获取试听链接
async function audition(body = {}, userInfo = {}) {
  let { speaker_id, dub_speed } = checkKeys(body, [
    { key: "speaker_id", required: true, type: Number },
    {
      key: "dub_speed", required: true, type: Number, validator: val => {
        if (val > 2 || val < 0.5) throw new Error('配音语速设置错误！')
        let y = String(val).indexOf(".") + 1;//获取小数点的位置
        let count = String(val).length - y;//获取小数点后的个数
        if (count > 1) throw new Error('配音语速仅支持一位小数！')
        return true
      }
    }])
  let speaker_info = (await knex(SOURCE_DUB).select('style_call as speaker').where({ id: speaker_id, status: 1 }))[0]
  if (!speaker_info) return Promise.reject('音色或素材类型错误！')
  //缓存180天
  let thumbnail_url = await getMoYinMp3(dub_text, speaker_info.speaker, dub_speed, 180)
  return { code: 0, data: { thumbnail_url, speaker_id, dub_speed } }

}
module.exports = {
  checkWord,
  getXunFeiSigna,
  xunFeiToWord,
  recordList,
  xunfeiStatus,
  deWaterMark,
  updateRecord,
  intelligentCreation,
  getIntelligentCreateTimes,
  audition,
  getDewatermark
};
