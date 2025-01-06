const moment = require("moment");
const knex = require("../../../../db/knexManager").knexProxy;
const {
    AMOUNT_PROMOTION
} = require("../../../../config/setting");
const lodash = require('lodash');

async function totalIncome(query, userinfo) {
    // console.log(userinfo, query)
    let { business_type } = query;
    if (!business_type) return Promise.reject('请传入业务分类');
    let { keyword_income, applet_income } = (await knex(`${AMOUNT_PROMOTION} as data`)
        .select(knex.raw(`SUM(IF(data.type = 1 AND data.status = 1, data.amount_balance, 0)) as keyword_income`))
        .select(knex.raw(`SUM(IF(data.type = 2 AND data.status = 1, data.amount_balance, 0)) as applet_income`))
        .where({
            'account_id': userinfo.id,
            oem_id: userinfo.oem_id,
            business_type
         }))[0]

    keyword_income = lodash.divide(keyword_income, 100);
    applet_income = lodash.divide(applet_income, 100);
    // console.log(keyword_income, applet_income, lodash.add(keyword_income, applet_income))
    return {
        code: 0,
        data: {
            keyword_income,
            applet_income,
            total_income: lodash.add(keyword_income, applet_income)
        }
    }
}

module.exports = {
    totalIncome
  }