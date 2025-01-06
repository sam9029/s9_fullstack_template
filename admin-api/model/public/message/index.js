const { MESSAGE_TABLE, MESSAGE_RELATION } = require("../../../config/setting");
const knex = require("../../../db/knexManager").knexProxy;
const {
  MESSAGE_TYPE_MAPPER,
  MESSAGE_SUB_TYPE_MAPPER,
} = require("../../../utils/mapper");
const { getDaysBetweenDate, knexTransaction } = require("../../../utils/tools");
const { insertLog, getLogData } = require("../../public/operationLog");
const moment = require("moment");

/**
 * @property { number } message_type 标题类型、见枚举
 * @property { string } message_title 消息标题，不传默认为类型名称
 * @property { object } message 消息model
 * @property { array } show_message 展示消息，例[{"label": "aaa", "value": "12345"}]
 * @property { array } receiver_ids 消息接受人id
 * @property { object } parma 消息跳转需要参数，例{"content_id":123}
 */
async function send(query, userInfo, trx = knex) {
  let {
    message_type, 
    message_title,
    message,
    show_message,
    receiver_ids,
    parma,
  } = query;
  let subType = MESSAGE_SUB_TYPE_MAPPER[message_type];
  if (!subType) return Promise.reject("消息二级类型错误");

  if (!receiver_ids || !receiver_ids.length)
    return Promise.reject("消息接收人不能为空");

  let obj = {
    type: subType.message_type,
    message_type,
    message_title: message_title || subType?.title,
    sender_user_id: userInfo.id,
    send_time: moment().format("YYYY-MM-DD HH:mm:ss"),
    send_status: 2,
    message: JSON.stringify(message || {}),
    show_message: JSON.stringify(show_message || []),
    create_user_id: userInfo.id,
    update_user_id: userInfo.id,
    oem_id: userInfo.oem_id,
  };
  let message_id = (await trx.insert(obj).from(MESSAGE_TABLE))[0];
  await insertLog(trx, getLogData(message_id, 6451, obj, userInfo, {}));

  let insertList = [];
  receiver_ids.forEach((t) => {
    let relationObj = {
      message_id,
      receiver_user_id: t,
      parma: JSON.stringify(parma || {}),
      create_date: moment().format("YYYY-MM-DD"),
      create_user_id: userInfo.id,
      update_user_id: userInfo.id,
      oem_id: userInfo.oem_id,
    };
    let insert = trx.insert(relationObj).from(MESSAGE_RELATION);
    insertList.push(insert);
  });
  await Promise.all(insertList);
}

module.exports = {
  send,
};
