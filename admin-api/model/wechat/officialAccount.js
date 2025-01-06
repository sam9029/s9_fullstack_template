const { getAccessToken, getProductionOAToken, uploadImage, wxDraftAdd, wxDraftPublish } = require("./api")
const { sleep, sleep_while } = require("../../utils/tools")
const { OATokenPool, isOATokenExpired } = require("./oa_token");
const { TEMPLATE } = require("./config")


/**
 * @typedef { import ('./oa_token').TokenResult } TokenResult
 * @typedef { import ('./oa_token').PoolType } PoolType
 */
/**
 * @typedef { Object } PublishParams
 * @property { PoolType } template
 * @property { string? } site 指定类型下的公众号site
 * @property { TokenResult? } token 指定token
 * @property { string } click_url
 * @property { string } author
 * @property { string? } title
 * @property { string? } applet_path
 * @property { string? } app_id
 */

/**
 * @param { PoolType } type
 * @returns { Promise<TokenResult> }
 */
async function getOAToken(refresh = false, type = 'h5', site) { //获取公众号的token
  if (process.env.NODE_ENV != "production") {//非生产环境，获取线上token
    let data = await getProductionOAToken({
      token: 'qwertyuiopasdfghjkl',
      type,
      site
    })
    // console.log(data);
    if (data && data.code == 0) return data.data
    return Promise.reject('获取线上微信token失败！')
  }
  if (!site) {
    return OATokenPool.getToken(type, refresh);
  }
  return OATokenPool.getSiteToken(type, site, refresh);
}

var loading_mapper = {}
/**
 * @param { PoolType } type 默认applet类型 不需要认证
 */
async function batchGetToken(refresh = false, type = 'applet', site = null) {
  if (loading_mapper['token']) {
    await sleep(200)
    return await getOAToken(refresh, type, site)
  }
  loading_mapper['token'] = true
  return await getOAToken(refresh, type, site).finally(() => {
    loading_mapper['token'] = false
  })
}
/**
 * @param { PublishParams } params 
 * @param { TokenResult } token 
 */
function get_draft_content(params, token) {
  if (params.template == 'h5') {
    let content = TEMPLATE.h5
      .replace(/{\$data-src\$}/, token.imageurl);
    let btn_content = '';
    if (token.is_office) {
      btn_content = TEMPLATE.h5_btn.replace(/{\$href\$}/, params.click_url)
        .replace(/{\$button\$}/, params.button_text);
    }
    return content.replace(/{\$btn-slot\$}/, btn_content);
  } else {
    return TEMPLATE.applet
      .replace(/{\$mini-avatar\$}/, token.avatar)
      .replace(/{\$mini-src\$}/, token.imageurl) // 5:4
      .replace(/{\$mini-title\$}/, params.title)
      .replace(/{\$mini-path\$}/, params.applet_path) // 小程序跳转页
      .replace(/{\$mini-appid\$}/, params.app_id);
  }
}


/**
 * @param { PublishParams } params 
 * @param { TokenResult } token 
 */
async function draft_add(params, token) {
  await sleep_while(() => (loading_mapper["add_draft"] || 0) > 10);
  if (isOATokenExpired(token)) {
    token = await OATokenPool.getSiteToken(params.template, token.site);
  }
  params.content = get_draft_content(params, token);
  params.media_id = token.cover_media;
  loading_mapper['add_draft'] = (loading_mapper['add_draft'] || 0) + 1;
  return wxDraftAdd(params, token.access_token).finally(() => {
    loading_mapper['add_draft'] -= 1
  })
}
// draft_media_id MdagiaULRdmD6qagWa1gwakPFXl8Xlop6u2EENPZ435Ugnoy63NCb93CMGloS6ep

/**@param { TokenResult } token  */
async function draft_publish(media_id, token) {
  let back = null;

  // 单独公众号发布1次 + 上限时重试1次
  for (let retry = 2; retry > 0; retry--) {
    loading_mapper['publish_draft'] = (loading_mapper['publish_draft'] || 0) + 1;
    await sleep_while(() => (loading_mapper["publish_draft"] || 0) > 10);
    if (isOATokenExpired(token)) {
      token = await OATokenPool.getSiteToken(token.type, token.site);
    }

    back = await wxDraftPublish(media_id, token.access_token).finally(() => {
      loading_mapper['publish_draft'] -= 1
    })

    // console.log('back', back);
    if (back.errcode == 0) {
      return back;
    }
    // 其他不重试
    if (back.errcode != 45009) {
      throw '获取推广链接异常，请稍后再试！'
    }

    // 45009 尝试清空
    if (retry > 1) { // 最后一次不清空
      const clear_res = await OATokenPool.clear_site_quota(token.type, token.site);
      if (!clear_res.success) {
        // 调用成功，但清空失败 code == 0, success == false
        // 调用失败: 网络原因、code error、 ...  code == 1
        break;
      } else {
        // 清空成功  code == 0, success == true
        // continue // 重试
      }
    }
  }

  OATokenPool.set_site_deactive(token.type, token.site, 'DAY_LIMIT');


  throw `${token.name}今日发布已达公众号上限，请重试以尝试其他公众号！`
}

/**
 * @param { PublishParams } params 
 * @param { TokenResult? } token 
 */
async function draft_create_then_publish(params, token) {
  if (!token) token = await batchGetToken(false, params.template, params.site);
  console.log("此次发布使用公众号：", token.name);

  let create_res = await draft_add(params, token);
  if (!create_res.media_id) throw create_res.errmsg;
  await sleep(200);
  let publish_res = await draft_publish(create_res.media_id, token);
  if (!publish_res.publish_id) throw publish_res;
  // console.log('site', `${publish_res.publish_id}_${token.site}`);
  return `${publish_res.publish_id}_${token.site}`

}

/**
 * @param { PublishParams } params 
 * @param { TokenResult? } token 
 */
async function try_create_then_publish(params, token) {
  // 指定token不换号发布
  // 不指定尝试换2次公众号
  let last_err = null;
  const change_max = token ? 1 : 3;
  for (let change = 0; change < change_max; change++) {
    try {
      const callback_key = await draft_create_then_publish(params, token);
      return callback_key
    } catch (err) {
      last_err = err;
      if (err == 'ERROR_ALL_OA_TOKEN_DEACTIVE') {
        throw "今日所有公众号皆已达到发布上限，请明日再试！"
      }
    }
  }
  throw last_err;
}

// getOAToken()
// uploadImageToWechat('https://koc-img.domain.cn/wechat_material/D5F0E65477724A74A18A183E58455FF4.png')
module.exports = {
  batchGetToken,
  draftPublish: try_create_then_publish,
}