// const JIEZIYUN_KEY = {
//     app_id: "AVdX9O0W",
//     app_key: "c4f3a8121f653fc2141d75862033274c51504fa7"
// }
const JIEZIYUN_KEY = {
    app_id: "L8jUlzf0",
    app_key: "3bdad5d8244c0815f3035d70434357ee1dbd7005"
}
const request = require("../request")
const CACHE_KEY = 'xgfx:external:jieziyun'
const DOMAIN = process.env.NODE_ENV == "production" ? "https://console.icemdata.com" : "https://test.icemdata.com"
const { getCustomCache, setCustomCache, delCustomCache } = require("../../db/redis")
const utils = require("../../model/public/externalMedia/utils")
const CryptoJs = require("crypto-js")
async function get_token() {
    const cache = await getCustomCache(CACHE_KEY);
    if (cache) return cache;
    return fetch_token();
}
function makeSign(data = {}) {
    delete data.sign
    data.app_id = JIEZIYUN_KEY.app_id
    let str = utils.sort_and_join({ app_id: JIEZIYUN_KEY.app_id })
    data.sign = Buffer.from(CryptoJs.MD5(str += `&app_key=${JIEZIYUN_KEY.app_key}`).toString()).toString('base64').toLocaleUpperCase()
    // console.log(data);
    return data
}
async function fetch_token() {
    let token = "";
    return request({
        url: DOMAIN + '/api/outer/v1/token',
        method: 'post',
        data: JIEZIYUN_KEY
    }).then(data => {
        // console.log(data);
        if (data.errcode != 0) throw data.errmsg;
        token = data.access_token;
        return setCustomCache(token, CACHE_KEY, 3600)
    }).then(() => {
        return token;
    })
}
async function query_result(params = {}) {
    let token = await fetch_token()
    params = makeSign(params)
    return request({
        url: DOMAIN + '/api/video-cut/open/create/video_status',
        method: 'get',
        params,
        headers: { token },

    }).then(data => {
        if (data.result != 0) throw data.errmsg || data.message;
        return data.data
    })
}
async function make_video(data = {}) {
    let token = await fetch_token()
    return request({
        url: DOMAIN + '/api/video-cut/open/create/video',
        method: 'post',
        data: makeSign(data),
        headers: { token },
    }).then(data => {
        console.log(data);
        if (data.result != 0) throw data.errmsg || data.message;
        return data.data
    })
}
async function query_material(params = { cur_cate_flg: true }) {
    let token = await fetch_token()
    return request({
        url: DOMAIN + '/api/cms/v1/material/open/get_materials?page_no=1&page_size=1000',
        method: 'get',
        params,
        headers: { token },

    }).then(data => {
        if (data.result != 0) throw data.errmsg || data.message;
        console.log(data.data);
        return data.data
    })
}

async function query_classfiy() {
    const token = await get_token();
    return request({
        url: DOMAIN + '/api/cms/v1/material/open/get_cate',
        method: 'get',
        headers: { token },
    }).then(data => {
        if (data.result != 0) throw data.errmsg || data.message;
        return data.data
    })
}
let text = "海南长臂猿的叫，高亢洪亮，响彻山谷。海南热带雨林国家公园是这种濒危灵长类动物的全球唯一栖息地。经过近年来的科学保护和生态恢复，海南长臂猿已由最少时的几只，恢复到5群35只，创造了世界珍稀动物保护的奇迹。国家公>园堪称最美国土，具有典型独特的自然生态系统、世界瞩目的野生动植物种。在海南热带雨林国家公园，这里生长着846种特有植物、145种国家重点保护野生动物，生物多样性指数与巴西亚马雨林相当。2018年4月，习近平总书记在庆祝海>南建省办经济特区30周年大会上强调，要积极开展国家公园体制试点，建设热带雨林等国家公园。2019年1月，总书记又主持召开中央全面深化改革委员会第六次会议，审议通过《海南热带雨林国家公园体制试点方案》。被称为海南“生态绿心”的这片最美国土迈出保护和建设的历史性一步。我国的国家公园在自然保护地体系中保护等级最高、生态价值最大、管控措施最严。"
function test_make_video() {
    return make_video({
        parameter: {
            name: "推小果测试视频",
            video_category: 931,
            dub: { //配音
                volume: 100,
                file_url: "https://koc-img.domain.cn/moyin/93704abf11b073f699cae5f86247095d.mp3"
            },
            // audio: [ //背景音乐
            //     {
            //         id: 9346, //素材id
            //         volume: 10,
            //     }
            // ],
            conf: {
                aspect_ratio: "9:16", //画面比例 '16:9' | '9:16' | 1:1 | '4:3' | '3:4'
                definition: 11, //清晰度 0: 480p | 11 720p | 12 1080p
                subtitle_visible: true, //是否开启字幕
                subtitle_vertical: 0.2 //字幕位置 0-1 0.5垂直居中
            } //设置
        },
    }).then(res => {
        console.log(res);
    })
}
// test_make_video()
//8353ece8-b174-4783-bb98-66a824c612da
// query_result({ task_id: "c5fbd3f7-2c8a-42ba-9c87-4d4a83af7e0e" }).then(res => {
//     console.log(res);
// })
module.exports = {
    query_classfiy
}