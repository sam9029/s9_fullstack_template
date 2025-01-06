const knex = require("../../db/knexManager").knexProxy;
const { VERSION } = require("../../config/setting");

// 判断当前版本和线上版本
exports.compareVersion = async (req) => {
  let type = req.$platform || "android";
  let version_code = req.$version || 0;
  let onlineVersionCode = (
    await knex
      .select("version_code")
      .from(VERSION)
      .where({ type })
      .orderBy("id", "desc")
  )[0].version_code;
  return Number(version_code) > onlineVersionCode;
};
