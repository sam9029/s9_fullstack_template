const knex = require("../../db/knexManager").knexProxy;
// var mysql = require('../../db/mysql');
const OSS = require("ali-oss");
const setting = require("../../config");
const bucketHost = setting.bucket.publicHost;
const client = new OSS(setting.bucket);
let Duplex = require("stream").Duplex;
const moment = require("moment");
const { TEMPLATE_TABLE, ACCOUNT_TABLE } = require("../../config/setting");
const { getUrlPath, selectName } = require("../../utils/tools");

// 名称写全，
exports.download = async (query) => {
  // console.log("query", query)
  // console.log(req.body);
  // 这里应该使用get 方法，不应该使用post
  let { id } = query || {}
  if (!id) return Promise.reject('请输入需要下载的模板！')
  let search = { status: 1, id };
  let data = (await knex.select('name', 'oss_key').where(search).from(TEMPLATE_TABLE))[0];
  if (!data) return Promise.reject('模板不存在或已删除！')
  let { name: file_name, oss_key } = data;
  // file_name = file_name + '.' + oss_key.split('.')[1]
  let url = client.signatureUrl(oss_key, {
    response: {
      "content-disposition": `attachment; filename=${file_name};filename*=UTF-8''${encodeURI(
        file_name
      )}`,
    },
  });
  let back = url.replace('https', 'http')
    .replace("http://koc-img.oss-cn-beijing.aliyuncs.com/", bucketHost)
    .replace("http://koc-img.oss-cn-beijing-internal.aliyuncs.com/", bucketHost);
  return {
    code: 0,
    data: back,
  };
};

exports.list = async (query) => {
  let retu = {
    code: 0,
    data: [],
    count: 0,
    page: Number(query.page) || 1,
    pagesize: Number(query.pagesize) || 20,
  };
  let status = (query.status && Number(query.status)) || 1
  // 搜索条件
  let search = { status };
  let sqlKnex = knex.select("tlat.*").where(search)
    .select(selectName('tlat', 'create_user_id', ACCOUNT_TABLE, 'name', 'create_user_name'))
    .from(`${TEMPLATE_TABLE} as tlat`);

  if (query.name) sqlKnex.where((bu) => {
    bu.where("name", "like", `%${query.name}%`).orWhere("id", "like", `%${query.name}%`);
  });

  let count = await sqlKnex.clone().clearSelect().count('id as count')

  sqlKnex.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize);
  if (query.orderBy) {
    sqlKnex.orderBy([query.orderBy]);
  } else {
    sqlKnex.orderBy([{ column: "update_time", order: "desc" }]);
  }
  let resultRaw = await knex.raw(sqlKnex.toString());
  let result = resultRaw.length && resultRaw[0];
  retu.data = result.map((item) => {
    item.create_time = moment(item.create_time).format("YYYY-MM-DD HH:mm");
    item.update_time = moment(item.update_time).format("YYYY-MM-DD HH:mm");
    return item;
  })
  retu.count = count?.[0]?.count || 0;
  return retu;
};

//广告主资质数据获取
exports.add = async (req) => {
  const { url, name } = req.body;
  const { id: create_user_id, oem_id } = req.$user;

  if (!name) throw new Error("未设置文件名");
  if (!create_user_id) throw new Error("未指定创建者");

  let insert_data = {
    name,
    create_user_id,
    oss_key: url.split("cn/").pop(),
    oem_id: oem_id || 1,
    status: 1,
  };
  let data = await knex(TEMPLATE_TABLE).insert(insert_data);
  let retu = { code: 0 };
  if (data && data[0]) insert_data.id = data[0];
  retu.data = insert_data;
  return retu;
};

exports.edit = async (req) => {
  const { id, name, oss_key, status } = req.body;
  const { id: create_user_id } = req.$user;

  if (!id) throw new Error("未修改模板");
  let edit_data = {
    create_user_id,
    name,
    oss_key,
    status,
  };
  if (Object.keys(edit_data).length > 0)
    await knex(TEMPLATE_TABLE).update(edit_data).where("id", id);
  let retu = { code: 0, data: "修改成功" };
  return retu;
};

// 广告主行业数据获取
exports.save = async (query) => {
  // var pid = query.pid;
  // var data = {
  //     'table': 'config_categroy',
  //     'where': {},
  //     'ins': {}
  // };
  // if (pid) {
  //     //截取数
  //     var pidAll = pid.split(',');
  //     data.ins['pid'] = pidAll.map(function (item) {
  //         return parseInt(item);
  //     });
  //     return await mysql.asyncGetList(data);
  // } else {
  //     //获取所有数据
  //     return await mysql.asyncGetList(data);
  // }
};

// 媒体行业下拉
exports.get = async (query, res) => {
  if (!query || !query.id) throw new Error("未指定模板ID");
  let data = await knex(Table)
    .select("id", "name", "oss_key")
    .where({ id: query.id, status: 0 });
  if (!data || !data.length) throw new Error("不存在该模板或模板已删除");
  data = data[0];
  let back = await client.getStream(data.oss_key);
  if (!back || !back.stream) throw new Error("读取文件失败");
  let file_name = data.name + "." + data.oss_key.split(".").pop();
  file_name = encodeURI(file_name);
  res.set({
    "Access-Control-Expose-Headers": "Content-Disposition",
    "Content-Disposition": `attachment; filename=${file_name}`,
    "Content-Type": "application/octet-stream",
  });
  back.stream.pipe(res);
};
