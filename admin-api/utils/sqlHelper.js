const { getDaysBetweenDate } = require("./tools");

const knex = require("../db/knexManager").knexProxy

/** @typedef { import("knex").Knex.QueryBuilder<any, unknown[]> } Knex*/

//获取当前数据表的site_id,即最新数据ID，防止数据混乱
async function getTableSite(table = '', filed = 'id') {
  if (!table) return
  let data = (await knex(table).max(`${filed} as site`).limit(1))[0]
  return data?.site
}

/**
 * @param { Knex } sql
 */
function sqlPagination(sql, pagination) {
  sql.limit(pagination.pagesize)
    .offset((pagination.page - 1) * pagination.pagesize);
  return sql;
}

/**
 * @param { Knex } trx
 */
async function sqlCount(trx, sql, count_prop = 'id') {
  // ${sql} == sql.toString();
  const count_raw = await trx.count({ count: `t.${count_prop}` }).from(knex.raw(`(${sql}) as t`));
  return count_raw[0]?.count || 0;
}

/**
 * @param { Knex } sql
 */
function queryIfWhere(sql, filed, value) {
  const is_none = value === undefined || value === null || value === '';
  if (!is_none) {
    return sql.where(filed, value);
  }
  return sql;
}

/**
 * @param { Knex } sql
 */
function query_like_where(sql, fileds, keyword) {
  const kwd = keyword?.trim();
  if (kwd) {
    sql.where(builder => {
      for (let i = 0; i < fileds.length; i++) {
        if (i == 0) {
          builder.where(fileds[i], "like", `${kwd}%`)
        } else {
          builder.orWhere(fileds[i], "like", `${kwd}%`)
        }
      }
    })
  }
  return sql;
}

/**
 * @param { Knex } sql
 */
function query_dates_wherein(sql, filed, dates) {
  const is_none = dates === undefined || dates === null || dates === '';
  if (is_none) return sql;
  if (Array.isArray(dates)) {
    if (dates.length) {
      sql.whereIn(filed, getDaysBetweenDate(dates[0], dates[1]))
    }
  } else {
    sql.where(filed, dates)
  }
  return sql;
}

/**
 * @param { Knex } sql
 */
function query_dates_between(sql, filed, datetimes) {
  if (Array.isArray(datetimes) && datetimes.length) {
    sql.where(builder => {
      builder.where(filed, ">=", moment(datetimes[0]).startOf('day').format("YYYY-MM-DD HH:mm:ss"))
        .where(filed, "<=", moment(datetimes[1]).endOf('day').format("YYYY-MM-DD HH:mm:ss"))
    })
  }
  return sql;
}

/**
 * @param { Knex } sql
 */
function query_json_contains(sql, filed, contains) {
  const json_val = (val) => {
    if (typeof val == "number" || /^\d+$/.test(val)) {
      return `'${val}'`
    } else {
      return `'${JSON.stringify(val)}'`
    }
  }
  const is_none = val => val === undefined || val === null || val === '';

  if (!Array.isArray(contains)) {
    if (!is_none(contains)) {
      sql.whereRaw(`JSON_CONTAINS(${filed}, ${json_val(contains)})`)
    }
  } else {
    sql.where(builder => {
      for (let i = 0; i++; i < contains.length) {
        if (i == 0) {
          builder.whereRaw(`JSON_CONTAINS(${filed}, ${json_val(contains[i])})`)
        } else {
          builder.orWhereRaw(`JSON_CONTAINS(${filed}, ${json_val(contains[i])})`)
        }
      }
    })
  }

  return sql;
}

/**
 * 获取当前查询数据的site
 * @param {any[]} [data=[]] 分页查询出来的数据
 * @param {number} [pagesize=20] 当前分页大小，默认20
 * @param {string} [filed='id'] 数据内item key，默认 'id'
 * 
 */
function get_next_page_site(data = [], pagesize = 20, filed = 'id') {
  if (!data || !data?.length) return null
  if (data?.length < pagesize) return null //查询的条数小于分页数量，说明没有下一页了
  let data_item = data[data.length - 1]
  if (!data_item) throw new Error('分页数据格式错误！')
  if (!Object.hasOwnProperty.call(data_item, filed)) throw new Error('filed字段错误！')
  return data_item[filed];
}
module.exports = {
  getTableSite,
  sqlPagination,
  sqlCount,
  queryIfWhere,
  queryLikeWhere: query_like_where,
  queryDatesWhereIn: query_dates_wherein,
  queryDatesBetween: query_dates_between,
  queryJsonContains: query_json_contains,
  getNextPageSite: get_next_page_site
}