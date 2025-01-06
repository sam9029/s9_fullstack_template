const knex = require("../../db/knexManager").knexProxy;
const { PLATFORM_TABLE, CATEGORY_TABLE, ACCOUNT_TABLE, ACTINFO_TABLE, } = require("../../config/setting")
const { unifiedLogin } = require("../login")
const { selectName } = require("../../utils/tools");

// 获取分享码邀请人信息
exports.shareInfo = async (query) => {
    let { share_code } = query
    if (!share_code) return Promise.reject('参数异常！')
    let share_info = (await knex(`${ACCOUNT_TABLE} as acc`)
        .select('acc.name as name', 'acc.uid as share_code')
        .select(selectName('acc', 'id', ACTINFO_TABLE, 'avatar', 'avatar', 'account_id'))
        .where({ 'acc.status': 1, 'acc.uid': share_code }).limit(1))[0]
    if (!share_info) return Promise.reject('该分享码不存在！')
    share_info.schema_url = `test://bindinvitecode?invitecode=${share_code}`
    return { code: 0, data: share_info }
};

// 分享页登录判断是否首次注册，首次注册直接绑定邀请人
// 非首次注册，要判断是否已绑定邀请码，已绑定提示已经绑定邀请人，无法再次绑定
// 未绑定弹窗提示用户是否绑定该邀请人
exports.login = async (req, res) => {
    let { data: userInfo } = await unifiedLogin(req, res)
    return { code: 0, data: userInfo }
};