const moment = require("moment");
const knex = require("../db/knexManager").knexProxy;
const { APPROVAL_TABLE, PROMOTED } = require("../config/setting");
const { isEmpty, checkKeys, isObject } = require("./check_type")
const { getLogData, insertLog } = require("../model/public/operationLog");
const { access_user } = require("./marking")
const { sleep } = require("./tools")
const { RK_SETTLE_APPROVAL_LOCK } = require('../config/redis_key')
const { delCustomCache, getRedisClient } = require("../db/redis")
const lodash = require('lodash')
/**
 * @typedef { Object } ApprovalConfig
 * @property { string } [data_table] 需要审批的数据表
 * @property { number } [log_type] 日志类型
 * @property { number } [approval_type] 审批流类型
 * @property { string[] } [cols]
 */

/**
 * @typedef { Object } dataAawConfig
 * @property { string } [approval_process_info] 需要审批的数据表
 * @property { number } [id] 当前数据的ID
 * @property { number } [approval_process] 审批流类型
 * @property { number } [create_user_id] 审批流数据创建人
 * @property { number } [next_account_id] 下一位审批人
 * @property { number } [verify_status] 数据的审批状态 1：未提交 2：审核中，3：审核通过，4：审核拒绝，5:已召回 6: 已过期
 */

class ApprovalLockUtil {
  data_table = "";
  // trx = knex;
  log_type = 0;
  approval_type = null
  userinfo = null;

  config = [];
  locked_ids = []

  /**@private */
  _init = false;
  _cloums = ['approval_process_info', 'id', 'approval_process', 'create_user_id', 'next_account_id', 'verify_status', 'current_step']
  _table_lock = ''
  _lock_time = 6000 //锁时间为6000秒
  _init_loading = false
  _batch_size = 5 //批量审批时，同时操作数据量

  /**
   * @param {ApprovalConfig} opts 
   */
  constructor(opts) {
    checkKeys(opts, ['data_table', 'approval_type'])
    if (opts) {
      this.data_table = opts.data_table;
      this.log_type = opts.log_type;
      this.approval_type = opts.approval_type
      this._table_lock = `${RK_SETTLE_APPROVAL_LOCK}:${opts.data_table}`
      this._cloums.push(...(opts.cols || []))
    }
  }

  async init(userinfo, trx = knex) {
    if (this._init) return this;
    if (this._init_loading) {
      await sleep(400)
      return this.init(userinfo, trx)
    }
    this._init_loading = true
    this.userinfo = userinfo;
    const approval_raw = (await trx(APPROVAL_TABLE).select("id", "config")
      .where({ type: this.approval_type, status: 1, oem_id: userinfo.oem_id }).orderBy("id", "desc").limit(1))[0];
    this._init_loading = false
    if (!approval_raw?.config) throw "未建立审批流，请创建好审批流后再进行提交审核！";
    const approval_config = JSON.parse(approval_raw.config);
    if (!approval_config?.length) throw "审批流信息异常！";
    this.config = approval_config;
    this._init = true;
    return this;
  }



  /**
    * @param { dataAawConfig | number } [data_raw] 可以为object，为object 时会触发key校验，也可以为某条数据的ID
    * @param {boolean} [default_release_lock=true] 是否默认释放数据锁，默认释放，根据外部需求，可以在外部释放锁
    * @param {string} [verify_suggest=''] 拒绝时的审核建议
    * @param {number} [verify_status=0] 数据操作的审核状态
    */
  async approval(data_raw, verify_status = 0, verify_suggest = '', userinfo = {}, default_release_lock = true, trx) {
    if (!trx) throw "审核请进行事务操作！";
    if (!this._init) await this.init(userinfo, trx)

    if (isObject(data_raw)) {
      if (verify_status != 2) checkKeys(data_raw, this._cloums);
    }
    else data_raw = await this.get_data_raw(data_raw, trx)


    switch (Number(verify_status)) {
      case 2: // 审核中
        await this.get_data_lock(data_raw.id) //给操作数据尝试加锁，若该数据已存在锁，报错！
        return await this.approval_submit(data_raw, verify_status, verify_suggest, trx).finally(async () => {
          default_release_lock && (await this.release_lock(data_raw.id))
        })
      case 3: // 审核通过
      case 4: // 审核拒绝
      case 5: // 召回
        await this.get_data_lock(data_raw.id) //给操作数据尝试加锁，若该数据已存在锁，报错！
        return await this.approval_verify(data_raw, verify_status, verify_suggest, trx, userinfo).finally(async () => {
          default_release_lock && (await this.release_lock(data_raw.id))
        })
      default:
        throw "审核状态类型错误！";
    }
  }

  /**
    * @param {any[dataAawConfig | number]} [raws=[]] 
    * @param {boolean} [default_release_lock=true] 是否默认释放数据锁，默认释放，根据外部需求，可以在外部释放锁
    * @param {string} [verify_suggest=''] 拒绝时的审核建议
    * @param {number} [verify_status=0] 数据操作的审核状态
    */
  async batch_approval(raws = [], verify_status, verify_suggest, userinfo = {}, default_release_lock = true, trx) {
    const success = [];
    const fails = [];
    if (!raws?.length) throw "未设置审批数据！";
    let chunk_array = lodash.chunk(raws, this._batch_size)

    for (let index = 0; index < chunk_array.length; index++) {
      let group_data = chunk_array[index];
      let all_array = group_data.map(async element => {
        return await this.approval(element, verify_status, verify_suggest, userinfo, default_release_lock, trx).then(data_raw => {
          success.push(data_raw?.id);
        }).catch(err => {
          fails.push({ id: element?.id || element, message: String(err.message || err || "审核失败！") });
        })
      })
      await Promise.all(all_array)
    }
    return { success, fails }
  }
  /**
   * @param {number} id 数据ID，若设置数据ID，则释放单条数据，若不设置数据ID，则全部释放
   */
  async release_lock(id = null) {
    if (id) {
      let lock_key = `${this._table_lock}:${id}`
      if (!this.locked_ids.includes(lock_key)) return //该ID不存在时，不会释放该ID，防止越界操作
      return await delCustomCache([lock_key])
    }
    await delCustomCache(this.locked_ids)
  }

  /**
   * @param {null} [id=null] 单条数据的ID 
   * @returns {Promise<dataAawConfig>} 返回单条数据的审批信息
   */
  async get_data_raw(id = null, trx) {
    let data_raw = (await trx(this.data_table).select(this._cloums).where('id', id))[0]
    if (!data_raw) throw "审核数据不存在！";
    return data_raw
  }
  /**
   * @param {null} [id=null] 数据ID
   */
  async get_data_lock(id = null) {
    if (!id) throw "数据锁元数据不存在！";
    let lock_key = `${this._table_lock}:${id}`
    if (await getRedisClient().set(lock_key, 'LOCKED', { EX: this._lock_time, NX: true })) {
      this.locked_ids.push(lock_key)
      return true
    }
    throw "数据正在审批中，请稍后再试！";
  }


  /**
   * @private
   */
  async approval_submit(data_raw, verify_status, verify_suggest, trx) {
    if (![1, 4, 5].includes(data_raw.verify_status)) throw "该数据已提交，请勿重复操作！";
    const update_obj = this.get_submit_info(data_raw);

    await this.exec_hook("before_update", update_obj, data_raw, verify_status, verify_suggest, trx);

    update_obj.approval_process = ApprovalLockUtil.set_json(update_obj.approval_process);
    update_obj.approval_process_info = ApprovalLockUtil.set_json(update_obj.approval_process_info);

    await this.exec_hook("on_update", update_obj, data_raw, trx);

    await this.exec_hook("after_update", update_obj, data_raw, trx);

    return data_raw
  }

  /**@private */
  get_submit_info(data_raw) {
    const process_info = ApprovalLockUtil.parse_json(data_raw?.approval_process_info) || [];
    process_info.push({
      verify_status: 2,
      create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      user_id: this.userinfo.id,
      user_name: this.userinfo.name || "未知用户",
      step: 0,
    });

    const people_info = this.config[0];
    const update_obj = {
      verify_status: 2,
      next_account_id: people_info.id,
      total_step: this.config.length,
      current_step: 0,
      approval_process: this.config,
      approval_process_info: process_info,
    };
    if (data_raw?.settle_status)
      update_obj.settle_status = 2;

    return update_obj;
  }

  /**
   * @private
   */
  async approval_verify(data_raw, verify_status, verify_suggest, trx, userinfo) {
    if (![3, 4, 5].includes(verify_status)) throw "审核状态错误！";
    if (data_raw.verify_status != 2) throw "该审批数据未提交或已审核，无法重新审核！";
    this.check_approval_account(data_raw, verify_status);

    const { current_step } = data_raw;
    const process_info = ApprovalLockUtil.parse_json(data_raw.approval_process_info) || [];
    const approval_process = ApprovalLockUtil.parse_json(data_raw.approval_process) || [];
    const total_step = approval_process.length;

    const process_item = approval_process[current_step] || {};
    const create_time = moment().format("YYYY-MM-DD HH:mm:ss")
    const process_info_item = {
      create_time,
      user_id: this.userinfo.id,
      user_name: this.userinfo.name,
      verify_status,
      step: current_step,
      verify_suggest,
      ...process_item
    };
    process_info.push(process_info_item);

    const update_obj = {
      approval_process_info: process_info, total_step
    };

    switch (verify_status) {
      case 3: // 通过
        const new_step = current_step + 1;
        // update_obj.verify_feedback_time = create_time 
        // async before_update(update_obj) { update_obj.verify_feedback_time = ... }
        update_obj.current_step = new_step;
        update_obj.next_account_id = approval_process[new_step]?.id || null;
        if (new_step == total_step) { // 全部通过
          update_obj.verify_status = 3
          update_obj.verify_suggest = null;
          if (data_raw.settle_status) update_obj.settle_status = 3;
        }
        break;
      case 4: // 拒绝
        // update_obj.verify_feedback_time = create_time 
        // async before_update(update_obj) { update_obj.verify_feedback_time = ... }
        update_obj.verify_status = 4
        update_obj.verify_suggest = verify_suggest;
        update_obj.current_step = null
        update_obj.next_account_id = null;
        break;
      case 5: // 召回
        // update_obj.verify_feedback_time = null
        // async before_update(update_obj) { update_obj.verify_feedback_time = ... }
        update_obj.verify_status = 5
        update_obj.verify_suggest = verify_suggest;
        update_obj.current_step = null
        update_obj.next_account_id = null;
        break;
      default:
        throw "设置审核状态错误！";
    }

    await this.exec_hook("before_update", update_obj, data_raw, verify_status, verify_suggest, trx, userinfo);

    update_obj.approval_process_info = ApprovalLockUtil.set_json(update_obj.approval_process_info);

    await this.exec_hook("on_update", update_obj, data_raw, trx, userinfo);

    await this.exec_hook("after_update", update_obj, data_raw, trx, userinfo);

    return data_raw
  }

  /**
   * @private
   */
  check_approval_account(data_raw, verify_status) {
    const user_id = this.userinfo.id;
    if (access_user.includes(user_id)) return;
    // 审核
    if (verify_status != 5) {
      if (data_raw.next_account_id != user_id) throw "非审批人操作！"
    } else {
      // 召回
      if (data_raw.create_user_id && data_raw.create_user_id != user_id) throw "非创建人操作！"
    }
  }

  /**
   * @private
   */
  async exec_hook(hook, ...args) {
    /**@type { Function? } */
    const hook_fn = this[hook];
    if (!hook_fn) return false;
    const r = hook_fn.call(this, ...args);
    if (typeof r == "function" && r.then) {
      return await r;
    }
    return r;
  }

  /**
   * @abstract
   */
  async before_update(update_obj, data_raw, verify_status, verify_suggest, trx, userinfo) {
    // do something...
  }

  // 默认提供实现 修改当前表数据并记录日志
  // 可重载自定义实现
  /**
   * @abstract
   */
  async on_update(update_obj, data_raw, trx, userinfo) {
    await trx(this.data_table).update(update_obj).where("id", data_raw.id);

    if (this.log_type) {
      await insertLog(trx, getLogData(data_raw.id, this.log_type, update_obj, this.userinfo, data_raw));
    }
  }

  /**
   * @abstract
   */
  async after_update(update_obj, data_raw, trx, userinfo) {
    // do something...
  }

  static parse_json(json_str) {
    if (isEmpty(json_str)) return null;
    if (typeof json_str != 'string') return json_str;
    return JSON.parse(json_str);
  }

  static set_json(json_obj) {
    if (isEmpty(json_obj, true)) return null;
    return JSON.stringify(json_obj);
  }
}

module.exports = ApprovalLockUtil
// let newClass = new ApprovalLockUtil({ data_table: PROMOTED })
