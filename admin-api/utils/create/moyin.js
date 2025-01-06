const request = require("../request")
const MOYIN_KEY = {
    domain: "https://open.mobvoi.com/api/tts/v1",
    appkey: "F8EB9D932DB9BBF20747F408185E76E5",
    secret: 'D74A51370DD5B273003E25E31CDE8FBA'
}
const OSS = require('ali-oss');
const CryptoJs = require("crypto-js")
const { timestampSec, sleep } = require("../tools");
const fs = require("fs")
function getMoYinSign(data = {}) {
    let timestamp = timestampSec()
    let str = `${MOYIN_KEY.appkey}+${MOYIN_KEY.secret}+${timestamp}`
    let signature = CryptoJs.MD5(str).toString()
    return { appkey: MOYIN_KEY.appkey, timestamp, signature, ...data }
}

const { bucket } = require('../../config/index')
const store = new OSS(bucket);
const { RK_MOYIN_AUDIO } = require('../../config/redis_key');
const { getCustomCache, setCustomCache } = require("../../db/redis");
var loading_times = 0
async function moyinModel(data) {
    if (loading_times > 4) {
        await sleep(300)
        return await moyinModel(data)
    }
    loading_times++
    return await getMoYinAudio(data).finally(() => {
        loading_times--
    })

}
async function getMoYinMp3(text = '', speaker = 'cissy_meet', speed = 1.2, cache_day = 1) {
    if (!text) return Promise.reject('请输入转换文案！')
    if (String(text)?.length > 3000) return Promise.reject('不得超过3000字！')
    let md5 = CryptoJs.MD5(text).toString()
    let cache_key = `${RK_MOYIN_AUDIO}${md5}:${speaker}:${speed}`
    let cache = await getCustomCache(cache_key)
    if (cache) return cache
    let send_data = { audio_type: 'mp3', ignore_limit: true, merge_symbol: true, text, speaker, speed }
    let stream = await moyinModel(send_data)
    let { name } = await store.putStream(`moyin/${md5}-${speaker}-${speed}.mp3`, stream)
    let url = bucket.publicHost + name
    // console.log(url);
    await setCustomCache(url, cache_key, 3600 * 24 * cache_day) //默认缓存一天
    return url
}

async function getMoYinAudio(data) {
    data = getMoYinSign(data)
    let stream = await request({
        url: MOYIN_KEY.domain,
        method: 'post',
        responseType: "stream",
        headers: {
            "content-type": "application/json",
        },
        data
    })
    if (!stream) return Promise.reject('音频文件获取失败！')
    return stream
    // stream.pipe(fs.createWriteStream('ada_lovelace.mp3'))
}
module.exports = {
    getMoYinMp3,
}
// getMoYinMp3("海南长臂猿的叫，高亢洪亮，响彻山谷。海南热带雨林国家公园是这种濒危灵长类动物的全球唯一栖息地。经过近年来的科学保护和生态恢复，海南长臂猿已由最少时的几只，恢复到5群35只，创造了世界珍稀动物保护的奇迹。国家公>园堪称最美国土，具有典型独特的自然生态系统、世界瞩目的野生动植物种。在海南热带雨林国家公园，这里生长着846种特有植物、145种国家重点保护野生动物，生物多样性指数与巴西亚马雨林相当。2018年4月，习近平总书记在庆祝海>南建省办经济特区30周年大会上强调，要积极开展国家公园体制试点，建设热带雨林等国家公园。2019年1月，总书记又主持召开中央全面深化改革委员会第六次会议，审议通过《海南热带雨林国家公园体制试点方案》。被称为海南“生态绿心”的这片最美国土迈出保护和建设的历史性一步。我国的国家公园在自然保护地体系中保护等级最高、生态价值最大、管控措施最严。")