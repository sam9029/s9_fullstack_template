const { snsGetAccessToken, snsGetUserInfo } = require("./api")
const { wechat_appid, wechat_secret } = require("../../config/index")
var token = {
    access_token: null,
    token_after: 0 //token过期的时间，秒级时间戳
}
async function getAppUserInfo(wechat_code = '') {
    if (!wechat_code) return Promise.reject('请检查参数是否正确！')
    let token_info = await snsGetAccessToken({ appid: wechat_appid, secret: wechat_secret, code: wechat_code, grant_type: "authorization_code" })
    // let token_info = {
    //     access_token: '70_XwWCDSijAEHeyjEavSHN2rPRIwVQ-IXz7-qIffr-jgsaBx0cqdoBsqjqLm_0Yv56Glzm2WsoXfkdvgs67NIovXo_a1maTjSl9BWse74PfOo',
    //     expires_in: 7200,
    //     refresh_token: '70_5EU8pSatHxMHY53c4EwTz8bVZhCnxbn0gHX_F_NuYQWRumxB14HfhWfXyKhM8QBJjL1sSk0Lr2wqETVC8xO42OM6kg4NjBSM73gVH2jHlB4',
    //     openid: 'oyp436kLU04aG4jRaWvTsDO5Kqs0',
    //     scope: 'snsapi_userinfo',
    //     unionid: 'omcK55jDXBayJF9P82e8bbXNayk0'
    // }
    if (token_info?.errcode) return Promise.reject('微信认证失败！')
    // console.log(token_info);
    let user_info = await snsGetUserInfo({ openid: token_info.openid }, token_info.access_token)
    if (user_info?.errcode) return Promise.reject('用户信息获取失败，请稍后重试！')
    // console.log(user_info);
    return { wechat_id: token_info.openid, union_id: token_info.unionid, name: user_info.nickname, avatar: user_info.headimgurl }
}
// getAppUserInfo('091aep1w3YIGV035lx1w3YIUCx4aep1l').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);
// })
module.exports = {
    getAppUserInfo
}