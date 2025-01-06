const knex = require("../../db/knexManager").knexProxy;
const OSS = require('ali-oss');
const { BANK_VERIFY_TABLE, BANK_TABLE, ACCOUNT_TABLE, PAYMENT_RELATION_TABLE, WITHDRAW_DETAILS, DATA_SPLIT, KOC_KEYWORD, BANK_WHITE_LIST } = require("../../config/setting")
const request = require("../../utils/request");
const { getDaysBetweenDate, knexTransaction, checkPhone, getPeopleAge } = require("../../utils/tools")
const { makeSignWithDX } = require("../../utils/payment/tools")
const { userMakeSign } = require("../../utils/payment/aicaipay/api")
const { getPermission } = require("./permission")
const { encrypt, decrypt } = require("../../utils/jwt")
const { insertLog, getLogData } = require("../public/operationLog")
const ali_domain = "https://ccdcapi.alipay.com/validateAndCacheCardInfo.json"
const bucket = (require('../../config/index')).bucket;
const store = new OSS(bucket);
const publicHost = bucket.publicHost;
const { getAppUserInfo } = require("../wechat/app");
const { checkKeys } = require("../../utils/check_type");
const { useCustomCache } = require("../../db/redis");
const { RK_BANK_IS_WHITELIST } = require("../../config/redis_key");
const { checkSmsByType } = require("../login");
const BANK_MAPPER = {
    "CDB": "国家开发银行", "ICBC": "中国工商银行", "ABC": "中国农业银行", "BOC": "中国银行",

    "CCB": "中国建设银行", "PSBC": "中国邮政储蓄银行", "COMM": "交通银行", "CMB": "招商银行",

    "SPDB": "上海浦东发展银行", "CIB": "兴业银行", "HXBANK": "华夏银行", "GDB": "广东发展银行",

    "CMBC": "中国民生银行", "CITIC": "中信银行", "CEB": "中国光大银行", "EGBANK": "恒丰银行",

    "CZBANK": "浙商银行", "BOHAIB": "渤海银行", "SPABANK": "平安银行", "SHRCB": "上海农村商业银行",

    "YXCCB": "玉溪市商业银行", "YDRCB": "尧都农商行", "BJBANK": "北京银行", "SHBANK": "上海银行",

    "JSBANK": "江苏银行", "HZCB": "杭州银行", "NJCB": "南京银行", "NBBANK": "宁波银行", "HSBANK": "徽商银行",

    "CSCB": "长沙银行", "CDCB": "成都银行", "CQBANK": "重庆银行", "DLB": "大连银行", "NCB": "南昌银行",

    "FJHXBC": "福建海峡银行", "HKB": "汉口银行", "WZCB": "温州银行", "QDCCB": "青岛银行", "TZCB": "台州银行",

    "JXBANK": "嘉兴银行", "CSRCB": "常熟农村商业银行", "NHB": "南海农村信用联社", "CZRCB": "常州农村信用联社",

    "H3CB": "内蒙古银行", "SXCB": "绍兴银行", "SDEB": "顺德农商银行", "WJRCB": "吴江农商银行", "ZBCB": "齐商银行",

    "GYCB": "贵阳市商业银行", "ZYCBANK": "遵义市商业银行", "HZCCB": "湖州市商业银行", "DAQINGB": "龙江银行",

    "JINCHB": "晋城银行JCBANK", "ZJTLCB": "浙江泰隆商业银行", "GDRCC": "广东省农村信用社联合社",

    "DRCBCL": "东莞农村商业银行", "MTBANK": "浙江民泰商业银行", "GCB": "广州银行", "LYCB": "辽阳市商业银行",

    "JSRCU": "江苏省农村信用联合社", "LANGFB": "廊坊银行", "CZCB": "浙江稠州商业银行", "DYCB": "德阳商业银行",

    "JZBANK": "晋中市商业银行", "BOSZ": "苏州银行", "GLBANK": "桂林银行", "URMQCCB": "乌鲁木齐市商业银行",

    "CDRCB": "成都农商银行", "ZRCBANK": "张家港农村商业银行", "BOD": "东莞银行", "LSBANK": "莱商银行",

    "BJRCB": "北京农村商业银行", "TRCB": "天津农商银行", "SRBANK": "上饶银行", "FDB": "富滇银行",

    "CRCBANK": "重庆农村商业银行", "ASCB": "鞍山银行", "NXBANK": "宁夏银行", "BHB": "河北银行",

    "HRXJB": "华融湘江银行", "ZGCCB": "自贡市商业银行", "YNRCC": "云南省农村信用社", "JLBANK": "吉林银行",

    "DYCCB": "东营市商业银行", "KLB": "昆仑银行", "ORBANK": "鄂尔多斯银行", "XTB": "邢台银行", "JSB": "晋商银行",

    "TCCB": "天津银行", "BOYK": "营口银行", "JLRCU": "吉林农信", "SDRCU": "山东农信", "XABANK": "西安银行",

    "HBRCU": "河北省农村信用社", "NXRCU": "宁夏黄河农村商业银行", "GZRCU": "贵州省农村信用社",

    "FXCB": "阜新银行", "HBHSBANK": "湖北银行黄石分行", "ZJNX": "浙江省农村信用社联合社", "XXBANK": "新乡银行",

    "HBYCBANK": "湖北银行宜昌分行", "LSCCB": "乐山市商业银行", "TCRCB": "江苏太仓农村商业银行",

    "BZMD": "驻马店银行", "GZB": "赣州银行", "WRCB": "无锡农村商业银行", "BGB": "广西北部湾银行",

    "GRCB": "广州农商银行", "JRCB": "江苏江阴农村商业银行", "BOP": "平顶山银行", "TACCB": "泰安市商业银行",

    "CGNB": "南充市商业银行", "CCQTGB": "重庆三峡银行", "XLBANK": "中山小榄村镇银行", "HDBANK": "邯郸银行",

    "KORLABANK": "库尔勒市商业银行", "BOJZ": "锦州银行", "QLBANK": "齐鲁银行", "BOQH": "青海银行",

    "YQCCB": "阳泉银行", "SJBANK": "盛京银行", "FSCB": "抚顺银行", "ZZBANK": "郑州银行", "SRCB": "深圳农村商业银行",

    "BANKWF": "潍坊银行", "JJBANK": "九江银行", "JXRCU": "江西省农村信用", "HNRCU": "河南省农村信用",

    "GSRCU": "甘肃省农村信用", "SCRCU": "四川省农村信用", "GXRCU": "广西省农村信用", "SXRCCU": "陕西信合",

    "WHRCB": "武汉农村商业银行", "YBCCB": "宜宾市商业银行", "KSRB": "昆山农村商业银行", "SZSBK": "石嘴山银行",

    "HSBK": "衡水银行", "XYBANK": "信阳银行", "NBYZ": "鄞州银行", "ZJKCCB": "张家口市商业银行", "XCYH": "许昌银行",

    "JNBANK": "济宁银行", "CBKF": "开封市商业银行", "WHCCB": "威海市商业银行", "HBC": "湖北银行",

    "BOCD": "承德银行", "BODD": "丹东银行", "JHBANK": "金华银行", "BOCY": "朝阳银行", "LSBC": "临商银行",

    "BSB": "包商银行", "LZYH": "兰州银行", "BOZK": "周口银行", "DZBANK": "德州银行", "SCCB": "三门峡银行",

    "AYCB": "安阳银行", "ARCU": "安徽省农村信用社", "HURCB": "湖北省农村信用社", "HNRCC": "湖南省农村信用社",

    "NYNB": "广东南粤银行", "LYBANK": "洛阳银行", "NHQS": "农信银清算中心", "CBBQS": "城市商业银行资金清算中心"
}
const SIGN_MESSAGE = '您在$p的账户名下绑定了新的收款人，经您本人确认，无论您将账户内资金提现至任何账户，均视为已同$p完成结算并无异议，请您在操作提现时注意风险，特此提醒。'
const CARD_TYPE_MAPPER = {
    DC: "储蓄卡",
    CC: "信用卡",
    SCC: "准贷记卡",
    PC: "预付费卡"
};
function getCardInfo(cardNo) {
    return request({
        url: `${ali_domain}?_input_charset=utf-8&cardNo=${cardNo}&cardBinCheck=true`,
        method: 'get',
        headers: {
            "content-type": "application/json",
        }
    })
}
function getBankImg(bank) {
    return request({
        url: `https://banklogo.yfb.now.sh/resource/logo/${bank}.png`,
        method: 'get',
        headers: {
            // "content-type": "application/json",
        },
        responseType: "stream"
    })
}

function getMainUrl(bank_account) {
    return request({
        bank_account,
        method: 'get',
        return_all: true
    })
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
async function getBanckIconUrl(bank) {
    let icon_info = await (knex(BANK_TABLE).select('icon').where({ bank }).whereNotNull('icon').limit(1))[0]
    if (icon_info) return icon_info.icon
    let stream = await getBankImg(bank)
    let result = await store.putStream(`bank-image/${bank}.png`, stream)
    return publicHost + result.name
}
// let bank_account = 'https://v.douyin.com/88uVYQJ/'
async function getBankInfo(bank_account, get_image = false, get_icon = false) {
    let bank_info = await getCardInfo(bank_account)
    if (!bank_info) return Promise.reject('银行信息查询异常！')
    let { validated, cardType, bank } = bank_info
    if (!validated) return Promise.reject('银行卡号不存在或卡号错误！')
    let back = {
        bank_account,
        card_type: cardType,
        card_type_name: CARD_TYPE_MAPPER[cardType] || '未知类型',
        bank,
        bank_short_name: BANK_MAPPER[bank] || '未知银行'
    }
    if (get_image && bank) back.bank_image = `https://apimg.alipay.com/combo.png?d=cashier&t=${bank}`
    if (get_icon && bank) await getBanckIconUrl(bank).then(icon => {
        back.bank_icon = icon
    }).catch(err => {
        back.bank_icon = null
        console.log(err);
    })
    return back
}
//查询当前人绑定的银行卡信息
async function list(query = {}, userInfo = {}) {
    let { id: account_id } = userInfo || {}
    let retu = {
        code: 0,
        data: {
            list: []
        },
    }
    let select_cloums = ['ban.id', 'ban.pay_platform', 'ban.people_name', 'ban.pay_account', 'ban.verify_status', 'ban.verify_suggest', 'ban.uid'];
    let knexSql = knex.select(select_cloums)
        .from(`${BANK_TABLE} as ban`)
        .where({ "ban.account_id": account_id }) //

    knexSql = handler.searchFilter(knexSql, query)
    retu.data.list = await knexSql.orderBy("id", 'desc')
    retu.data.list = retu.data.list.map(i => {
        let { people_name, pay_account } = formatUserInfo(i);
        if (i.uid) i.need_sign = false;
        else i.need_sign = true;
        delete i.uid;
        return { ...i, people_name, pay_account }
    })
    // console.log(retu.data);
    // retu.data = encrypt(retu.data, token)
    return retu

}
async function def(query = {}, userInfo = {}) {
    let { oem_id, token } = userInfo || {}
    let retu = {
        code: 0,
        count: 0,
        data: [],
        limit: Number(query.limit || 1),
    }
    if (!query.account_id) return Promise.reject('未设置查询者！')
    let select_cloums = ['ban.*']
    let knexSql = knex.select(select_cloums)
        .from(`${BANK_TABLE} as ban`)
        .where({ "ban.oem_id": oem_id })
        .where({ 'ban.account_id': query.account_id })

    // let accountIds = await getPermission(query, userInfo);
    // if (accountIds.length) knexSql.whereIn('ban.create_user_id', accountIds).orWhereIn('ban.account_id', accountIds)
    knexSql = handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .select(knex.raw(`(SELECT COUNT(payr.id) FROM ${PAYMENT_RELATION_TABLE} as payr LEFT JOIN ${WITHDRAW_DETAILS} as pay ON pay.id = payr.payment_id WHERE payr.collection_id = ban.id AND pay.payment_date IS NOT NULL) as has_paydata`)) //是否已付过款
        .select(handler.selectName('ban', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
        .select(handler.selectName('ban', ACCOUNT_TABLE, "account_id", "name", "account_name"))
        .limit(retu.limit).orderBy(["sort", 'id'])
    retu.data = retu.data.map(i => {
        i.card_type_name = CARD_TYPE_MAPPER[i.card_type] || '未知类型'
        i.bank_short_name = BANK_MAPPER[i.bank] || '未知银行'
        i.bank_image = i.bank ? `https://apimg.alipay.com/combo.png?d=cashier&t=${i.bank}` : null
        return i
    })
    // console.log(retu.data);
    retu.data = encrypt(retu.data, token)
    return retu

}
async function add(body = {}, userInfo) {
    if (body.iv && body.content) body = decrypt(body, userInfo.token)
    let insert_data = handler.checkData(body, userInfo)
    const { bank_account, account_id, people_name, owner_type, id_card } = insert_data
    let before_data = (await knex(BANK_TABLE).select('id', 'status', 'id_card').where({ account_id }).limit(1))[0]
    if (before_data && before_data.id_card != 3) return Promise.reject(`存在相同银行账号「${insert_data.bank_account}」，不允许重复添加！`)
    let data = await knexTransaction(async trx => {
        let { bank, card_type, bank_icon } = await getBankInfo(bank_account, true, true)
        await checkAccountName(account_id, people_name, owner_type, false, trx)
        let id = (await trx(BANK_TABLE).insert({ ...insert_data, bank, card_type, icon: bank_icon })
            .onConflict(['bank_account', 'account_id']).merge())[0]
        // await updateCertificatePlatform(id, trx)
        await insertLog(trx, getLogData(id, 3401, insert_data, userInfo))
        return id
    })
    return { code: 0, data }
}
async function checkAccountName(account_id, people_name, owner_type, return_error = true, trx = knex) {
    let account_data = (await trx(ACCOUNT_TABLE).select('id', 'name').where({ id: account_id, status: 1 }))[0]
    if (!account_data) return Promise.reject('当前账户不存在或已删除！')
    if (owner_type == 1 && account_data.name != people_name) {
        if (return_error) return Promise.reject('添加的银行卡收款人姓名与账户昵称不一致，请修改账户昵称为真实姓名后再进行操作！')
        else await trx(ACCOUNT_TABLE).update({ name: people_name }).where({ id: account_id })
    }
}
async function checkBankName(account_id, name) {
    let bank_data = (await knex(BANK_TABLE).select('people_name')
        .where({ account_id, owner_type: 1 }).limit(1).orderBy('id', 'desc'))[0]
    if (bank_data && bank_data.people_name != name)
        return Promise.reject('修改的账户昵称与银行卡收款人姓名不一致，请修改银行卡收款人姓名为真实姓名后再进行操作！')
}
async function verifyInfo(query = {}, userInfo = {}) {
    let { oem_id, token } = userInfo || {}
    let retu = {
        code: 0,
        count: 0,
        data: [],
        limit: Number(query.limit || 30),
    }
    if (!query.bank_card_id) return Promise.reject('未设置查询银行卡！')
    let select_cloums = ['ban.create_user_id', 'ban.account_id', 'ban.card_type', 'ban.bank', 'bvf.*']
    let knexSql = knex.select(select_cloums)
        .from(`${BANK_VERIFY_TABLE} as bvf`)
        .leftJoin(`${BANK_TABLE} as ban`, "ban.id", "bvf.bank_card_id")
        .where({ "ban.oem_id": oem_id })
        .where({ 'bvf.bank_card_id': query.bank_card_id })
        .where({ 'bvf.status': 1 })
    knexSql = handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    retu.data = await knexSql
        .select(handler.selectName('ban', ACCOUNT_TABLE, "create_user_id", "name", "create_user_name"))
        .select(handler.selectName('ban', ACCOUNT_TABLE, "account_id", "name", "account_name"))
        .limit(retu.limit).orderBy(["sort", 'id'])
    retu.data = retu.data.map(i => {
        i.card_type_name = CARD_TYPE_MAPPER[i.card_type] || '未知类型'
        i.bank_short_name = BANK_MAPPER[i.bank] || '其他银行'
        i.bank_image = i.bank ? `https://apimg.alipay.com/combo.png?d=cashier&t=${i.bank}` : null
        return i
    })
    retu.data = encrypt(retu.data, token)
    return retu
}
function getBankShowInfo(data = {}) {
    let { bank, bank_account, people_name } = data || {}
    if (!bank || !bank_account || !people_name) return {}
    let bank_short_name = BANK_MAPPER[bank] || '其他银行'
    let card_info = `${bank_short_name}（${bank_account.substr(bank_account.length - 4, 4)}）`;
    let length = people_name.length;
    let str = people_name.substr(0, 1);
    if (length <= 2) people_name = str + "*";
    else people_name = `${str}*${people_name.substr(length - 1, 1)}`;
    return { card_info, people_name }
}
function getBankMixInfo(data = {}) {
    let { bank, bank_account, people_name } = data || {}
    if (!bank || !bank_account || !people_name) return {}
    let bank_short_name = BANK_MAPPER[bank] || '其他银行'
    bank_account = `****${bank_account.substr(bank_account.length - 4, 4)}`
    let length = people_name.length;
    let str = people_name.substr(0, 1);
    if (length <= 2) people_name = str + "*";
    else people_name = `${str}*${people_name.substr(length - 1, 1)}`;
    return { people_name, bank_short_name, bank_account }
}

function formatUserInfo(data = {}) {
    // id_card  '530**********6101'
    // mobile: '135******12'
    // pay_account: '****0816'
    // people_name: '张*名，林*'
    let { people_name, id_card, pay_account, mobile } = data;
    if (pay_account) pay_account = `****${pay_account.substr(pay_account.length - 4, 4)}`;
    if (people_name) {
        let length = people_name.length;
        let str = people_name.substr(0, 1);
        if (length <= 2) people_name = str + "*";
        else people_name = `${str}*${people_name.substr(length - 1, 1)}`;
    }
    if (id_card) {
        id_card = id_card.replace(/(.{3}).*(.{4})/, "$1***********$2");
    }

    if (mobile) mobile = mobile.replace(/(.{3}).*(.{2})/, "$1******$2")
    return { people_name, pay_account, id_card, mobile }
}

async function updateCertificatePlatform(bank_id, trx = knex) {
    let data = (await trx.select('certificate_platform').from(BANK_TABLE).where({ id: bank_id }))[0]
    if (!data) return
    await trx(BANK_VERIFY_TABLE).update({ status: 3 }).where({ bank_card_id: bank_id })
    let certificate_platform = JSON.parse(data.certificate_platform || '[]')
    let verify_insert = certificate_platform.map(certificate_type => {
        return { bank_card_id: bank_id, certificate_type, status: 1 }
    })
    if (verify_insert.length) await trx(BANK_VERIFY_TABLE).insert(verify_insert).onConflict(['bank_card_id', 'certificate_type']).merge()
}
async function edit(body = {}, userInfo) {
    if (body.iv && body.content) body = decrypt(body, userInfo.token)
    const { id } = body || {}
    if (!id) return Promise.reject('未设置修改银行卡ID！')
    let update_data = handler.checkData(body, userInfo, 'edit')
    const { bank_account, owner_type } = update_data
    let before_data = (await knex.select('ban.*')
        .select(knex.raw(`(SELECT COUNT(payr.id) FROM ${PAYMENT_RELATION_TABLE} as payr LEFT JOIN ${WITHDRAW_DETAILS} as pay ON pay.id = payr.payment_id WHERE payr.collection_id = ban.id AND pay.payment_date IS NOT NULL) as has_paydata`)) //是否已付过款
        .from(`${BANK_TABLE} as ban`)
        .where({ 'ban.id': id }))[0]
    if (!before_data) return Promise.reject('该银行卡不存在！')
    if (update_data.status == 3 && before_data.has_paydata) return Promise.reject('该银行卡存在付款记录，暂不支持解绑！')
    if (bank_account) {
        let { bank, card_type } = await getBankInfo(bank_account)
        update_data.bank = bank
        update_data.card_type = card_type
    }
    const { account_id, people_name } = before_data
    let data = await knexTransaction(async trx => {
        if (owner_type && owner_type != before_data.owner_type) { //修改开户人类型，校验是否修改次数大于1
            await checkAccountName(account_id, people_name, owner_type, false)
            if (before_data.edit_times >= 2) return Promise.reject('开户人类型仅允许修改一次！')
            await trx(BANK_TABLE).increment('edit_times', 1).where({ id })
        }
        await trx(BANK_TABLE).update(update_data).where({ id })
        // await updateCertificatePlatform(id, trx)
        await insertLog(trx, getLogData(id, 3402, update_data, userInfo, before_data))
        return id
    })
    return { code: 0, data }
}
async function editSort(body = {}, userInfo) { //对银行卡优先级进行排序
    const { sort, account_id } = body || {}
    if (!account_id) return Promise.reject('未设置修改账户ID！')
    if (!sort || !sort.length) return Promise.reject('未设置排序顺序！')
    let before_sort = await knex(BANK_TABLE).select('id', 'sort')
        .where({ account_id })
        .whereIn('id', sort).orderBy(["sort", 'id'])
    let new_sort = sort.map((i, index) => { return { id: i, sort: index + 1 } })
    let data = await knexTransaction(async trx => {
        let log_data = await Promise.all(new_sort.map(async item => {
            await trx(BANK_TABLE).update("sort", item.sort).where({ id: item.id })
            return getLogData(item.id, 3403, item, userInfo, before_sort.find(i => i.id == item.id))
        }))
        await insertLog(trx, log_data)
        return sort
    })
    return { code: 0, data }
}
async function getBanckIdByAccount(account_ids = []) {
    let mapper = {}
    if (!account_ids || !account_ids.length) return mapper
    account_ids = Array.from(new Set(account_ids))
    let bank_data = account_ids.map(async account_id => {
        let data = (await knex(BANK_TABLE).select('*')
            .where({ status: 1, account_id })
            .orderBy('sort', 'asc').limit(1))[0]
        if (data) mapper[account_id] = data
        else mapper[account_id] = null
        return data
    })
    await Promise.all(bank_data)
    return mapper
}
async function getAccountBankList(account_ids = [], certificate_type = 0, status) {
    let bank_status = status || [1]
    if (!certificate_type) return Promise.reject('未设置收款平台！')
    let mapper = {}
    if (!account_ids || !account_ids.length) return mapper
    account_ids = Array.from(new Set(account_ids))

    let bank_data = account_ids.map(async account_id => {
        let data = await knex.select('bank.*')
            .from(`${BANK_TABLE} as bank`)
            .leftJoin(`${BANK_VERIFY_TABLE} as bvf`, 'bank.id', 'bvf.bank_card_id')
            .where(builder => {
                builder.where('bvf.certificate_type', certificate_type).orWhere('bank.verify_status', 1)
            })
            .whereIn("bank.status", bank_status)
            .where("bank.account_id", account_id)
            .orderByRaw(`IF(bvf.certificate_type = ${certificate_type},1,0) desc`)
            .orderBy('bank.sort', 'asc')
        // console.log(data.toString());
        if (data.length) mapper[account_id] = data
        else mapper[account_id] = null
        return data
    })
    await Promise.all(bank_data)
    return mapper
}
//查看收款记录
async function getIncomeRecord(query, userInfo = {}) {
    let { id: account_id, oem_id } = userInfo
    let retu = {
        code: 0,
        count: 0,
        data: [],
        page: Number(query.page) || 1,
        pagesize: Number(query.pagesize) || 20,
    }
    // if (!query.bank_card_id) return Promise.reject('未设置查询银行卡！')
    let groupBy = ['payf.owner_user_id', 'payf.collection_id', 'bank.id', 'pay.payment_date']
    if (query.type == 'detail') groupBy.push('payf.date')
    let knexSql = knex.sum('payf.total_payment as total_income')
        .select(groupBy)
        // .select(knex.raw(`IFNULL(payf.collection_id, NULL) as collection_id`))
        .select(knex.raw(`IFNULL(RIGHT(bank.bank_account, 4),'已线下付款') as bank_short_account`))
        .select('bank.bank')
        .from(`${PAYMENT_RELATION_TABLE} as payf`)
        .select(knex.raw(`GROUP_CONCAT(DISTINCT payf.data_id) as data_ids`))
        .leftJoin(`${WITHDRAW_DETAILS} as pay`, "pay.id", "payf.payment_id")
        .leftJoin(`${BANK_TABLE} as bank`, "bank.id", "payf.collection_id")
        .where({ "payf.oem_id": oem_id })
        .where({ 'payf.owner_user_id': account_id })
        .where({ 'pay.verify_status': 3 })
        .where(builder => {
            if (query.keyword) {
                let keyword = query.keyword.trim()
                builder.where('bank.bank_account', 'like', `%${keyword}%`).orWhere('bank.bank', 'like', `%${keyword}%`)
            }
        })
        .where(builder => {
            if (query.bank_card_id) builder.where('bank.id', query.bank_card_id)
        })
        .groupBy(...groupBy)
    // knexSql = handler.searchFilter(knexSql, query)
    let count = await knex.count({ count: 't.owner_user_id' }).from(knex.raw(`(${knexSql.toString()}) as t`))
    retu.count = count.length && count[0]['count'] || 0;
    let sort = query.type == 'detail' ? ["date", 'id'] : ["payment_date", 'id']
    retu.data = await knexSql
        .select(handler.selectName('payf', ACCOUNT_TABLE, "owner_user_id", "name", "owner_user_name"))
        .limit(retu.pagesize)
        .offset((retu.page - 1) * retu.pagesize)
        .orderBy(sort)
    retu.data = retu.data.map(i => {
        i.bank_short_name = BANK_MAPPER[i.bank] || '其他银行'
        i.data_ids = i.data_ids ? i.data_ids.split(',').map(i => Number(i)) : []
        return i
    })
    return retu
}
//获取付款详情
async function getPaymentInfo(body = {}, userInfo = {}) {
    let { owner_user_id, data_ids } = body
    if (!owner_user_id) owner_user_id = userInfo.id || null
    if (!owner_user_id) return Promise.reject('未设置查询人ID！')
    if (!data_ids) return Promise.reject('未设置查询数据ID！')
    let data = await knex.select('kwd.keyword', 'dsp.settle_num', 'dsp.settle_type', 'dsp.date', 'dsp.total_price')
        .from(`${DATA_SPLIT} as dsp`)
        .leftJoin(`${KOC_KEYWORD} as kwd`, 'kwd.id', 'dsp.keyword_id')
        .whereIn('dsp.data_id', data_ids)
        .where('dsp.account_id', owner_user_id)
        .orderBy('dsp.date')
    return { code: 0, data }
}
//和大熊后台做签约
// async function sign(body = {}, userInfo) {
//     // if (body.iv && body.content) body = decrypt(body, userInfo.token)
//     let insert_data = handler.checkSignData(body, userInfo)
//     let { id: account_id } = userInfo
//     const { pay_platform, id_card, pay_account } = insert_data
//     if (pay_platform == "WXPAY") insert_data.pay_account = (await getAppUserInfo(pay_account)).wechat_id //微信需要将微信code转为 openid
//     if (pay_platform == "BANK") insert_data.pay_account = (await getBankInfo(pay_account)).bank_account //银行卡验证银行卡号
//     if (pay_platform == "ALIPAY") checkPhone(pay_account)
//     // let before_data = (await knex(BANK_TABLE).select('id', 'status', 'account_id').where({ id_card }).limit(1))[0]
//     // if (before_data && before_data.account_id != account_id) return Promise.reject(`该身份信息已在其他账号进行绑定，无法再次绑定！`)
//     let before_idcard = (await knex(BANK_TABLE).select('id', 'status', 'id_card').where({ account_id }).limit(1))[0]
//     if (before_idcard && before_idcard.id_card != id_card) return Promise.reject(`同一账户不得录入不同身份信息银行卡！`)

//     let data = await knexTransaction(async trx => {
//         //去大熊做签约 先检查身份证号是否存在，存在说明已经做过签约，不存在说明更新签约
//         let back = await makeSignWithDX(insert_data)
//         let id = (await trx(BANK_TABLE).insert({ ...insert_data, account_id })
//             .onConflict(['pay_account', 'account_id']).merge())[0]
//         if (id) await insertLog(trx, getLogData(id, 3401, insert_data, userInfo))
//         return id
//     })
//     return { code: 0, data: { message: "注册成功！", bank_id: data || 0 } }
// }

// 爱才签约
async function sign(body = {}, userInfo) {
    // if (body.iv && body.content) body = decrypt(body, userInfo.token)
    let insert_data = handler.checkSignData(body, userInfo)
    let { id: account_id } = userInfo
    const { pay_platform, pay_account } = insert_data
    // if (pay_platform == "WXPAY") insert_data.pay_account = (await getAppUserInfo(pay_account)).wechat_id //微信需要将微信code转为 openid
    if (pay_platform == "BANK") insert_data.pay_account = (await getBankInfo(pay_account)).bank_account //银行卡验证银行卡号
    if (pay_platform == "ALIPAY") checkPhone(pay_account)
    let check_info = await check(insert_data, userInfo)
    if (check_info?.data?.show_auth) { //当触发验证时，需要检测手机号
        let { sms_id, captcha_code } = checkKeys(body, ['sms_id', 'captcha_code'])
        await checkSmsByType({ sms_id, sms_type: 8, code: captcha_code })
    }
    let data = await knexTransaction(async trx => {
        let params = {
            idNumber: insert_data.id_card,
            mobile: insert_data.mobile,
            realName: insert_data.people_name,
        }
        let back = await userMakeSign(params);
        if (back && back.uid) {
            let id = (await trx(BANK_TABLE).insert({ ...insert_data, account_id, uid: back.uid })
                .onConflict(['pay_account', 'account_id']).merge())[0]
            if (id) await insertLog(trx, getLogData(id, 3401, insert_data, userInfo))
            // await trx(BANK_TABLE).update({ uid: back.uid }).where({ id_card: insert_data.id_card, people_name: insert_data.people_name });
            return id
        } else {
            return Promise.reject('签约失败！')
        }
    })
    return { code: 0, data: { message: "注册成功！", bank_id: data || 0 } }
}
async function unbind(body = {}, userInfo = {}) {
    let { id } = body
    if (!id) return Promise.reject('参数异常！')
    let { id: account_id } = userInfo
    let before_data = (await knex(BANK_TABLE).select('id', 'status', 'account_id').where({ id, account_id }).limit(1))[0]
    if (!before_data || before_data?.status != 1) return Promise.reject('该银行卡不存在！')
    await knexTransaction(async trx => {
        await trx(BANK_TABLE).update({ status: 3 }).where({ id })
        await insertLog(trx, getLogData(id, 3402, { status: 3 }, userInfo, before_data))
    })
    return { code: 0, data: { id } }
}
/**
 * 判断当前人是否在银行卡设置白名单
 * @param {*} account_id 
 * @returns {Boolean}
 */
async function is_bank_white_list(account_id) {
    const redis_key = `${RK_BANK_IS_WHITELIST}:${account_id}`
    if (!account_id) return false
    let info = await useCustomCache(redis_key, async () => {
        let data = (await knex(BANK_WHITE_LIST).select('id').where({ account_id, status: 1 }).limit(1))[0]
        return data ? 'IN_WHITE_LIST' : 'NOT_WHITE_LIST'
    }, 600)
    return info == 'IN_WHITE_LIST'
}
/**
 * 预检测当前卡是否创建过不同身份信息
 * @param {*} body 
 * @param {*} userInfo 
 */
async function check(body, userInfo) {
    const { id: account_id } = userInfo
    let { id_card } = checkKeys(body, ['id_card'])
    let people_info = (await knex(BANK_TABLE).distinct('id_card').where({ account_id, status: 1 })).map(i => i.id_card)
    id_card = String(id_card).toUpperCase()
    let pattern = /\d{17}[\d|x]|\d{15}/;
    if (!pattern.test(id_card)) throw new Error(`身份证号码格式错误！`)
    let age = getPeopleAge(id_card)
    if (age && (age < 18 || age > 65)) return Promise.reject('年龄未满18岁或超过65岁，暂无法使用收款功能！')
    const new_set = new Set([...people_info, id_card]) //判断当前人一共有多少身份信息
    let back = { code: 0, data: { id_cards: people_info?.length, show_auth: false } }
    let is_white_list = await is_bank_white_list(account_id)
    if (is_white_list) {
        const message = SIGN_MESSAGE.replace(/\$p/g, `【${userInfo.name}(${account_id})】`)
        if (new_set.size <= 1) return back //当前账户为1张卡时，允许直接添加
        else if (new_set.size >= 3) return Promise.reject('同一账户不得录入2个以上身份信息银行卡！')
        else return { code: 0, data: { id_cards: people_info?.length, show_auth: true, message } }
    } else {
        if (new_set.size <= 1) return back //不在白名单内，允许添加
        else return Promise.reject('同一账户不得录入不同身份信息银行卡！')
    }
}
let handler = {
    selectName(idTable, nameTable, idFiled, nameFiled = "name", asFiled) {
        return knex.raw(`(SELECT p.${nameFiled} FROM ${nameTable} p where ${idTable}.${idFiled} = p.id  LIMIT 0, 1 ) as ${asFiled}`)
    },
    searchFilter(knexSql, query = {}) {
        if (!query.status) knexSql.whereIn('ban.status', [1, 2])
        if (query.status) knexSql.where('ban.status', query.status)
        if (query.verify_status) knexSql.where('ban.verify_status', query.verify_status)
        // else knexSql.whereIn('ban.verify_status', [1, 2])
        if (query.pay_platform) knexSql.where('ban.pay_platform', query.pay_platform)
        return knexSql
    },
    checkData(body = {}, userInfo = {}, type = "add") {
        let user_id = userInfo.id
        let checkKeys = ['account_id', 'bank_account', 'id_card', 'bank_name', 'people_name', 'owner_type']
        let dataKeys = ['bank', 'card_type', 'status', 'sort', 'verify_status', 'verify_suggest', 'telephone']
        let data = {}
        if (type == "add") {
            data = {
                create_user_id: user_id,
                update_user_id: user_id,
                oem_id: userInfo.oem_id,
                status: 1
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
            if (key == 'certificate_platform' && Object.hasOwnProperty.call(body, key)) data[key] = JSON.stringify(body[key])
        })
        if (data.id_card) {
            data.id_card = String(data.id_card).toUpperCase()
            let pattern = /\d{17}[\d|x]|\d{15}/;
            if (!pattern.test(data.id_card)) throw new Error(`身份证号码格式错误！`)
        }
        return data
    },
    checkSignData(body = {}, userInfo = {}, type = "add") {
        let user_id = userInfo.id
        let checkKeys = ['pay_platform', 'pay_account', 'mobile', 'id_card', 'id_card_face_url', 'id_card_back_url', 'people_name']
        let dataKeys = ['status', 'verify_status', 'verify_suggest']
        let data = {}
        if (type == "add") {
            data = {
                create_user_id: user_id,
                update_user_id: user_id,
                oem_id: userInfo.oem_id,
                status: 1,
                verify_status: 2
            }
            checkKeys.forEach(key => {
                if (!body[key]) throw new Error(`字段${key}参数不合法！请检查参数`)
                switch (key) {
                    case "pay_platform":
                        if (!['BANK', 'WXPAY', 'ALIPAY'].includes(body[key])) throw new Error(`字段${key}参数不合法！请检查参数`)
                        break;
                    default:
                        break;
                }
                data[key] = body[key]
            })
        } else if (type == "edit") {
            data = { update_user_id: user_id }
        }
        checkKeys.concat(dataKeys).forEach(key => {
            if (Object.hasOwnProperty.call(body, key)) data[key] = body[key]
        })
        if (data.id_card) {
            data.id_card = String(data.id_card).toUpperCase()
            let pattern = /\d{17}[\d|x]|\d{15}/;
            if (!pattern.test(data.id_card)) throw new Error(`身份证号码格式错误！`)
        }
        return data
    }
}

module.exports = {
    getBankInfo,
    getBanckIdByAccount,
    add,
    sign,
    list,
    def,
    edit,
    editSort,
    verifyInfo,
    getAccountBankList,
    checkBankName,
    getBankShowInfo,
    getIncomeRecord,
    getBankMixInfo,
    getPaymentInfo,
    formatUserInfo,
    unbind,
    check
}
