const knex = require('../../../db/knexManager').knexProxy;
const { ACCOUNT_TABLE, ADVERTISER_TABLE, PLATFORM_TABLE, CONTENT_RELATION, CONTENT_TABLE, DRAMA_PLAN, ACTINFO_TABLE, PLAN_MATERIAL_LOG } = require('../../../config/setting');
const { selectName, getUrlPath } = require("../../../utils/tools");
const { makeShareToken } = require("../../../db/token");
// const { getPublishInfo } = require("../../public/drama/index");
const { douyinShare, makeH5ShareSign } = require("../../oauth/douyin/index");



async function sharePlanToken(query, userInfo) {
	const token = await makeShareToken(userInfo.id);
	return {
		code: 0,
		token: token
	}
}


async function sharePlanDef(query, userInfo) {
	const { plan_id } = query;
	const { id: account_id } = userInfo || {}
	// console.log(userInfo);
	if (!plan_id || !account_id) throw "无效的推广计划！";
	// app_id, platform_id, publish_url, book_name, referral_id, status, advertiser_type, account_id, extra_params
	let knexSql = knex.select("plan.id", 'plan.name')
		// .select('cont.book_name', 'cont.cover_url', 'dmr.publish_url', 'dmr.platform_id', 'dmr.app_id')
		.select('cont.book_name', 'cont.cover_url')
		.select(selectName("plan", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
		.select(selectName("plan", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
		.from(`${DRAMA_PLAN} as plan`)
		// .leftJoin(`${CONTENT_RELATION} as dmr`, 'plan.relation_id', 'dmr.id')
		.leftJoin(`${CONTENT_TABLE} as cont`, 'plan.drama_id', 'cont.id')
		.where({ "plan.id": plan_id, 'plan.status': 1, 'plan.account_id': account_id, 'plan.platform_id': 1 })
		.limit(1);

	let plan = (await knexSql)[0];
	if (!plan) throw "无效的推广计划！";
	// plan = { ...plan, ...(getPublishInfo(plan)) };

	let userSql = knex.select("a.name", "a.id").select("info.avatar").from(`${ACCOUNT_TABLE} as a`)
		.leftJoin(`${ACTINFO_TABLE} as info`, 'a.id', 'info.account_id')
		.where({ id: account_id, status: 1 })
		.limit(1);
	let user = (await userSql)[0];
	if (!user) throw "计划关联账号已关闭！";


	return { code: 0, data: { plan, user } }
}

async function addMaterialLog(plan_info = {}, materials = [], userInfo = {}) {
	return Promise.all(materials.map(async video_path => {
		let oss_key = getUrlPath(video_path, false)
		if (!oss_key) return Promise.reject('文件信息异常！')
		let { account_id, drama_id, id: plan_id, advertiser_type, platform_id } = plan_info
		let { id: user_id, oem_id, channel_id } = userInfo
		let insert_data = {
			account_id, oss_key, drama_id, plan_id, advertiser_type, platform_id, channel_id, oem_id, create_user_id: user_id, update_user_id: user_id
		}
		return await knex(PLAN_MATERIAL_LOG).insert(insert_data).onConflict(['plan_id', 'oss_key']).merge()
	}))
}

async function sharePlanPublish(body = {}, userInfo) {
	let { video_path, plan_id, image_list_path = [], share_to_publish = 1 } = body
	if (!plan_id) return Promise.reject('推广计划不存在或已失效！')
	let { id: account_id, oem_id } = userInfo
	let plan_info = (await knex.select("plan.id", 'plan.name', 'plan.advertiser_type', 'plan.create_time', 'plan.referral_id',
		'plan.drama_id', 'plan.status', 'plan.account_id', 'plan.extra_params')
		.select('cont.book_name', 'cont.cover_url', 'dmr.publish_url', 'dmr.platform_id', 'dmr.app_id')
		.select(selectName("plan", "advertiser_type", ADVERTISER_TABLE, "name", "advertiser_type_name"))
		.select(selectName("plan", "platform_id", PLATFORM_TABLE, "name", "platform_name"))
		.from(`${DRAMA_PLAN} as plan`)
		.leftJoin(`${CONTENT_RELATION} as dmr`, 'plan.relation_id', 'dmr.id')
		.leftJoin(`${CONTENT_TABLE} as cont`, 'dmr.content_id', 'cont.id')
		.where({ "plan.id": plan_id, 'plan.status': 1, 'plan.account_id': account_id, 'plan.platform_id': 1 })
		.limit(1))[0]
	if (!plan_info) return Promise.reject('推广计划不存在或已失效！')
	let { micro_app_info } = getPublishInfo(plan_info)

	if (!video_path && !image_list_path?.length) return Promise.reject('参数异常！')
	if (video_path) await addMaterialLog(plan_info, [video_path], userInfo)
	if (image_list_path?.length) await addMaterialLog(plan_info, image_list_path, userInfo)
	let data = await makeH5ShareSign({ ...plan_info, account_id, oem_id })
	let h5_schema_url = `snssdk1128://openplatform/share`
	const url = new URL(h5_schema_url);
	var query = url.searchParams;
	query.append("client_key", data.client_key);
	query.append("state", data.share_id);
	query.append("nonce_str", data.nonce_str);
	query.append("timestamp", data.timestamp);
	query.append("signature", data.signature);
	query.append("share_type", "h5");
	if (video_path) query.append("video_path", video_path);
	if (image_list_path?.length) query.append("image_list_path", JSON.stringify(image_list_path));
	query.append("share_to_publish", share_to_publish);
	// const hashTags = ["hashtag1", "hashtag2", "hashtag3", "天气不错"];
	// query.append("hashtag_list", JSON.stringify(hashTags));
	query.append("micro_app_info", JSON.stringify(micro_app_info));
	return { code: 0, data: url.href }
}

module.exports = {
	sharePlanToken,
	sharePlanDef,
	sharePlanPublish
}