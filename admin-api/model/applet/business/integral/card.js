const { DUOLAI_CARD } = require("../../../../config/setting")
const { checkKeys, isArrayHas } = require("../../../../utils/check_type")
const knex = require("../../../../db/knexManager").knexProxy
const moment = require('moment');
const { renderPrice } = require("../../../../utils/tools");




async function list(query, $app_info) {
  const { system } = checkKeys(query, ["system"]);
  let { app_id } = $app_info;
  if (!app_id) throw "未知平台请求";

  const curdate = moment().format("YYYY-MM-DD");
  const knex_sql = knex(`${DUOLAI_CARD} as card`)
    .select("id", "price", "integral", "bonus_integral")
    .where({
      "system": system,
      verify_status: 3,
      sell_status: 1,
      app_id
    })
    .whereRaw(`('${curdate}' >= card.sell_start_date AND (card.sell_end_date is null OR '${curdate}' <= card.sell_end_date))`)


  const data = await knex_sql.orderBy("card.id", "desc").limit(6);
  data.sort((a, b) => a.price - b.price);
  data.forEach(v => {
    v.bonus_lable = "立即购买";
    const is_bouns = !!v.bonus_integral;
    v.is_bouns = is_bouns;
    if (is_bouns) {
      const bonus_price = renderPrice(v.bonus_integral, false, false);
      v.bonus_lable = `购买赠送${bonus_price}元看点`;
    }
  })

  return {
    code: 0,
    data: {
      list: data
    }
  }
}


module.exports = {
  list
}