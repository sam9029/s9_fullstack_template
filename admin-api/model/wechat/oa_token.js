const { Heap } = require("../../utils/heap")
const { getAccessToken, query_quota, clear_quota, getProductionOAToken } = require("./api")
const { CONFIG_H5, CONFIG_APPLET } = require("./config")


/**
 * @typedef { import("./config").TokenConfig } TokenConfig
 * @typedef { 'h5' | 'applet' } PoolType
 */

/**
 * @typedef { Object } TokenResult
 * @property { string } access_token
 * @property { number } token_after
 * @property { PoolType } type 类型
 * @property { string } site 唯一id
 * @property { string } name 公众号名称
 * @property { boolean? } is_office 
 * @property { string? } avatar 小程序卡片的logo地址
 * @property { string } cover_media 封面素材ID
 * @property { string } imageurl 小程序卡片的图片地址
 */

/**
 * @typedef { keyof(DEACTIVE) } DeactiveType
 */
const DEACTIVE = {
  NORMAL: -1,
  DAY_LIMIT: -99,
}

class Token {
  name = "";
  site = '';

  /**
   * @private
   * @type { TokenConfig }
   */
  config = null;

  priority = 0;
  /**@private */
  priority_base = 0;

  access_token = "";
  token_after = 0; //token过期的时间，秒级时间戳

  /**@private */
  clear_try = 0; // 清空次数 统计用
  /**@private */
  clear_success = 0; // 清空次数 统计用

  /**@param { TokenConfig } config */
  constructor(config, type) {
    this.set_config(config, type);
    this.set_priority(config.priority);
  }

  /**
   * @private
   * @param { TokenConfig } config 
   */
  set_config(config, type) {
    this.name = config.name;
    this.site = config.site;

    this.config = Object.assign({ type: type || 'h5' }, config);
  }

  /**@private*/
  set_priority(priority) {
    priority = ~~(priority);
    // priority如果小于等于0 就只能一直获取该token
    if (priority === 0 || isNaN(priority)) {
      throw "priority must >= 1 or -1"
    }
    this.priority = priority;

    if (!this.is_deactive()) {
      // 设置相同起点 在少量次数时比例更精准
      this.priority = 0;
    }
    
    this.priority_base = priority;
  }

  /**是否已经过期 */
  is_expire() {
    if (!this.access_token) return true;
    const now = ~~(Date.now() / 1000);
    return now >= this.token_after;
  }

  /**可能有的需要不分配，但又能通过指定site获取，指定priority < 0即可 */
  is_deactive() {
    return this.priority < 0;
  }

  /**
   * @param { DeactiveType } deactive_type 
   */
  deactive(deactive_type) {
    if (deactive_type == 'DAY_LIMIT') {
      this.priority = DEACTIVE.DAY_LIMIT;
    } else {
      this.priority = DEACTIVE.NORMAL;
    }
  }

  /**@private */
  clear() {
    this.access_token = "";
    this.token_after = 0;
    return this;
  }

  /**
   * @private
   * @returns { TokenResult }
   */
  token_result() {
    return {
      type: this.config.type,
      site: this.site,
      name: this.name, // log用
      access_token: this.access_token,
      token_after: this.token_after,
      is_office: this.config.is_office,
      avatar: this.config.avatar,
      cover_media: this.config.cover_media,
      imageurl: this.config.imageurl,
    }
  }

  refresh() {
    if (process.env.NODE_ENV != "production") {
      return this.get_prod_token()
    }
    const params = {
      grant_type: "client_credential",	//string	填写 client_credential
      appid: this.config.appid,	//string 小程序唯一凭证，即 AppID，可在「微信公众平台 - 设置 - 开发设置」页中获得。（需要已经成为开发者，且帐号没有异常状态）
      secret: this.config.app_secret,	//string 小程序唯一凭证密钥，即 AppSecret，获取方式同 appid
    }
    let time_now = ~~(new Date().getTime() / 1000)
    return getAccessToken(params).then(res => {
      if (res?.access_token) {
        this.access_token = res.access_token;
        this.token_after = time_now + (res.expires_in || 600) - 300
      } else {
        // 刷新失败 且已经过期
        if (this.is_expire()) {
          console.log("get oa token err:\n", res.errmsg);
          this.clear();
          throw "refresh wx oa token fail, and token is expired";
        }
      }
      return this.token_result();
    })
  }

  /**获取该配置的token */
  get_token(refresh = false) {
    if (!refresh) {
      if (!this.is_expire()) {
        return Promise.resolve(this.token_result());
      }
    }
    return this.refresh()
  }

  increase_priority() {
    if (this.is_deactive()) {
      console.log("deactived token shoud't change priority!")
      return this;
    }
    this.priority += this.priority_base;
    return this
  }

  /**
   * 测试用 获取线上token
   */
  get_prod_token() {
    const { site, type } = this.config;
    return getProductionOAToken({
      token: 'qwertyuiopasdfghjkl',
      type,
      site,
      refresh: false,
    }).then(data => {
      if (data.code == 0) {
        /**@type { TokenResult } */
        const token = data.data;
        this.access_token = token.access_token;
        this.token_after = token.token_after;
        return token
      } 
      throw data.message;
    })
  }

  query_clear_remain() {
    return this.get_token()
      .then(token => {
        return query_quota("/cgi-bin/clear_quota", token.access_token)
      })
      .then(res => {
        if (res.errcode == 0) {

          /**@type { { daily_limit: number, used: number, remain: number, } } */
          const quota = res.quota

          console.log(`${this.name} quota`, JSON.stringify(quota));

          return quota.remain;
        } else {
          throw `获取公众号${this.name}信息失败！请稍后重试`
        }
      })
  }

  clear_api_quota() {
    this.clear_try += 1;
    return this.get_token()
      .then(token => {
        return clear_quota(this.config.appid, token.access_token);
      }).then(res => {
        if (res.errcode == 0) this.clear_success += 1;
        return {
          code: 0,
          success: res.errcode == 0,
          message: res.errmsg
        }
      }).catch(err => {
        const msg = err.message || err || "刷新公众号上限失败！";
        return {
          code: 1,
          success: false,
          message: msg
        }
      })
  }
}


class TokenPool extends Heap {
  // 上次token使用时间(天)
  last_day = -1;

  constructor() {
    super();
  }

  /**
   * @param { Token } parnet 
   * @param { Token } child 
   */
  isParentChildCorrect(parnet, child) {
    if (!parnet.is_deactive()) {
      if (!child.is_deactive()) {
        // 父子有效
        return parnet.priority <= child.priority
      }
      // 父有效 子失效
      return true;
    } else {
      // 父失效 子有效
      if (!child.is_deactive()) return false
      // 父子失效 -99 < -1 上限失效的 在 普通失效的之上
      return parnet.priority <= child.priority
    }
  }

  /**
   * @param { TokenConfig[] } configs 
   * @param { PoolType } type 
   */
  init(configs, type) {
    if (!configs?.length) throw "no token config"
    for (let i = 0; i < configs.length; i++) {
      const cofig = configs[i];
      this.add(new Token(cofig), type)
    }
    return this;
  }

  /**
   * 获取token 会改变下次token的顺序
   */
  getToken(refresh = false) {
    // 每日激活达到上限的token
    const now_day = new Date().getDay();
    if (now_day != this.last_day) {
      this.last_day = now_day;
      this.active_by_new_day();
    }
    
    
    /**@type { Token? } */
    const token = this.peek();
    if (!token) throw "no token config find";
    if (token.is_deactive()) {
      // if (token.priority == DEACTIVE.DAY_LIMIT) {
      //   throw "今日所有公众号皆已达到发布上限，请明日再试！";
      // }
      // throw "all token is deactive, please use getSiteToken"

      throw "ERROR_ALL_OA_TOKEN_DEACTIVE";
    }

    return token.get_token(refresh).then(token_res => {
      token.increase_priority();
      this.heapifyDown(0);
      return token_res;
    })
  }

  site_deactive(site, deactive_type) {
    const { token: site_token, index }= this.find_site(site);
    site_token.deactive(deactive_type);

    // 无效为最大，一定比父大， 小堆下修正
    this.heapifyDown(index);
  }

  active_by_new_day() {
    /**@type { Token[] } */
    const limit_deactives = [];
    for (let i = 0; i < this.collection.length; i++) {
      /**@type { Token } */
      const token = this.collection[i];
      if (token.is_deactive()) {
        if (token.priority == DEACTIVE.DAY_LIMIT) {
          // 此时不能移除，会破坏index
          limit_deactives.push(token);
        }
      }
    }

    let lower_priority = -1;
    /**@type { Token? } */
    const lower_token = this.peek();
    if (!lower_token || lower_token.is_deactive()) {
      lower_priority = 0;
    } else {
      lower_priority = lower_token.priority;
    }

    for (let i = 0; i < limit_deactives.length; i++) {
      const token = limit_deactives[i];
      // 移除再添加 维护堆
      this.remove(token);
      token.priority = lower_priority;
      this.add(token);
    }
  }

  /**
   * 获取指定公众号token 不会改变顺序
   */
  getSiteToken(site, refresh = false) {
    const { token: site_token } = this.find_site(site);

    return site_token.get_token(refresh)
      // .then(token_res => {
      //   site_token.increase_priority();
      //   // 增加优先级 必满足大于父
      //   this.heapifyDown(index);
      //   return token_res;
      // })
  }

  /**@returns { { token: Token, index: number } } */
  find_site(site) {
    const tokens = this.findBy(v => v.site === site);
    if (!tokens.length) throw "site id is not find";
    return { token: tokens[0].item, index: tokens[0].index }
  }
}


const h5_token_pool = new TokenPool().init(CONFIG_H5, 'h5');
const applet_token_pool = new TokenPool().init(CONFIG_APPLET, 'applet');

function get_pool(type) {
  return type == 'h5' ? h5_token_pool : applet_token_pool;
}

const token_pool = {
  /**
   * @param { PoolType } type
   * 获取token 会改变下次token的顺序
   */
  getToken(type, refresh = false) {
    return get_pool(type).getToken(refresh);
  },

  /**
   * @param { PoolType } type
   * 获取指定公众号token 不会改变顺序
   */
  getSiteToken(type, site, refresh = false,) {
    return get_pool(type).getSiteToken(site, refresh);
  },


  /**
   * @param { PoolType } type
   */
  find_site_token(type, site) {
    return get_pool(type).find_site(site).token
  },


  /**
   * @param { PoolType } type
   * 清除指定公众号quota
   */
  clear_site_quota(type, site) {
    return token_pool.find_site_token(type, site).clear_api_quota();
  },

  /**
   * @param { PoolType } type
   * @param { DeactiveType } deactive_type
   * 清除指定公众号quota
   */
  set_site_deactive(type, site, deactive_type) {
    return get_pool(type).site_deactive(site, deactive_type);
  },
  
  state(){
    const h5_pool = get_pool('h5');
    const applet_pool = get_pool('applet');

    /**@param { Token} v */
    const format = v => {
      return {
        name: v.name,
        site: v.site,
        priority: v.priority,
        clear_try: v.clear_try,
        clear_success: v.clear_success,
      }
    }
    return {
      h5_pool: h5_pool.collection.map(format),
      applet_pool: applet_pool.collection.map(format),
    }
  }
}

/**@param { TokenResult } token_result */
function is_token_expired(token_result) {
  if (!token_result.access_token) return true;
  return ~~(Date.now() / 1000) >= token_result.token_after;
}

module.exports = {
  OATokenPool: token_pool,
  isOATokenExpired: is_token_expired,
}


// 为每个配置上传素材 测试用
/**@param { PoolType? } type */
async function all_token_upload(oss_url, type) {
  // return console.log("no")
  const { uploadImage } = require("./api");
  const { getStream } = require("../public/upload")

  /**@type { TokenConfig[] } */
  const configs = [];

  if (!type || type == 'h5') {
    CONFIG_H5.forEach(v => {
      if (!configs.some(c => c.appid == v.appid)) {
        configs.push(v);
      }
    })
  }
  if (!type || type == 'applet') {
    CONFIG_APPLET.forEach(v => {
      if (!configs.some(c => c.appid == v.appid)) {
        configs.push(v);
      }
    })
  }

  for (let i = 0; i < configs.length; i++) {
    const token = new Token(configs[i]);
    let { access_token }  = await token.get_token();

    let file = await getStream(oss_url)
    let res = await uploadImage(file, access_token)

    let { url, media_id } = res;

    console.log(token.name)
    console.log(url)
    console.log(media_id)
    console.log("\n")
  };

}

// let oss_url = "https://koc-img.domain.cn/applet/wx_cover_url.png"
// let oss_url = "https://koc-img.domain.cn/applet/wx_applet_cover.jpg"

// let oss_url = "https://koc-img.domain.cn/applet/wx_h5_cover.png"
// all_token_upload(oss_url, 'h5')