const {
  ACCOUNT_REALNAME,
  ACCOUNT_TABLE,
  DUOLAI_VIDEO_COLLECTION,
  DUOLAI_VIDEO,
  DUOLAI_MEDIA_COLLECTION_PUSH,
} = require("../../../config/setting");
const { knexTransaction, getUrlPath } = require("../../../utils/tools");
const { getCoverUrl, getOriginalUrl } = require("../../public/upload");
const { getLogData, insertLog } = require("../../public/operationLog");
const knex = require("../../../db/knexManager").knexProxy;
const moment = require("moment");
const { checkKeys, isEmpty } = require("../../../utils/check_type");
const { addContent, delContent } = require("../kuaishou/api");
const { getAccessToken } = require("../kuaishou/index");
const { push_video_tomedia, push_collection_tomedia } = require("./video");
const lodash = require("lodash");

async function push(query, trx = knex, userInfo) {
  let { id, video_ids } = checkKeys(query, [
    { key: "id", type: Number, required: true },
    "video_ids?",
  ]);

  let sql = trx
    .select("video_collection.*")
    .max("video.sequence_no as sequence_no")
    .max("video.id as video_id")
    .select(knex.raw(`count(if(video.is_free = 'F', 1, null)) as free_count`))
    .from(`${DUOLAI_VIDEO_COLLECTION} as video_collection`)
    .leftJoin(
      `${DUOLAI_VIDEO} as video`,
      "video_collection.id",
      "video.collection_id"
    )
    .where("video_collection.id", id);

  let data = (await sql)[0];
  if (!data) return Promise.reject("该合集不存在！");
  let appIds = JSON.parse(data.app_id_target);
  for (let i = 0; i < appIds.length; i++) {
    let t = appIds[i];
    switch (true) {
      case t.includes("ks"):
        await ksPush(t, data, trx, video_ids, userInfo);
        break;
    }
  }
}

async function ksPush(app_id, data, trx, video_ids, userInfo) {
  let res = {};
  let update_user_id = userInfo?.id || data.update_user_id;
  let insert = {};

  if (data.type == "SINGEL") {
    insert = await push_video_tomedia(
      data.video_id,
      app_id,
      update_user_id,
      trx
    );
    delete insert.video_id;
    delete insert.collection_push_id;
  } else {
    let is_online = data.status == 1 && data.verify_status == 3;
    let thirdId = `c-${data.id}`;
    let parma = {};
    let { access_token, app_secret } = await getAccessToken(app_id, trx);

    if (!is_online) {
      parma = {
        app_id,
        thirdId,
      };
      res = await delContent(parma, access_token);
    } else {
      let path = `play/index?cid=${data.id}`;
      let updateDoneOrNot =
        data.completion_status == "COMPLETED" ? true : false;

      let cover = getOriginalUrl(
        getUrlPath(data.cover_url),
        "duolai-img",
        "https://duolai-img.domain.cn"
      );
      parma = {
        app_id,
        cardContent: 10, // 长篇
        cardFormat: 2, // 资源合集
        thirdId,
        collectionId: null,
        title: data.name,
        path,
        cover,
        updateDoneOrNot,
        chargeOrNot: data.free_count > 0,
        episodeNumber: data.episode_num,
        extraInfo: {
          updatedNumber: data.sequence_no,
        },
        videoInfo: {
          videoDuration: 1,
          introduction: data.describe,
          //   typeList: [],
          coverInfo: {},
        },
      };
      res = await addContent(parma, access_token);
    }
    let code = res?.result == 1;
    insert = {
      collection_id: data.id,
      app_id,
      create_user_id: update_user_id,
      update_user_id,
      push_info: JSON.stringify(parma),
      push_message: code ? "" : res?.error_msg,
      push_status: is_online ? (code ? 1 : 2) : 3,
      third_id: thirdId,
    };
  }

  await trx
    .insert(insert)
    .from(DUOLAI_MEDIA_COLLECTION_PUSH)
    .onConflict(["app_id", "collection_id"])
    .merge();

  if (data.type != "SINGEL") {
    await push_collection_tomedia(
      data.id,
      update_user_id,
      video_ids,
      trx
    ).catch((e) => {});
  }

}

// push({ id: 75 });
// push({ id: 343 });
async function push_by_video_ids(video_ids, userInfo) {
  if (!video_ids) return;
  let video_data = await knex(DUOLAI_VIDEO)
    .select("id as video_id", "collection_id")
    .whereIn("id", video_ids);
  video_data = lodash.groupBy(video_data, "collection_id");
  for (const collection_id in video_data) {
    await knexTransaction(async (trx) => {
      const video_info = video_data[collection_id];
      await push({ id: collection_id, video_ids: video_info.map((i) => i.video_id) }, trx, userInfo)
        .catch((err) => {
          console.log("审核推送出现异常！", err);
        });
    });
  }
}
// push_by_video_ids([5778],{id:10822732})
module.exports = {
  push,
  push_by_video_ids,
};
