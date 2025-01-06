const knex = require("../../db/knexManager").knexProxy;
const { ACCOUNT_TABLE, ACTINFO_TABLE, OEM_TABLE, ROUTE_TABLE, ROLE_TABLE,
  DEPT_TABLE, ACCOUNT_ROLE, TABLE_CONSULTANT, INVITE_DATA, FINGERPRINT_TABLE } = require("../../config/setting")
const { access_user, exclude_role } = require("../../utils/marking");
const crypto = require("crypto");
const config = require("../../config");
const moment = require("moment");
const { getAccountVipLelve, getChannelRouterIds, getCreatorHost, getAccountRecord } = require("../../utils/apiMapper");
const { getPermission, getGroupAccountId, getChildrenByPermission } = require("../public/permission")
const { getInviteCode, getUuid, knexTransaction, mixPhoneNumber, getRequestIP, getWeakPassword, selectName } = require("../../utils/tools")
const { insertLog, getLogData } = require("../public/operationLog")
const { uploadFile, getCoverUrl } = require("../public/upload")
const { encrypt } = require("../../utils/jwt");
const UAParser = require('ua-parser-js');
const { getAccountRoleIds } = require("../../db/token");
const { ACCOUNT_USER_INTERFACE } = require("../../config/interface_id");
const { queryLikeWhere } = require("../../utils/sqlHelper");
const { checkKeys } = require("../../utils/check_type");
const json_key = ["auth_router", "applet_router", "auth_data", "department", "role_ids"];
const WEAK_PWD = getWeakPassword()
/**
 * 检查注册用的手机号、邮箱是否已使用
 * @param {*} query query.telephone(必填) query.email 两者传其一
 * @param {*} userInfo 
 * @param {*} not_account_id  //除去本人
 * @returns 
 */
async function telIsRepeat(query = {}, userInfo = {}, not_account_id) {
  if (!query.telephone || !query.email) return Promise.reject('未设置检查的账户或邮箱！');
  let { telephone, email } = query
  let { oem_id } = userInfo
  if (telephone) {
    let data = (await knex(ACCOUNT_TABLE).select('id', 'name', 'telephone').where({ oem_id, telephone })
      .where(builder => { if (not_account_id) builder.whereNot('id', not_account_id) })
    )[0]
    if (data) return Promise.reject('该手机号已被使用！')
  }
  if (email) {
    let data = (await knex(ACCOUNT_TABLE).select('id', 'name', 'telephone').where({ oem_id, email })
      .where(builder => { if (not_account_id) builder.whereNot('id', not_account_id) }))[0]
    if (data) return Promise.reject('该邮箱已被使用！')
  }
}
/**
 * 获取用户信息接口
 * @param {*} user token? id 
 * @param {*} platform 
 * @param {*} trx 
 * @returns 
 */
async function info(user, platform = 'pc', trx = knex) {
  let info = (await trx.select("acf.avatar", "acf.gender", 'acc.password', 'acc.account_type', 'acc.name',
    'acc.realname_status', 'acc.oem_id', 'acc.role_ids', 'acc.department', 'acc.create_time', 'acc.telephone', 'acc.email')
    .from(`${ACTINFO_TABLE} as acf`)
    .select(selectName('acc', 'oem_id', OEM_TABLE, 'root_user_id', 'root_user_id', 'id'))
    .select(selectName('acc', 'oem_id', OEM_TABLE, 'platform_setting', 'setting', 'id'))
    .leftJoin(`${ACCOUNT_TABLE} as acc`, 'acf.account_id', 'acc.id')
    .where({ "acf.account_id": user.id, "acc.status": 1 }))[0];
  //用户部门
  if (!info) return Promise.reject('用户不存在！')
  let { password, root_user_id } = info
  user.role_ids = user.role_ids || (await getAccountRoleIds(user.id)) //逗号分割的角色ID
  info.dept = await trx(DEPT_TABLE).select("id", "dept_name", "channel_type").whereIn("id", JSON.parse(info.department || '[]'));
  if (user.role_ids) info.role = await trx(ROLE_TABLE).select('id', "role_name", "koc_role").where({ oem_id: info.oem_id }).whereIn('id', user.role_ids.split(','))
  let weak_pwd = new Set([...WEAK_PWD, crypto.createHash('md5').update(info.telephone + config.deviation).digest('hex')])
  delete info.password
  delete info.root_user_id
  return {
    code: 0,
    data: {
      id: user.id,
      weak_pwd: weak_pwd.has(password),
      ...info,
      role_ids: user.role_ids,
      telephone: mixPhoneNumber(info.telephone),
      phone: user.token ? encrypt(info.telephone, user.token) : "",
      is_super_account: access_user.includes(user.id) || (root_user_id == user.id),
      device_id: user?.device_id
    }
  };
}
async function router(query, user = {}) {
  let retu = {
    code: 0,
    data: {
      router: [],
      button: [],
      first_router: ''
    },
  };
  let { channel_id = 0, oem_id = 0, account_type, id: account_id } = user
  let { platform = "pc", back_array = false } = query || {}
  await handler.highConcat();
  let router_type = platform == 'pc' ? 'auth_router' : 'applet_router'
  // account join company join role join account_info 获取公司的路由 当前角色的路由 以及当前用户的临时路由
  let deptSql = knex.select(knex.raw(`JSON_ARRAYAGG(r.${router_type}) as role_router`))
    .select(`cam.${router_type} as company_router`, "cam.root_user_id", "a.id", "a.oem_id", `acc.${router_type} as account_router`, "acc.auth_type")
    .from(`${ACCOUNT_TABLE} as a`)
    .leftJoin(knex.raw(`${ACCOUNT_ROLE} as acc_role on acc_role.account_id = a.id and acc_role.status = 1`))
    .leftJoin(knex.raw(`${ROLE_TABLE} as r on r.id = acc_role.role_id and r.status = 1`))
    .leftJoin(`${ACTINFO_TABLE} as acc`, "a.id", "acc.account_id")
    .leftJoin(`${OEM_TABLE} as cam`, builder => {
      builder.on("a.oem_id", "=", "cam.id").andOn("cam.status", "=", 1);
    })
    .groupBy(["a.id", "cam.id"])
    .where({ "a.id": account_id, "a.oem_id": oem_id });

  let result = (await deptSql)[0]
  if (!result) return Promise.reject('路由获取异常！')
  let router = new Set((handler.dealRouter(result) || []));
  const is_super_user = access_user.includes(account_id)
  let company_super_account = result && result.root_user_id == account_id;
  if (router.size || company_super_account || is_super_user) {
    //当其有路由权限，或者为该公司超管账户时
    let company_router = JSON.parse(result.company_router || "[]");
    let routerSql = knex
      .select("id", "pid", "path", "name", "redirect", "hidden", "meta", "component", "menu_type", "show_sidebar", "perms")
      .from(ROUTE_TABLE)
      .andWhere({ status: 1, type: platform == 'pc' ? 1 : 2 }) //查询未删除和启用的PC端路由
      .orderBy(["order", "id"]); //菜单顺序
    if (!is_super_user) routerSql.whereIn("id", company_router);
    if (channel_id && account_type != 4) routerSql.whereIn('id', await getChannelRouterIds(channel_id))
    let router_data = await routerSql;
    //过滤按钮类型且path为空的数据
    let main_routers = [] // 主菜单

    let routeArr = router_data.filter((element) => {
      element.meta = element.meta ? JSON.parse(element.meta) : {};
      element.meta.show_sidebar = element.show_sidebar || 1;
      //是否有权限放入meta.hasPermission中
      if (!is_super_user) element.meta.hasPermission = router.has(element.id)
      if (company_super_account || is_super_user) element.meta.hasPermission = true; //超管拥有该公司的所有权限
      element.hidden = element.hidden != 1
      //重定向
      if (element.redirect && element.redirect !== "noRedirect") element.redirect = { path: element.redirect };
      if (["F", "T"].includes(element.menu_type)) {
        element.hidden = true;
        if (is_super_user || company_super_account || router.has(element.id)) retu.data.button.push({ id: element.id, perms: element.perms })
      }
      if (element.meta.hasPermission && ['M', 'C'].includes(element.menu_type)) main_routers.push(element)
      return !!element.path || !["F"].includes(element.menu_type);
    });
    if (back_array) retu.data.router_array = routeArr
    retu.data.router = handler.formatTree(routeArr, user);
    retu.data.first_router = handler.findFirstRouter(handler.formatTree(main_routers, user))
  }
  return retu;
}

async function permsMapper(query, user = {}) {
  let retu = {
    code: 0,
    data: {},
  };
  const { platform = "pc" } = query || {}
  let perms_data = await knex
    .select("id", "perms")
    .from(ROUTE_TABLE)
    .whereNotNull("perms")
    .whereIn("menu_type", ["F", "C", "T"])
    .andWhere({ status: 1, type: platform == 'pc' ? 1 : 2 }) //查询未删除和启用的
    .orderBy(["order", "id"]); //菜单顺序
  perms_data.forEach((element) => {
    retu.data[element.perms] = element.id;
  });
  return retu;
}

//直属上级下拉
async function upperUser(query, user = {}) {
  if (!user.oem_id) return Promise.reject("未设置公司主体");
  if (!query || !query.role_ids) return Promise.reject("未传入角色ID");
  if (typeof (query.role_ids) == "string") query.role_ids = JSON.parse(query.role_ids)
  if (!Array.isArray(query.role_ids)) return Promise.reject("role_ids应为数组")
  let retu = {
    code: 0,
    data: [],
  };
  let accountIds = []
  if (query.interface_id) accountIds = await getPermission(query, user)
  //判断是否包含 投顾、博主
  let flag = query.role_ids.some(item => [2, 3].includes(Number(item)))
  let result = []
  if (flag) {
    //博主：所有账户，投顾：除投顾外所有账户
    let accountSql = knex.select('a.id', 'a.name')
      .from(`${ACCOUNT_ROLE} as r`)
      .leftJoin(`${ACCOUNT_TABLE} as a`, 'a.id', 'r.account_id')
      .leftJoin(`${ROLE_TABLE} as role`, 'r.role_id', 'role.id')
      .where({ 'r.status': 1, 'r.oem_id': user.oem_id || 0, 'a.oem_id': user.oem_id || 0, 'a.status': 1 })
      .whereNotIn('r.role_id', [1, 3])
      .whereRaw(`(role.koc_role = 1 or role.id = 2)`) //筛选koc商务默认带上投顾（不需要博主）
    if (query.role_ids.map(item => Number(item)).includes(2)) accountSql.where('r.role_id', '!=', 2)
    //排除自己
    if (query.account_id) accountSql.where("a.id", "!=", query.account_id);
    if (accountIds.length) accountSql.whereIn("a.id", accountIds)
    let data = await accountSql
    result = [...data]
    // retu.data = data
  } else {

    //通过角色查找所有上级角色，然后找到角色对应账户
    let knexSql = await knex
      .select("id", "upper_id")
      .from(ROLE_TABLE)
      .where({ oem_id: user.oem_id || 0 });
    let roleArr = await handler.formatUpperRole(knexSql, query.role_ids);
    if (roleArr.length) {
      let sql = knex.select("a.id", "a.name")
        .from(`${ACCOUNT_ROLE} as r`)
        .leftJoin(`${ACCOUNT_TABLE} as a`, 'r.account_id', 'a.id')
        .where({ 'a.oem_id': user.oem_id || 0, 'r.status': 1, 'a.status': 1 })
        .whereIn("r.role_id", roleArr)
        .whereNot('r.role_id', 1)
        .andWhere((builder) => {
          //排除自己
          if (query.account_id) builder.where("a.id", "!=", query.account_id);
        });
      if (accountIds.length) sql.whereIn("a.id", accountIds)
      let data = await sql
      result.push(...data)
    }
    //加上同部门的所有人
    if (query.dept_ids && query.dept_ids.length) {
      let deptSql = knex.select("a.id", "a.name")
        .from(`${ACCOUNT_TABLE} as a`)
        .leftJoin(knex.raw(`${ACCOUNT_ROLE} as r on r.account_id = a.id and r.status = 1`))
        .where({ 'a.oem_id': user.oem_id || 0, 'a.status': 1 })
        .whereNot('r.role_id', 1)
        .andWhere((builder) => {
          //排除自己
          if (query.account_id) builder.where("a.id", "!=", query.account_id);
        })
        .andWhere(builder => {
          for (let i = 0, len = query.dept_ids.length; i < len; i++) {
            builder.orWhereRaw(`JSON_CONTAINS(a.department, JSON_ARRAY(${query.dept_ids[i]}))`)
          }
        })
      let data = await deptSql
      result.push(...data)
    }
  }
  //去重
  let back = {}
  result.forEach(item => {
    back[item.id] = item
  })
  retu.data = Object.keys(back).map(item => back[item])
  return retu;
}

async function subUser(query, user = {}) {
  return {
    code: 0,
    data: []
  }
}

async function blogLeader(query, user = {}) {
  let retu = {
    code: 0,
    data: []
  }
  return retu
}

async function list(query, user = {}) {
  let retu = {
    code: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 10),
    count: 0,
  };
  let accountIds = await getPermission({ interface_id: ACCOUNT_USER_INTERFACE.list }, user, null, false);
  let oem_id = user.oem_id || 0
  let cloums = ['a.id', 'a.name', 'a.email', "a.status", 'a.telephone', 'a.create_time', 'a.oem_id', 'a.direct_leader', 'a.update_user_id', 'a.create_user_id', 'a.update_time', 'a.uid']
  let knexSql = knex.select('acc_info.auth_type').select(cloums)
    .select(knex.raw(`GROUP_CONCAT(r.id) as role_ids`))
    .select(knex.raw(`GROUP_CONCAT(r.role_name) as role_names`))
    .from(`${ACCOUNT_TABLE} as a`)
    .leftJoin(`${ACTINFO_TABLE} as acc_info`, "a.id", "acc_info.account_id")
    .leftJoin(knex.raw(`${ACCOUNT_ROLE} as acc_role on acc_role.account_id = a.id and acc_role.status = 1`))
    .leftJoin(knex.raw(`${ROLE_TABLE} as r on r.id = acc_role.role_id and r.status = 1`))
    .andWhere(builder => {
      if (accountIds?.length) builder.whereIn('a.id', accountIds)
    })
    .whereNot('a.id', 10000000) //排除KOC系统账号
    .groupBy('a.id')
  //超管账号仅对超管可见
  if (!access_user.includes(user.id)) knexSql.where("a.oem_id", oem_id).whereNotIn('a.id', access_user)
  knexSql = handler.searchFilter(knexSql, query);
  let count = await knex.count({ count: "t.id" }).from(knex.raw(`(${knexSql.toQuery()}) as t`));
  retu.count = count[0]?.count || 0;
  knexSql.select(selectName('a', 'create_user_id', ACCOUNT_TABLE, 'name', 'create_user_name', 'id'))
    .select(selectName('a', 'oem_id', OEM_TABLE, 'company', 'company'))
    .select(knex.raw(`(SELECT GROUP_CONCAT(DISTINCT dept.dept_name SEPARATOR '#') AS dept_name FROM ${DEPT_TABLE} AS dept WHERE dept.status = 1 AND JSON_CONTAINS(a.department -> '$[*]', JSON_ARRAY(dept.id))) AS departments`))
    .select(selectName('a', 'update_user_id', ACCOUNT_TABLE, 'name', 'update_user_name', 'id'))
    .select(selectName('a', 'direct_leader', ACCOUNT_TABLE, 'name', 'leader_name', 'id'))
    .limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", "desc");
  retu.data = await knexSql
  retu.data = retu.data.map(item => {
    item.auth_type = item.auth_type || 1
    item.responsible_channel = JSON.parse(item.responsible_channel || "[]");
    item.departments = item.departments?.split('#') || []
    item.telephone = mixPhoneNumber(item.telephone)
    return item;
  });
  return retu;
}

async function add(body, user = {}) {
  let account_info = checkKeys(body, ["gender?", "auth_router", "applet_router",
    "avatar?", "avatar_type?", "auth_data", "collaborators?", "remark?",
    "auth_type", "data_type", "register_type?"])
  let account = checkKeys(body, ["name", "status?", "direct_leader?", "telephone",
    "department", "version?", "phone_verification",
    "contacts?", "address?", "email", "password",
    { key: 'role_ids', type: Array, required: true }
  ])
  let retu = { message: "添加用户成功!", code: 0, data: null }
  let { id: update_user_id, oem_id } = user
  await getPermission({ interface_id: ACCOUNT_USER_INTERFACE.add }, user);
  await telIsRepeat({ telephone: account.telephone, email: account.email }, user);
  json_key.forEach(key => {
    if (account[key]) account[key] = JSON.stringify(account[key])
    if (account_info[key]) account_info[key] = JSON.stringify(account_info[key])
  });
  retu.data = await knexTransaction(async (trx) => {
    account = {
      ...account,
      password: crypto.createHash('md5').update(account.password + config.deviation).digest('hex'),
      uid: await getInviteCode(),
      account_type: 3,
      update_user_id,
      create_user_id: update_user_id,
      oem_id,
    }
    let [account_id] = (await trx(ACCOUNT_TABLE).insert(account))
    account_info.account_id = account_id
    await trx(ACTINFO_TABLE).insert(account_info)
    let roleInfo = body.role_ids.map(role_id => {
      return {
        account_id,
        role_id,
        status: 1,
        create_user_id: update_user_id,
        oem_id,
        update_user_id
      }
    })
    await trx(ACCOUNT_ROLE).insert(roleInfo)
    await insertLog(trx, getLogData(account_id, 101, { ...account, ...info, role_ids: body.role_ids }, user))
    return account_id
  });
  return retu
}

async function def(query, user = {}) {
  let { id } = checkKeys(query, ["id"])
  await handler.highConcat();
  let account_ids = await getPermission({ interface_id: ACCOUNT_USER_INTERFACE.edit }, user);
  let { oem_id } = user
  let knexSql = knex
    .select(knex.raw(`JSON_ARRAYAGG(r.auth_router) as role_auth_router`))
    .select(knex.raw(`JSON_ARRAYAGG(r.applet_router) as role_applet_router`))
    .select(knex.raw(`JSON_ARRAYAGG(r.auth_data) as role_auth_data`))
    .select(["id", "name", "status", "direct_leader", "telephone", "version", "phone_verification", "contacts", "address", "update_user_id", "create_user_id", "email"].map(i => `a.${i}`))
    .select("acc_info.*")
    .select(knex.raw(`GROUP_CONCAT(distinct r.data_type) as role_data_type`))
    .select(knex.raw(`GROUP_CONCAT(r.role_name) as role_names`))
    .select(knex.raw(`GROUP_CONCAT(r.id) as role_ids`))
    .select(knex.raw(`(SELECT GROUP_CONCAT(DISTINCT dept.id SEPARATOR '#') FROM ${DEPT_TABLE} AS dept WHERE dept.status = 1 AND JSON_CONTAINS(a.department -> '$[*]', JSON_ARRAY(dept.id))) AS department`))
    .from(`${ACCOUNT_TABLE} as a`)
    .leftJoin(`${ACTINFO_TABLE} as acc_info`, "a.id", "acc_info.account_id")
    .leftJoin(knex.raw(`${ACCOUNT_ROLE} as acc_role on acc_role.account_id = a.id and acc_role.status = 1`))
    .leftJoin(knex.raw(`${ROLE_TABLE} as r on r.id = acc_role.role_id and r.status = 1`))
    .where({ "a.id": id, 'a.oem_id': oem_id })
    .groupBy("a.id").limit(1)
  if (account_ids?.length) knexSql.whereIn('a.id', account_ids)
  let item = (await knexSql)[0]
  if (!item) return Promise.reject("未查询到该用户信息");
  item.department = item.department?.split('#')?.map(i => Number(i)) || []
  //auth_type: 1：角色权限 2：用户权限
  if (item.auth_type == 2) {
    item.auth_router = JSON.parse(item.auth_router || "[]");
    item.applet_router = JSON.parse(item.applet_router || "[]");
    item.auth_data = JSON.parse(item.auth_data || "[]");
  } else {
    let dataArr = item.role_auth_data ? JSON.parse(item.role_auth_data) : []
    item.auth_router = item.role_auth_router ? handler.dealArr(item.role_auth_router) : []
    item.applet_router = item.role_applet_router ? handler.dealArr(item.role_applet_router) : []
    //数据权限
    item.auth_data = handler.dealAuthData(dataArr)
    //数据权限类型
    let data_type = item.role_data_type ? item.role_data_type.split(',') : []
    if (data_type.length == 1) {
      item.data_type = data_type[0]
    } else {
      item.data_type = 5
    }
    delete item.role_auth_data
    delete item.role_auth_router
    delete item.role_data_type
    delete item.role_applet_router
  }
  return {
    code: 0,
    data: item,
  };
}

async function edit(body, user = {}) {
  let account_info = checkKeys(body, ["gender?", "auth_router?", "applet_router?",
    "avatar?", "avatar_type?", "auth_data?", "collaborators?", "remark?",
    "auth_type?", "data_type?", "register_type?"])
  let account = checkKeys(body, ["id", "name?", "status?", "direct_leader?", "telephone?",
    "department?", "version?", "phone_verification?",
    "contacts?", "address?", "email?", "password?",
    { key: 'role_ids', type: Array, required: false }
  ])
  let { id: update_user_id, oem_id } = user
  let { telephone, email } = account
  let account_ids = await getPermission({ interface_id: ACCOUNT_USER_INTERFACE.edit }, user, null, false) //优化提权漏洞
  if (telephone || email) await telIsRepeat({ telephone, email }, user, body.id);
  await knexTransaction(async (trx) => {
    //不可操作已删除的用户
    let checkSql = trx.select('a.*', 'info.gender', 'info.avatar', 'info.avatar_type', 'info.auth_router', 'info.auth_data', 'info.collaborators', 'info.remark', 'info.auth_type', 'info.data_type', 'info.register_type')
      .select(knex.raw(`GROUP_CONCAT(r.role_id) as role_ids`))
      .from(`${ACCOUNT_TABLE} as a`)
      .leftJoin(`${ACTINFO_TABLE} as info`, 'a.id', 'info.account_id')
      .leftJoin(knex.raw(`${ACCOUNT_ROLE} as r on a.id = r.account_id and r.status = 1`))
      .where({ 'a.id': body.id, 'a.oem_id': oem_id })
      .groupBy('a.id')
    if (account_ids?.length) checkSql.whereIn('a.id', account_ids)
    let data = (await checkSql)[0]
    if (!data) return Promise.reject("未查询到该用户");
    const { password, role_ids } = account;
    json_key.forEach(key => {
      if (account[key]) account[key] = JSON.stringify(account[key])
      if (account_info[key]) account_info[key] = JSON.stringify(account_info[key])
    });
    if (password) account.password = crypto.createHash("md5").update(password + config.deviation).digest("hex"); //更改密码
    if (Object.keys(account).length <= 1) return Promise.reject('未设置更新内容')
    await trx(ACCOUNT_TABLE).update(account).where("id", body.id);
    if (Object.keys(account_info).length >= 1) await trx(ACTINFO_TABLE).update(account_info).where("account_id", body.id)

    //更新account_role表
    if (role_ids && role_ids?.length) {
      await trx(ACCOUNT_ROLE).update({ status: 3 }).where({ account_id: body.id })
      let roleInfo = role_ids.map(item => {
        return {
          account_id: body.id,
          role_id: item,
          status: 1,
          create_user_id: update_user_id,
          oem_id,
          update_user_id
        }
      })
      await trx(ACCOUNT_ROLE).insert(roleInfo).onConflict(['account_id', 'role_id']).merge()
    }
    let updateObj = { ...account, ...account_info }
    await insertLog(trx, getLogData(body.id, 102, updateObj, user, data))
  });
  return {
    code: 0,
    message: "修改用户成功！",
  };
}

async function del(body, user = {}) {
  if (!body.ids || !body.ids.length) return Promise.reject("未设置要删除的用户ID");
  if (!Array.isArray(body.ids)) return Promise.reject('ids为数组，请检查参数')
  let { id: update_user_id, oem_id } = user
  let account_ids = await getPermission({ interface_id: ACCOUNT_USER_INTERFACE.del }, user, null, false) //优化提权漏洞
  let data = await knex(ACCOUNT_TABLE).select("id", "status").whereIn("id", body.ids).where({ oem_id })
    .where(builder => {
      if (account_ids?.length) builder.whereIn('id', account_ids)
    })
  if (!data.length) return Promise.reject("未查询到该用户信息");
  await knexTransaction(async (trx) => {
    let update_data = { status: 3, update_user_id }
    await trx(ACCOUNT_TABLE).update(update_data).whereIn("id", data.map((i) => i.id))
    await insertLog(trx, data.map(item => {
      return getLogData(item.id, 103, update_data, user, item)
    }))
  })
  return {
    code: 0,
    message: "删除该用户成功",
  };
}

async function roleAuthTree(query, user = {}) {
  if (!query || !query.role_ids) return Promise.reject("未设值角色ID");
  if (!Array.isArray(query.role_ids)) return Promise.reject('role_ids为数组，请检查参数')
  let retu = {
    code: 0,
    data: {}
  }
  let data = await knex(ROLE_TABLE).select("id", "auth_router", "auth_data", "applet_router")
    .whereIn("id", query.role_ids)
    .where({ status: 1, oem_id: user.oem_id || 0 });
  if (!data.length) return Promise.reject("未查询到该角色权限信息");
  if (data.length == 1) {
    let back = {
      auth_router: JSON.parse(data[0].auth_router || "[]"),
      auth_data: JSON.parse(data[0].auth_data || "[]"),
      applet_router: JSON.parse(data[0].applet_router || "[]"),
    };
    retu.data = back
  } else {
    let dataArr = data.map(item => JSON.parse(item.auth_data || '[]'))
    let routerArr = data.map(item => JSON.parse(item.auth_router))
    let routerApplet = data.map(item => JSON.parse(item.applet_router))
    retu.data.auth_router = handler.dealArr(JSON.stringify(routerArr))
    retu.data.applet_router = handler.dealArr(JSON.stringify(routerApplet))
    //数据权限
    let auth_data = handler.dealAuthData(dataArr)
    retu.data.auth_data = auth_data
  }
  return retu
}
async function kocTree(query, user) {
  let retu = {
    code: 0,
    data: []
  }
  return retu
}



async function roleUser(query, user) {
  let retu = {
    code: 0,
    data: [],
  };
  return retu;
}

async function updateBankInfo(body, userInfo) {

}
//收集浏览器指纹信息
async function fingerprint(req, userInfo) {
  let body = req.body || {}
  let retu = {
    code: 0,
    data: {}
  }
  let { id: account_id, oem_id = 1 } = userInfo || {}
  let { fingerprint, score = 1 } = body
  if (!account_id || !fingerprint) return retu
  let ip = getRequestIP(req)
  let ua = req.headers['user-agent'] || ''
  let ua_info = UAParser(ua)
  let before_data = (await knex(FINGERPRINT_TABLE).select('id').where({ fingerprint, account_id }))[0]
  if (before_data) return retu
  await knex(FINGERPRINT_TABLE).insert({
    fingerprint,
    score,
    ua_info: JSON.stringify(ua_info),
    ua,
    account_id,
    oem_id,
    ip
  })
  return retu
}

let handler = {
  async highConcat() {
    await knex.schema.raw(`SET SESSION group_concat_max_len = 1024 * 10000`);
  },
  formatTree(arr, user = {}) {
    let copyObj = JSON.parse(JSON.stringify(arr)); //深拷贝源数据
    return copyObj.filter((parent) => {
      let findChildren = copyObj.filter((child) => {
        return parent.id === child.pid;
      });
      let findParent = copyObj.filter((p) => {
        return p.id === parent.pid;
      });
      let findNode = (pid) => {
        let findNode = copyObj.filter((parent) => {
          return pid == parent.id;
        });
        return findNode.length && findNode[0];
      };
      if (findChildren.length) {
        findChildren.forEach((item) => {
          if (["T"].includes(item.menu_type)) {
            //F类型路由默认挂载到与其列表同一层级上
            item.path = item.path ? parent.path + "/" + item.path : "";
            // parentNode.children ? parentNode.children.push(item) : parentNode.children = [item]
            // parent.children ? parent.children.push(item) : parent.children = [item]
          } else if (["F"].includes(item.menu_type)) {
            //F类型路由默认挂载到与其列表同一层级上
            let parentNode = findParent[0] || {};
            //如果父级是T类型,拼接（父级的父级）的path，并插入（父级的父级）的children里
            if (parent.menu_type == "T") {
              // console.log('T:'+item.meta.title)
              let grandParentNode = findNode(parentNode.pid) || {};
              item.path = parentNode.path + (item.path ? "/" + item.path : ""); //拼接F及其上一层级的path
              grandParentNode.children ? grandParentNode.children.push(item) : (grandParentNode.children = [item]);
            } else {
              item.path = parent.path + (item.path ? "/" + item.path : ""); //拼接F及其上一层级的path
              parentNode.children ? parentNode.children.push(item) : (parentNode.children = [item]);
            }
          } else {
            parent.children ? parent.children.push(item) : (parent.children = [item]);
          }
        });
      } else {
        // parent.children = []
      }
      if (access_user.includes(user.id)) {
        return parent.pid == null;
      } else {
        return parent.pid == null //&& parent.id != 8;
      }
    });
  },
  dealRouter(routerArr) {
    let arr = [];
    //如果user设置了菜单权限就以用户权限为准，如果没设置就以角色权限为准
    if (routerArr.auth_type == 2 && routerArr.account_router) {
      arr = [...handler.dealArr(routerArr.account_router)];
    } else if ((!routerArr.auth_type || routerArr.auth_type == 1) && routerArr.role_router) {
      arr = [...handler.dealArr(routerArr.role_router)];
    }
    return arr
  },
  dealArr(arr) {
    let data = arr ? arr.replace(/\[|]/g, "").split(",").map((item) => Number(item)) : [];
    data = data ? [...new Set(data)] : [];
    return data.filter(i => (i || i == 0))
  },
  findFirstRouter(arr) {
    if (!arr.length) return '/'
    let result = ''
    let findChild = (item) => {
      let obj = { ...item }
      if (obj.children && obj.children.length) {
        result += ('/' + item.path)
        findChild(obj.children[0])
      } else {
        result += ('/' + item.path)
      }
    }
    findChild(arr[0])
    return (result ? result.substr(1) : '/')
  },
  async formatUpperRole(arr, ids = []) {
    let copyObj = JSON.parse(JSON.stringify(arr));
    ids = ids.map(item => Number(item))
    let result = [];
    let findUpper = (uid) =>
      copyObj.forEach((item) => {
        if (item.id == uid) {
          result.push(item.id);
          if (item.upper_id) findUpper(item.upper_id);
        }
      });
    let obj = copyObj.filter((item) => {
      return ids.includes(item.id);
    });
    obj.length && !!obj[0].upper_id && findUpper(obj[0].upper_id);
    return result;
  },
  searchFilter(sqlKnex, query) {
    queryLikeWhere(sqlKnex, ['a.name', 'a.id', 'a.telephone'], query.keyword)
    if (query.oem_id) sqlKnex.where("a.oem_id", query.oem_id);
    if (query.status) sqlKnex.where({ 'a.status': query.status })
    else sqlKnex.whereIn('a.status', [1, 2])
    if (query.koc_role) sqlKnex.where('r.koc_role', query.koc_role)
    if (query.dept_id) sqlKnex.whereRaw(`JSON_CONTAINS(a.department->'$[*]',JSON_ARRAY(${query.dept_id}))`);
    if (query.dept_name) sqlKnex.whereRaw(`JSON_CONTAINS(a.department->'$[*]',JSON_ARRAY(${query.dept_name}))`);
    if (query.role_id) sqlKnex.where("acc_role.role_id", query.role_id)
    if (query?.role_ids?.length) sqlKnex.whereIn("acc_role.role_id", query.role_ids);
    if (query.auth_type) sqlKnex.where('acc_info.auth_type', query.auth_type)
    if (query.department_id) sqlKnex.whereRaw(`JSON_CONTAINS(a.department->'$[*]',JSON_ARRAY(${query.department_id}))`);
    if (query.koc_role) sqlKnex.where('r.koc_role', query.koc_role)
    return sqlKnex;
  },
  //处理数据权限
  dealAuthData(arr = []) {
    if (arr.length <= 1) return arr || []
    let map = new Map()
    arr.forEach(item => {
      let dataArr = item || []
      dataArr.forEach(dItem => {
        //map中已有此interface_id 且 已有>当前时不需要处理原map
        if (!(map.has(dItem.interface_id) && map.get(dItem.interface_id) > dItem.type)) map.set(dItem.interface_id, dItem.type)
      })
    })
    let result = [...map].map(([k, v]) => {
      return { interface_id: k, type: v }
    })
    return result
  },
  // 自己及下级
  async getPersonAccountIds(userInfo, result, filterStatus = true) {
    await getAllChildren(userInfo.id, result)
    result.push(userInfo.id)

    // 获取所有下级
    async function getAllChildren(userId, result) {
      const children = await getNextChildren(userId);
      if (!children.length) {
        return;
      }
      for (let child of children) {
        result.push(child);
        await getAllChildren(child, result);
      }
    }

    // 获取直属下级
    async function getNextChildren(userId) {
      const childrenArr = await knex(ACCOUNT_TABLE).select('id').where({
        'direct_leader': userId,
        "oem_id": userInfo.oem_id,
      }).andWhere(builder => {
        if (filterStatus) {
          builder.where({ 'status': 1 })
        }
      })
      const childId = childrenArr.map(item => item.id)
      if (childId.length) {
        return childId;
      } else {
        return [];
      }
    }
  },
  formatKocTree(arr) {
    let copyObj = JSON.parse(JSON.stringify(arr))  //深拷贝源数据
    let ids = copyObj.map(item => item.id)
    return copyObj.filter(parent => {
      let findChildren = copyObj.filter(child => {
        return parent.id === child.direct_leader
      })
      if (findChildren.length) {
        findChildren.forEach(item => {
          parent.children ? parent.children.push(item) : parent.children = [item]
        })
      } else {
        // parent.children = []
      }
      return (!parent.direct_leader || !ids.includes(parent.direct_leader))
    })
  },
  async getCompanyAccount(userInfo) {
    let sqlKnex = knex(ACCOUNT_TABLE)
      .select('id')
      .where({ 'status': 1, 'oem_id': userInfo.oem_id || 0 })
      .whereNot('id', 10000000)
    let result = await sqlKnex
    return result.map(item => item.id)
  },
  formatString(val) {
    return (val + '').replace(/\s+/g, '')
  },
  setMapper(data, key, value) {
    let mapper = {}
    for (let i = 0, len = data.length; i < len; i++) {
      let item = data[i]
      mapper[item[key || "id"]] = item[value || "name"]
    }
    return mapper
  },
};

async function avatar(req, user = {}) {
  let data = await uploadFile(req, user, 'avatar')
  const { id: user_id } = user || {}
  if (!user_id) return Promise.reject('用户不存在！')
  let before_data = (await knex(ACTINFO_TABLE).select('avatar').where({ account_id: user_id }))[0]
  if (!before_data) return Promise.reject('用户不存在！')
  await knexTransaction(async trx => {
    await knex(ACTINFO_TABLE).update({ avatar: data.url }).where({ account_id: user_id })
    await insertLog(trx, getLogData(user_id, 105, { avatar: data.url }, user, before_data))
  })
  return {
    code: 0,
    data: data.url,
  };
}

module.exports = {
  telIsRepeat,
  info,
  router,
  list,
  add,
  def,
  edit,
  del,
  permsMapper,
  upperUser,
  roleAuthTree,
  kocTree,
  subUser,
  blogLeader,
  roleUser,
  updateBankInfo,
  avatar,
  fingerprint,
};
