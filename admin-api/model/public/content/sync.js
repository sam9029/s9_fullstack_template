const { bookDownload: qqReader } = require("../qqreader/index");
const { knexTransaction } = require("../../../utils/tools");
const {
  CONTENT_TABLE,
  ADVERTISER_TABLE,
  CONTENT_RELATION,
} = require("../../../config/setting");
const { RelationType } = require("../../../enum/type");

// 对应项目同步剧集
function get_data_list(body, user) {
  switch (Number(body.advertiser_type)) {
    case 1002:
      return qqReader(body, user);
    default:
      throw "暂不支持该项目同步剧集！";
  }
}

async function add_book_id_prefix(book_list, advertiser_type) {
  const prefix = await knex;
  if (!prefix) return;

  book_list.forEach(v => {
    // v.book_id = add_keyword_bookid_prefix(v.book_id, prefix); // #CONT MOD  -
    v.prefix = prefix; // #CONT MOD  +
  })
}

async function sync_book(body, user) {
  console.log("获取书籍信息....");
  let data = await get_data_list(body, user);

  console.log("更新剧集数据库...");
  await insertData(data, body, user);
}

async function insertData(data, body, user) {
  return knexTransaction(async (trx) => {
    const advertiser = (
      await trx(ADVERTISER_TABLE)
        .select("*")
        .where("id", body.advertiser_type)
        .limit(1)
    )[0];

    for (let i = 0; i < data.length; i++) {
      let item = data[i];
      item.prefix = advertiser.prefix;

      let content_id = (
        await trx(CONTENT_TABLE).insert(item).onConflict(["book_id", "prefix"]).merge() // #CONT MOD  + "[prefix]"
      )[0];

      if (!content_id) {
        content_id = (
          await trx(CONTENT_TABLE).select("id").where({ book_id: item.book_id, prefix: item.prefix }) // #CONT MOD  + prefix: item.prefix
        )[0].id;
      }
  
      let relation = {
        content_id,
        advertiser_type: advertiser.id,
        relat_type: RelationType.Alias,
        platform_id: advertiser.platform_id,
        is_test: advertiser.is_test,
        create_user_id: user.id,
        update_user_id: user.id,
        oem_id: user.oem_id,
      };
      await trx(CONTENT_RELATION)
        .insert(relation)
        .onConflict(["content_id", "advertiser_type", "relat_type"])
        .merge();
    }
  });
}

module.exports = {
  sync_book,
};
