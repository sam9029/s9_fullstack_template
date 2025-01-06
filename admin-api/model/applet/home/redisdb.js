const schedule = require('node-schedule');
const { knexTransaction, getUuid } = require("../../../utils/tools");
const { getRedisClient } = require("../../../db/redis");
const knex = require("../../../db/knexManager").knexProxy;
const { COURSE_TABLE, COURSE_LIKE, COURSE_FAVORITE, COURSE_SHARE, COURSE_WATCH } = require("../../../config/setting");
const { isEmpty } = require('../../../utils/check_type');
const RedisCllient = getRedisClient();

class RedisBucket {
  /**@private */
  table = '';
  /**@private */
  log_key = '';
  /**@private */
  count_key = '';
  /**@private */
  unique = true;
  /**@private */
  course_col = "";

  /**@private */
  _job = null;

  constructor(type, schedule = true) {
    const config = RedisBucket.get_config(type);

    this.table = config.table;
    this.unique = config.unique;
    this.log_key = config.base_key + '_log';
    this.count_key = config.base_key + '_count';
    this.course_col = config.course_col;

    if (schedule) {
      // 直接写数据库 可以先clear保证user的count统计正确
      // // this.clear();

      // 先写redis
      //    a. 延迟写入，实时更新user的count => 不需要操作 => 判断是否收藏？
      // nothing...

      //    b. 延迟写入，延迟更新user count => 先写入缓存 => 更新count => 判断是否收藏？
      // this.write_redis_to_db()
      //   .then(this.clear.bind(this))
      //   .then(this.schedule_write.bind(this))
    }

  }

  /**@private */
  static get_config(type) {
    switch (type) {
      case 'like':
        return { table: COURSE_LIKE, base_key: 'xgfx:course:like', unique: true, course_col: 'like_num' };
      case 'favorite':
        return { table: COURSE_FAVORITE, base_key: 'xgfx:course:favorite', unique: true, course_col: 'favorite_num' };
      case 'share':
        return { table: COURSE_SHARE, base_key: 'xgfx:course:share', unique: false, course_col: 'share_num' };
      case 'watch':
        return { table: COURSE_WATCH, base_key: 'xgfx:course:watch', unique: true, course_col: 'watch_num' };
      default:
        throw 'type error'
    }
  }

  async get_user_count(user_id) {
    user_id = String(user_id)
    const redis_count = await RedisCllient.hGet(this.count_key, user_id);
    if (isEmpty(redis_count)) {
      return this.set_default_user_count(user_id);
    }
    return Number(redis_count);
  }

  async write(data, count = false) {
    return this.write_immediately(data, count);

    let buf = data;
    if (typeof buf === 'object') {
      buf = JSON.stringify(buf);
    }
    const key = getUuid() + '_' + Date.now();
    await RedisCllient.hSet(this.log_key, key, buf);
    if (count) {
      await this.write_user_count(buf);
    }
  }

  async clear() {
    this._job && schedule.cancelJob(this._job);
    await RedisCllient.del(this.count_key);
    await RedisCllient.del(this.log_key);

  }

  async write_immediately(data, count = false) {
    const id = await knexTransaction(async trx => {
      // 会触发更改
      delete data.update_time;
      const sql = trx(this.table).insert(data);
      if (this.unique) sql.onConflict(["create_user_id", "course_id"]).merge();
      const id = (await sql)[0];
      
      // 如果merge未更改 不会返回id?? 
      // res: => [0]
      // console.log("id is ", id);
      if (!id) return id;
      
      const course_update = {};
      Reflect.set(course_update, this.course_col, knex.raw(`(SELECT COUNT( p.id ) FROM ${this.table} AS p WHERE p.status = 1 AND p.course_id = course.id)`));
      await trx(`${COURSE_TABLE} as course`)
        .update(course_update)
        .where("id", data.course_id);

      return id
    })

    if (count && id) {
      await this.write_user_count(data);
    }
  }

  /**@private */
  async write_user_count(data) {
    const user_id = String(data.create_user_id);
    let increment = 1;
    if (data.status && data.status != 1) increment = -1;

    const old = await RedisCllient.hGet(this.count_key, user_id);
    if (!old) {
      // 目前先写入数据库 set_default时获取的是最新值
      return this.set_default_user_count(user_id);
    }
    return RedisCllient.hIncrBy(this.count_key, user_id, increment);
  }

  /**@private */
  async set_default_user_count(user_id) {
    const db_raw = await knex(this.table).count("id as count").where({ create_user_id: user_id, status: 1 });
    const count = Number(db_raw[0].count);
    await RedisCllient.hSet(this.count_key, user_id, count);
    return count;
  }


  /**@private */
  schedule_write() {
    // if (process.env.NODE_ENV != "production") return;
    // this._job = schedule.scheduleJob(`*/10 * * * *`, this.write_redis_to_db.bind(this));
  }


  /**@private */
  async write_redis_to_db() {
    const { keys, raws } = await this.redis_to_db_raws();
    if (!raws.length) return;

    await knexTransaction(async trx => {
      const cap = 3000;
      const iter = Math.ceil(raws.length / cap);

      for (let i = 0; i < iter; i++) {
        const start = i * cap;
        const end = (i + 1) * cap;
        const insert = raws.slice(start, end);
        await this.write_raws_to_db(trx, insert);
      }
    })

    if (keys.length) {
      await RedisCllient.hDel(this.log_key, keys);
    }
  }

  /**@private */
  async redis_to_db_raws() {
    const map = await RedisCllient.hGetAll(this.log_key);

    const raws = [];
    const redis_keys = [];

    const unique_map = new Map();
    for (const [redis_key, json_str] of Object.entries(map)) {
      // console.log('redis key is: ', redis_key);
      redis_keys.push(redis_key);
      const item = JSON.parse(json_str);
      if (this.unique) {
        const unique_key = `${item.create_user_id}_${item.course_id}`;
        if (!unique_map.has(unique_key) || unique_map.get(unique_key).update_time < item.update_time) {
          unique_map.set(unique_key, item);
        }
      } else {
        raws.push(item);
      }
    }
    if (this.unique) {
      for (const item of unique_map.values()) {
        raws.push(item);
      }
    }

    return { keys: redis_keys, raws };
  }

  /**
   * @private
   * @param {knex} trx 
   * @param {any[]} raws 
   */
  async write_raws_to_db(trx, raws) {
    if (!raws.length) return;
    const sql = trx(this.table).insert(raws);
    if (this.unique) sql.onConflict(["create_user_id", "course_id"]).merge();
    await sql;

    const course_ids = raws.map(v => v.course_id);
    const course_update = {};
    Reflect.set(course_update, this.course_col, knex.raw(`(SELECT COUNT( p.id ) FROM ${this.table} AS p WHERE p.status = 1 AND p.course_id = course.id)`));
    await trx(`${COURSE_TABLE} as course`)
      .update(course_update)
      .whereIn("id", course_ids)
      .andWhere("verify_status", 3);
  }

}


module.exports = RedisBucket;