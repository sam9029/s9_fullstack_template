const knex = require('../../../../db/knexManager').knexProxy;
const { EXPIRE_SETTING } = require('../../../../config/setting');
const { GetAccountMapper } = require("../../../../utils/apiMapper");
const { onlyControlInterface } = require("../../../public/permission")
const { knexTransaction } = require("../../../../utils/tools")
const { insertLog, getLogData } = require("../../../public/operationLog")
const { access_user } = require("../../../../utils/marking");
const moment = require("moment");

async function list(query, userInfo) {
  if (query.interface_id) await onlyControlInterface(query, userInfo);
  let retu = {
    code: 0,
    count: 0,
    data: [],
    page: Number(query.page || 1),
    pagesize: Number(query.pagesize || 20),
  }
  let knexSql = knex(EXPIRE_SETTING).select('*').where('oem_id', userInfo.oem_id || 0)
  if (query.status) {
    knexSql.where('status', query.status)
  } else {
    knexSql.whereIn('status', [1, 2])
  }
  knexSql = handler.searchFilter(knexSql, query);
  let count = await knex.count({ count: "id" }).from(knex.raw(`(${knexSql.toQuery().replace(/`/g, '')}) as t`));
  retu.count = (count.length && count[0]["count"]) || 0;
  knexSql.limit(retu.pagesize).offset((retu.page - 1) * retu.pagesize).orderBy("id", "desc");
  let back = await knexSql
  let accountMapper = await GetAccountMapper();
  retu.data = back.map(item => {
    item.create_user_name = accountMapper[item.create_user_id];
    item.update_user_name = accountMapper[item.update_user_id];
    return item
  })
  return retu
}

async function add(body, userInfo) {
  let { name, advertiser_type, start_date, end_date, days } = body
  if (!name) return Promise.reject('请传入规则名称name')
  if (!advertiser_type) return Promise.reject('请传入应用客户advertiser_type')
  if (!start_date) return Promise.reject('请传入规则开始日期start_date')
  if (!days) return Promise.reject('请传入过期时长days')
  if (days < 2) return Promise.reject('days最小为2')
  let insertObj = {
    name,
    advertiser_type,
    start_date: moment(start_date).format("YYYY-MM-DD"),
    days,
    oem_id: userInfo.oem_id || 1,
    create_user_id: userInfo.id,
    update_user_id: userInfo.id
  }
  if (end_date) insertObj.end_date = moment(end_date).format("YYYY-MM-DD")
  let updateDate = await handler.checkRepeat(insertObj, userInfo, "add")
  // await handler.checkUser(userInfo, '新增')
  let retu = {
    msg: "添加规则成功",
    code: 0,
    data: null
  }
  await knexTransaction(async (trx) => {
    if (updateDate.end_date) {
      if (updateDate.id) {
        await trx(EXPIRE_SETTING).update({ end_date: updateDate.end_date }).where('id', updateDate.id)
        retu.tag = `由于与该项目已有作品周期政策重叠，自动设置ID为[${updateDate.id}]的作品周期政策截止日期为${updateDate.end_date}`
      } else {
        insertObj.end_date = updateDate.end_date
        retu.tag = `由于与该项目已有作品周期政策有效日期重叠，自动设置该条作品周期政策截止日期为${updateDate.end_date}`
      }
    }
    let id = (await trx(EXPIRE_SETTING).insert(insertObj))[0]
    retu.data = id
    await insertLog(trx, getLogData(id, 3021, insertObj, userInfo))
  })
  return retu
}

async function edit(body, userInfo) {
  let { id, name, advertiser_type, start_date, end_date, days } = body
  if (!id) return Promise.reject("请传入要修改的规则ID")
  // await handler.checkUser(userInfo, '编辑')
  let oldData = await knex(EXPIRE_SETTING).select('*').where({ id: body.id, oem_id: userInfo.oem_id || 0 })
  if (!oldData.length) return Promise.reject('未查询到要修改的规则信息')

  let updateObj = {
    update_user_id: userInfo.id,
    name: name || oldData[0].name,
    advertiser_type: advertiser_type || oldData[0].advertiser_type,
    start_date: moment(start_date || oldData[0].start_date).format("YYYY-MM-DD"),

    days: days || oldData[0].days
  }
  if ('end_date' in body) updateObj.end_date = end_date ? moment(end_date).format("YYYY-MM-DD") : null
  let updateDate = await handler.checkRepeat({ ...updateObj, id: id }, userInfo, "edit")

  let retu = {
    msg: "编辑规则成功",
    code: 0,
  }
  await knexTransaction(async (trx) => {
    if (updateDate.end_date) {
      if (updateDate.id) {
        await trx(EXPIRE_SETTING).update({ end_date: updateDate.end_date }).where('id', updateDate.id)
        retu.tag = `由于与该项目已有作品周期政策重叠，自动设置ID为[${updateDate.id}]的作品周期政策截止日期为${updateDate.end_date}`
      } else {
        updateObj.end_date = updateDate.end_date
        retu.tag = `由于与该项目已有作品周期政策有效日期重叠，自动设置该条作品周期政策截止日期为${updateDate.end_date}`
      }
    }
    await trx(EXPIRE_SETTING).update(updateObj).where('id', body.id)
    await insertLog(trx, getLogData(body.id, 3022, updateObj, userInfo, oldData[0]))
  })
  return retu
}

async function del(body, userInfo) {
  if (!body || !body.ids) return Promise.reject("未设置要删除的规则ID(ids)")
  if (!Array.isArray(body.ids)) return Promise.reject('ids为数组，请检查参数')
  // await handler.checkUser(userInfo, '删除')
  let checkData = await knex(EXPIRE_SETTING).select("id", 'status').whereIn("id", body.ids).where("status", "!=", 3).where('oem_id', userInfo.oem_id || 0);
  if (!checkData.length) return Promise.reject("未查询到规则信息");
  await knexTransaction(async (trx) => {
    await trx(EXPIRE_SETTING)
      .update({ status: 3 })
      .whereIn(
        "id",
        checkData.map((i) => i.id)
      )
    let log_data = checkData.map(item => {
      return getLogData(item.id, 3023, { status: 3 }, userInfo, { status: item.status })
    })
    await insertLog(trx, log_data)
  })
  return {
    code: 0,
    data: "删除该规则成功",
  };
}

async function updateStatus(body, userInfo) {
  let { status, id } = body || {}
  if (!id) return Promise.reject('未设置作品周期id')
  if (!status) return Promise.reject('未设置状态status')
  let checkData = await knex(EXPIRE_SETTING).select("*")
    .where("id", id).where('oem_id', userInfo.oem_id || 0)
  if (!checkData.length) return Promise.reject("未查询到作品周期信息");
  let retu = {
    code: 0,
    data: "更新状态成功",
    tag: null
  }
  await knexTransaction(async (trx) => {
    let updateObj = { status: status, update_user_id: userInfo.id }
    if (status == 1) {
      //校验有效期限重复
      let updateDate = await handler.checkRepeat({ ...checkData[0], id: id }, userInfo, "edit")
      //自动闭合有效期限
      if (updateDate.end_date) {
        if (updateDate.id) {
          await trx(EXPIRE_SETTING).update({ end_date: updateDate.end_date }).where('id', updateDate.id)
          retu.tag = `由于与该项目已有作品周期政策时间重叠，自动设置ID为[${updateDate.id}]的作品周期政策截止日期为${updateDate.end_date}`
        } else {
          updateObj.end_date = updateDate.end_date
          retu.tag = `由于与该项目已有作品周期政策时间重叠，自动设置该条作品周期政策截止日期为${updateDate.end_date}`
        }
      }
    }
    await trx(EXPIRE_SETTING).update(updateObj).where('id', id)
    await insertLog(trx, getLogData(id, status == 3 ? 3023 : 3022, { status: status, update_user_id: userInfo.id }, userInfo, { status: checkData[0].status, update_user_id: checkData[0].update_user_id }))
  })
  return retu
}


let handler = {
  searchFilter(knexSql, query) {
    if (query.keyword) {
      knexSql.whereRaw(`name like '${query.keyword}' or id = ${query.keyword}`)
    }
    if (query.dateRange && query.dateRange.length) {
      knexSql.where(`create_time`, ">=", moment(query.dateRange[0] + ' 00:00:00').format("YYYY-MM-DD HH:mm:ss")).andWhere(`create_time`, "<=", moment(query.dateRange[1] + ' 23:59:59').format("YYYY-MM-DD HH:mm:ss"))
    }
    if (query.advertiser_type) {
      knexSql.where('advertiser_type', query.advertiser_type)
    }
    return knexSql;
  },
  //校验是否是超管/access_user
  checkUser(userInfo, type = "新增") {
    let flag = userInfo.role_ids.split(',').includes('1') || access_user.includes(userInfo.id)
    if (!flag) return Promise.reject(`暂无${type}规则权限`)
  },
  //校验日期重复
  async checkRepeat(query = {}, userInfo, type = "add") {
    let checkData = await knex(EXPIRE_SETTING).select('*')
      .where({ advertiser_type: query.advertiser_type, status: 1, oem_id: userInfo.oem_id || 1 })
      .andWhere(builder => {
        if (query.id) builder.where('id', '!=', query.id)
      })
    let updateObj = {}
    //如果已有该项目的作品周期，校验有效起止日期
    if (!checkData.length) return updateObj
    //有相同起始日期直接return
    let newStartDate = query.start_date
    checkData.forEach(item => {
      let oldStart = item.start_date
      let oldEnd = item.end_date
      if ((newStartDate == oldStart) || (newStartDate == oldEnd)) throw new Error('该项目作品周期有效日期有重叠，请检查')
    })
    //查找已有且无结束时间index
    let withoutEndIndex = checkData.findIndex(item => !item.end_date)
    let { id, start_date, end_date } = checkData[withoutEndIndex] || {}

    //如果填了结束时间
    if (query.end_date) {
      //存在无结束时间的数据且新增的开始时间在原有数据开始时间之后，默认写入原有数据结束时间
      if (withoutEndIndex != -1 && start_date < query.start_date) {
        let newDate = query.start_date
        newDate = moment(newDate).subtract(1, 'd').format("YYYY-MM-DD")
        updateObj = {
          id: id,
          end_date: newDate
        }
        checkData[withoutEndIndex].end_date = newDate
      }
      //校验是否有重叠时间
      handler.arrCheck(checkData, query.start_date, query.end_date)
    } else { //如果没有填结束时间找到传入的开始时间之后是否有其他数据（可能有多条）
      let rightItem = checkData.filter(item => (item.start_date > query.start_date))
      if (rightItem.length) {
        //找到右侧最小的开始时间
        let adJoin_start_date = Math.min.apply(null, rightItem.map(item => { return new Date(item.start_date) }))
        let newDate = moment(adJoin_start_date).format("YYYY-MM-DD")
        newDate = moment(newDate).subtract(1, 'd').format("YYYY-MM-DD")
        updateObj = {
          end_date: newDate
        }
        handler.arrCheck(checkData, query.start_date, updateObj.end_date)
      } else {
        //如果右侧没有数据，校验未闭合的旧数据（此时未闭合的数据一定在左侧最后一位，直接自动闭合该条数据）
        if (withoutEndIndex != -1) {
          let newDate = query.start_date
          newDate = moment(newDate).subtract(1, 'd').format("YYYY-MM-DD")
          updateObj = {
            id: id,
            end_date: newDate
          }
          checkData[withoutEndIndex].end_date = newDate
        }
        handler.arrCheck(checkData, query.start_date, query.end_date)
      }
    }
    if (updateObj.end_date) updateObj.end_date = moment(updateObj.end_date).format("YYYY-MM-DD")
    return updateObj
  },
  //校验是否有重叠时间
  arrCheck(checkData, start_data, end_data) {
    for (let i = 0, len = checkData.length; i < len; i++) {
      let item = checkData[i]
      let flag = handler.isDateIntersection(item.start_date, item.end_date, start_data, end_data)
      if (flag) throw new Error('该项目商务报价有效日期有重叠，请检查')
    }
  },
  isDateIntersection(start1, end1, start2, end2) {
    start1 = new Date(start1)
    end1 = new Date(end1)
    start2 = new Date(start2)
    end2 = end2 ? new Date(end2) : null
    if (!end2) {
      if (start1 <= start2 && end1 >= start2) return true
    } else {
      if (start1 >= start2 && start1 <= end2) return true;
      if (end1 >= start2 && end1 <= end2) return true
      if (start1 <= start2 && end1 >= end2) return true
    }
    return false;
  },
}

module.exports = {
  list,
  add,
  edit,
  del,
  updateStatus
}