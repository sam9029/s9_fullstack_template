const request = require("./sign").warp_request;
const { encrypt_body, decrypt_response } = require("./sign");


/**
 * @template T
 * @typedef { Promise<import("./sign").ResponseBody<T>> } ResponseBodyPromise
 */

/**
 * @template T
 * @typedef { Object } ListRows
 * @property { number } total
 * @property { Array<T> } rows
 */



/**
 * 任务认领-批量
 * @returns { ResponseBodyPromise<string>  }
 */
function recruit_batch(data) {
  return request("/interface/recruit/recruitBatch", data);
}


/**
 * @typedef { Object } RecruitOne
 * @property { string } [signUrl]
 * @property { string } [signDownloadUrl]
 * @property { string } hasSign
 * @property { string } idCardPic
 * @property { string } [idnoTimeStart]
 * @property { string } [idnoTimeEnd]
 * 
 * @returns { ResponseBodyPromise<RecruitOne>  }
 * 任务认领-单个
 */
function recruit_one(data) {
  return request("/interface/recruit/recruitOne", data);
}

/**
 * 任务认领结果查询
 * @returns { ResponseBodyPromise<null>  }
 */
function recruit_query_batch(data) {
  return request("/interface/recruit/queryBatch", data);
}


/**
 * 批量结算
 * @returns { ResponseBodyPromise<ListRows<Object>>  }
 */
function settle_batch(data) {
  return request("/interface/settle/settleBatch", data);
}



/**
 * @typedef { Object } SignFind
 * @property { string } businessId
 * @property { string } idNo
 * @property { string } sign
 * @property { string } [signUrl]
 * @property { string } idCardPic
 * @property { string } [idnoTimeStart]
 * @property { string } [idnoTimeEnd]
 * 
 * @returns { ResponseBodyPromise<SignFind>  }
 * 零工签约查询
 */
function sign_find(data) {
  return request("/interface/recruit/signFind", data);
}


/**
 * 零工解除
 * @returns { ResponseBodyPromise<ListRows<null>>  }
 */
function sign_stop_one(data) {
  return request("/interface/recruit/stopOne", data);
}




/**
 * 
 * @returns { ResponseBodyPromise<Array<Object>>  }
 * 退票退款查询
 */
function retreat_ticket(data) {
  return request("/interface/settle/retreatTicket", data);
}



/**
 * 
 * @returns { ResponseBodyPromise<Array<Object>>  }
 * 查询企业账户信息
 */
function acct_query_all(data) {
  return request("/interface/acct/queryAll", data);
}

module.exports = {
  recruit_batch,
  recruit_one,
  recruit_query_batch,
  settle_batch,
  sign_find,
  sign_stop_one,
  retreat_ticket,
  acct_query_all,
}