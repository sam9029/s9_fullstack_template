const { knexTransaction, sleep, getUuid, highConcat } = require('../../../utils/tools')
const knex = require('../../../db/knexManager').knexProxy
const utils = require("../externalMedia/utils")
const { checkKeys } = require('../../../utils/check_type')
const { CONTENT_TABLE, CONTENT_RELATION, ADVERTISER_TABLE } = require('../../../config/setting');
const request = require("../../../utils/request");
const { secret } = require("./advertiser_fn");
const { RelationType } = require('../../../enum/type');



async function sync_drama_from_server(data) {
  const host = utils.get_kocmount_host();
  return request({
    url: host + '/api/public/advertiser_api/sync_drama',
    method: 'post',
    data: data,
    timeout: 300 * 1000
  }).then(res => {
    if (res.code == 0) {
      return res.data;
    } else {
      throw res.message || "同步内容失败！";
    }
  })
}

async function dispatch_advertiser_dramas(body, userinfo) {
  const app_id = (
    await knex(ADVERTISER_TABLE).select("app_id").where("id", body.advertiser_type)
  )[0]?.app_id;
  if (!app_id) throw "项目配置错误，无有效的app_id";

  const params = {
    advertiser_type: body.advertiser_type,
    app_id, // #CONT MOD  + app_id | sync from boyao
    vids: body.vids,
    token: secret,
    user: {
      id: userinfo.id,
      oem_id: userinfo.oem_id
    },
  };

  return sync_drama_from_server(params);
}


async function insert_or_update_data(data_list, advertiser, user) {
  return knexTransaction(async trx => {
    for (let i = 0; i < data_list.length; i++) {
      trans_main_to_content(data_list[i], advertiser, user)
      const { content, relation } = data_list[i];

      checkKeys(content, ["book_id", "prefix"]); // #CONT MOD  + "prefix"
      let content_id = (await trx(CONTENT_TABLE).insert(content).onConflict(["book_id", "prefix"]).merge())[0]; // #CONT MOD  + "prefix"
      if (!content_id) {
        content_id = (await trx(CONTENT_TABLE).select("id").where({ book_id: content.book_id, prefix: content.prefix }))[0].id; // #CONT MOD  + prefix: content.prefix
      }
      relation.content_id = content_id;

      checkKeys(relation, ["platform_id", "app_id", "publish_url"]);
      await trx(CONTENT_RELATION).insert(relation).onConflict(["content_id", "advertiser_type", "relat_type"]).merge()
    }
  })
}


function trans_main_to_content(item, advertiser, user) {
  const { content, relation } = item;

  //
  delete content.chapter_id;
  delete content.episode_num;

  const cont_defval = {
    prefix: advertiser.prefix,
    verify_status: 3,
    create_user_id: user.id,
    update_user_id: user.id,
    oem_id: user.oem_id || 0
  };
  Object.assign(content, cont_defval);

  //
  const relat_defval = {
    advertiser_type: advertiser.id,
    is_test: advertiser.is_test,
    relat_type: RelationType.Mount,
  }
  Object.assign(relation, relat_defval);
}

async function sync_drama_list(body, user) {
  const advertiser = (await knex(ADVERTISER_TABLE).select("id", "prefix", "app_id").where("id", body.advertiser_type))[0];
  if (!advertiser) throw "error advertiser_type"

  console.log("获取剧集信息....")
  let data_list = await dispatch_advertiser_dramas(body, user);
  // console.log(data_list);
  // vid filter 在各自内部处理

  console.log("更新剧集数据库...")
  await insert_or_update_data(data_list, advertiser, user);
}

module.exports = {
  sync_drama_list,
  dispatch_advertiser_dramas,
}
// get_drama_dianzhong({ advertiser_type: 3 }, { id: 10000001, oem_id: 1 })
// sync_drama_list(6, { id: 10000001, oem_id: 1 })
// .then((res) => {
//   console.log(res, 'success')
// }).catch((err) => {
//   console.log(err, 'error')
// })