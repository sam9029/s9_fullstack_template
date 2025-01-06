const knex = require('../../db/knexManager').knexProxy;
const { ACCOUNT_TABLE, ACTINFO_TABLE, OEM_TABLE, ROUTE_TABLE, ROLE_TABLE, ACCOUNT_ROLE } = require("../../config/setting")
const { access_user, handleTree } = require("../../utils/marking")
const { knexTransaction } = require("../../utils/tools")
const { insertLog, getLogData } = require("../public/operationLog")



async function tree(query, user) {
  /* {
    id:xxx,
    lable:xxx,
    children:[]
  } */
  const main_router = [9, 10]
  await handler.highConcat()
  let retu = {
    code: 0,
    data: []
  }
  let { router_type = 1, company, type } = query || {}
  let search = { status: 1 }
  if (company) {
    search.company = company
  } else {
    search.id = user.oem_id || 0
  }
  let auth_router = await knex(OEM_TABLE).select(`${router_type == 1 ? 'auth_router' : 'applet_router'} as auth_router`).where(search)
  if (!auth_router.length) throw new Error('当前公司主体已关闭或不存在')
  auth_router = JSON.parse(auth_router[0].auth_router || '[]')
  let sqlKnex = knex.select("id", "pid", "menu_type")
    .select(knex.raw(`replace(json_extract( meta, '$.title' ), '"', '' ) AS label`))
    .from(ROUTE_TABLE)
    .where({ status: 1, type: router_type }) //查询未删除的
    .orderBy(['order', 'id'])//菜单顺序
  if (!(type && type == 'edit' && access_user.includes(user.id))) {
    sqlKnex.whereIn('id', auth_router)
  }
  if (type == 'edit') sqlKnex.whereNotIn('id', main_router)
  // console.log();
  let router_data = await sqlKnex
  let repose = []
  let auth_data = []

  if (query.account_id || query.role_ids) {

    if (query.method == "user" && query.account_id) {
      let sql = knex.select("a.auth_data")
        .select(knex.raw(`group_concat(r.auth_data separator '#') as role_data`))
        .from(`${ACTINFO_TABLE} as a`)
        .leftJoin(`${ACCOUNT_ROLE} as acc_role`, 'a.account_id', 'acc_role.account_id')
        .leftJoin(`${ROLE_TABLE} as r`, 'acc_role.role_id', 'r.id')
        .where("a.account_id", query.account_id)
        .groupBy("a.account_id")
      // console.log(sql.toString());
      let data = (await sql)[0]
      if (data) {
        repose = { ...data, role_data: handler.dealAuthData(data.role_data ? data.role_data.split('#') : []) }
      }
    } else if (query.method == "role" && query.role_ids.length) {
      let data = await knex.select("auth_data")
        .from(RoleTable)
        .where("id", query.id)
      repose = data.length && data[0]
    }
    // console.log(repose);
    if (repose && Object.keys(repose).length) {
      auth_data = JSON.parse(repose.auth_data || '[]')
      if (!auth_data.length && query.account_id) {
        auth_data = repose.role_data
      }
    }
  }
  retu.data = handler.formatTree(router_data)
  if (query.pid) retu.data = retu.data.filter(i => i.id == query.pid)
  if (router_type == 1) retu.result = handler.formatTree(router_data, auth_data)
  return retu
}
async function channel_tree(query, user) {
  await handler.highConcat()
  let retu = {
    code: 0,
    data: []
  }
  let { router_type = 1, company, type } = query || {}
  let auth_router = await knex(OEM_TABLE)
    .select(`${router_type == 1 ? 'auth_router' : 'applet_router'} as auth_router`)
    .where({ id: user.oem_id, status: 1 })
  if (!auth_router.length) throw new Error('当前公司主体已关闭或不存在')

  let data = (await knex.select("auth_data", "auth_router").from(ROLE_TABLE).where("id", 4))[0]
  auth_router = JSON.parse(data.auth_router || '[]')
  let sqlKnex = knex.select("id", "pid", "menu_type")
    .select(knex.raw(`replace(json_extract( meta, '$.title' ), '"', '' ) AS label`))
    .from(ROUTE_TABLE)
    .where({ status: 1, type: router_type }) //查询未删除的
    .orderBy(['order', 'id'])//菜单顺序
  let router_data = await sqlKnex.whereIn('id', auth_router)
  retu.data = handler.formatTree(router_data)
  return retu
}

async function list(query, user = {}) {
  const { router_type, type, menu_type } = query || {}
  if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限')
  let oem_id = user.oem_id || 0
  let auth_router = await knex(OEM_TABLE).select("auth_router").where({ id: oem_id, status: 1 })
  if (!auth_router.length) throw new Error('当前公司主体已关闭或不存在')
  auth_router = JSON.parse(auth_router[0].auth_router)
  let knexSql = knex(ROUTE_TABLE).select('*')
    .select(knex.raw(`(select count(rot.id) from ${ROUTE_TABLE} as rot where rot.pid = ${ROUTE_TABLE}.id and rot.status = 1) as child_num`))
    .orderBy(['order', 'id'])
    .where({ type: router_type || 1 })
  if (query.pid) knexSql.where('pid', query.pid)
  else {
    if (type == 'tree') {
      switch (menu_type) {
        case "M":
        case "C":
          knexSql.whereIn('menu_type', ['M', 'C'])
          break;
        case "T":
          knexSql.whereIn('menu_type', ['M', 'C'])
          break;
        case "F":
          knexSql.whereIn('menu_type', ['M', 'C', 'T'])
          break;
        default:
          break;
      }
    } else knexSql.whereNull('pid')
  }

  if (query.status && [1, 2].includes(Number(query.status))) {
    knexSql.where('status', query.status)
  }
  if (query.status) {
    knexSql.where({ 'status': query.status })
  } else {
    knexSql.where('status', 1)
  }
  if (!access_user.includes(user.id)) {
    knexSql.whereIn('id', auth_router)
  }
  let data = await knexSql
  let back = []
  data.forEach(element => {
    element.hasChildren = element.child_num > 0 ? true : false
    // element.hasChildren = false
    element.meta = JSON.parse(element.meta)
    back.push(element)
  });
  //筛选title,返回包含搜索条件的所有层级菜单及其所有父级菜单
  if (query.name) {
    let arr = back.filter(item => {
      if (item.meta) {
        return item.meta.title.includes(query.name)
      }
    })
    let copyObj = JSON.parse(JSON.stringify(back))
    arr.forEach(child => {
      let findParent = copyObj.filter(parent => {
        return parent.id === child.pid
      })
      if (findParent.length) {
        if (!handler.checkArr(arr, findParent[0].id)) {
          arr.push(findParent[0])
        }
      }
    })
    back = [...arr]
  }
  return {
    msg: "操作成功",
    code: 0,
    data: back
  };
}

function firstToUpper(str) {
  return str ? str.trim().replace(/-/g, '').toLowerCase().replace(str[0], str[0].toUpperCase()) : '';
}
async function add(body, user = {}) {
  if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限')
  let insert_data = {
    // name: firstToUpper(body.path),
    name: body.component ? body.component : firstToUpper(body.path),
    hidden: body.hidden,
    menu_type: body.menu_type,
    meta: JSON.stringify({
      icon: body.icon,
      title: body.name,
      noCache: body.isCache == '1' ? false : true
    }),
    oem_id: JSON.stringify([user.oem_id]),//默认是咱们公司的oem
    status: body.status,
    order: body.order || 1,
    show_sidebar: Number(body.show_sidebar || 1),
    type: body.type
  }
  if (body.menu_type == 'M') {
    insert_data.path = '/' + body.path
    insert_data.redirect = "noRedirect"
    insert_data.component = "routerViews"
  } else if (body.menu_type == 'C') {
    insert_data.pid = body.pid
    insert_data.path = body.path
    insert_data.component = body.component
    insert_data.perms = body.perms
    insert_data.redirect = body.redirect
  } else if (['F', 'T'].includes(body.menu_type)) {
    insert_data.pid = body.pid
    insert_data.component = body.component
    insert_data.perms = body.perms
    insert_data.redirect = body.redirect
  } else {
    throw new Error('暂不支持添加该类型菜单')
  }
  await knexTransaction(async (trx) => {
    let id = (await trx(ROUTE_TABLE).insert(insert_data))[0]
    await insertLog(trx, getLogData(id, 501, insert_data, user))
  })
  return {
    msg: "添加路由成功",
    code: 0,
  };
}
async function def(query, user = {}) {
  //   console.log(headers);
  if (!query.id) throw new Error('未设置查询的菜单信息')
  let data = await knex(ROUTE_TABLE).select("id", "pid", "path", "name", "redirect", "hidden", "meta", "component", "perms", "status", "order", "menu_type", "show_sidebar")
    .where({ id: query.id })
  if (!data.length) throw new Error('未查询到该菜单信息')
  let item = data[0]
  item.meta = JSON.parse(item.meta)
  item.name = item.meta.title
  item.icon = item.meta.icon
  item.status = String(item.status)
  item.show_sidebar = String(item.show_sidebar)
  item.isCache = item.meta.noCache ? '2' : '1'
  if (item.menu_type == "M") item.path = item.path.replace('/', '')
  return {
    code: 0,
    data: item
  }
}
async function edit(body, user = {}) {
  if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限')
  if (!body.id) throw new Error('未设置修改的菜单或按钮')
  let data = await knex(ROUTE_TABLE).select().where({ id: body.id })
  if (!data.length) throw new Error('未查询到该菜单或按钮')
  let item = data[0]
  const can_edit_router_keys = ['name', 'icon', 'component', 'status', 'path', 'perms', 'pid', 'isCache', 'order', 'hidden', 'redirect', 'show_sidebar']
  let edit_data = {}
  can_edit_router_keys.forEach(key => {
    if (body[key]) edit_data[key] = body[key]
  });
  let meta = JSON.parse(item.meta)
  if (edit_data.icon) meta.icon = edit_data.icon
  if (edit_data.name) meta.title = edit_data.name
  if (edit_data.isCache) meta.noCache = edit_data.isCache == '1' ? false : true
  delete edit_data.name
  delete edit_data.icon
  delete edit_data.isCache
  if (edit_data.path) {
    edit_data.name = body.component ? body.component : firstToUpper(body.path),
      edit_data.path = item.menu_type == "M" ? '/' + edit_data.path : edit_data.path
  }
  edit_data.meta = JSON.stringify(meta)
  await knexTransaction(async (trx) => {
    await trx(ROUTE_TABLE).update(edit_data).where('id', body.id)
    await insertLog(trx, getLogData(body.id, 502, edit_data, user, data[0]))
  })
  return {
    code: 0,
    data: '修改菜单成功！'
  }
}

//遍历删除所有子路由（待修改）
async function del(query, user = {}) {
  if (!access_user.includes(user.id)) throw new Error('当前用户无操作权限')
  if (!query.id) throw new Error('未设置要删除的菜单ID')
  let data = await knex(ROUTE_TABLE).where({ id: query.id })
  if (!data.length) throw new Error('未查询到该菜单信息')

  //查询当前用户所在公司拥有的所有路由
  let auth_router = await knex(OEM_TABLE).select("auth_router").where({ id: user.oem_id || 0, status: 1 })
  if (!auth_router.length) throw new Error('当前公司主体已关闭或不存在')
  auth_router = JSON.parse(auth_router[0].auth_router)
  let allSql = knex.select('group_concat(id) as ids', 'pid')
    .from(ROUTE_TABLE)
    .whereIn('id', auth_router)
    .whereNotNull('pid')
    .groupBy('pid')
  let AllRouter = (await knex.raw(allSql.toQuery().replace(/`/g, '')))[0]
  let routerObj = {}
  AllRouter.forEach(item => {
    routerObj[item.pid] = item.ids ? item.ids.split(',') : []
  })
  let arr = handler.formatRouter(routerObj, query.id)
  await knexTransaction(async (trx) => {
    await trx(ROUTE_TABLE).update({ status: 3 }).whereIn('id', arr) //将第三级全部删除
    let log_data = arr.map(item => {
      return getLogData(item, 503, { status: 3 }, user)
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: '删除该路由成功'
  }
}

let handler = {
  async highConcat() {
    await knex.schema.raw(`SET SESSION group_concat_max_len = 1024 * 100`);
  },
  checkArr(arr, id) {
    return arr.find(arrItem => arrItem.id == id)
  },
  formatTree(arr, data) {
    let copyObj = JSON.parse(JSON.stringify(arr))  //深拷贝源数据
    return copyObj.filter(parent => {
      let findChildren = copyObj.filter(child => {
        return parent.id === child.pid && (data ? child.menu_type != "F" : true)
      })
      if (findChildren.length) {
        findChildren.forEach(item => {
          if (data) {
            item.model = null
            if (data.find(t => t.interface_id == item.id)) {
              item.model = data.find(t => t.interface_id == item.id).type
            }
          }
          parent.children ? parent.children.push(item) : parent.children = [item]
        })
      } else {
        // parent.children = []
      }
      // && parent.id != 8
      return parent.pid == null
    })
  },
  //处理数据权限
  dealAuthData(arr = []) {
    if (!arr.length) return []
    let map = new Map()
    arr.forEach(item => {
      let dataArr = JSON.parse(item || '[]')
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
  formatRouter(obj, id) {
    let copyObj = JSON.parse(JSON.stringify(obj))
    let result = []
    let findChildren = (pid) => {
      result.push(pid)
      let ids = copyObj[pid] || []
      if (ids.length) {
        ids.forEach(item => {
          findChildren(item)
        })
      } else {
        return
      }
    }
    findChildren(String(id))
    return result
  }
}
module.exports = {
  channel_tree,
  tree,
  list,
  add,
  def,
  edit,
  del,
  handler
  // dataTree
};
