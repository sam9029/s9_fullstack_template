const tools = require("../config/tools");
const mySQL = require("../db/knexManager").knexProxy;

exports.generateSerialNumber = async (id, tableName, businessName, projectName) => {
  let realId = `${businessName}${projectName ? '-'+projectName:''}-${tools.formatDate(new Date())}`;
  let idLength = id.toString().length;
  let zero = "0000";
  let num = zero.substr(0, 4 - idLength);
  let realData = realId + num + id;
  await mySQL(tableName).where('id', id).update({
    real_id: realData
  })
};

/**
 * 增加编号
 * @param {*} id 
 * @param {*} businessName 名称
 * @param {*} projectName 产品名称
 */
exports.GenerateSerialRealId = (id, businessName, projectName) => {
  let realId = `${businessName}${projectName ? '-'+projectName:''}-${tools.formatDate(new Date())}`;
  let idLength = id.toString().length;
  let zero = "0000";
  let num = zero.substr(0, 4 - idLength);
  let realData = realId + num + id;
  return realData
};
