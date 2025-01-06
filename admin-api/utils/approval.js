const moment = require("moment");
const knex = require("../db/knexManager").knexProxy;
const { APPROVAL_TABLE } = require("../config/setting");
const { isEmpty } = require("./check_type")
const { getLogData, insertLog } = require("../model/public/operationLog");
const { access_user } = require("./marking")
const { knexTransaction } = require("./tools")

/**
 * @typedef { Object } ApprovalConfig
 * @property { string } [data_table]
 * @property { knex } [trx]
 * @property { number } [log_type]
 */

class ApprovalUtil {
  data_table = "";
  trx = knex;
  userinfo = null;
  log_type = 0;
  config = [];

  /**@private */
  _init = false;

  /**
   * @param { ApprovalConfig } [opts]
   */
  constructor(opts) {
    if (opts) {
      this.trx = opts.trx || knex;
      this.data_table = opts.data_table;
      this.log_type = opts.log_type;
    }
  }

  async init(approval_type, userinfo) {
    this._init = true;
    this.userinfo = userinfo;
    const approval_raw = (
      await this.trx(APPROVAL_TABLE)
        .select("id", "config")
        .where({ type: approval_type, status: 1, oem_id: userinfo.oem_id })
        .orderBy("id","desc")
        .limit(1)
    )[0];

    if (!approval_raw?.config)
      throw "未建立审批流，请创建好审批流后再进行提交审核！";
    const approval_config = JSON.parse(approval_raw.config);
    if (!approval_config.length) throw "审批流信息异常！";
    this.config = approval_config;
    return this;
  }




  async approval(data_raw, verify_status, verify_suggest) {
    if (!this._init) throw "need call init() before approval";
    verify_status = Number(verify_status);
    if (isNaN(verify_status)) throw "审核状态类型错误！";
    // 提交
    if (verify_status == 2) {
      return this.approval_submit(data_raw, verify_status, verify_suggest)
    } else {
      return this.approval_verify(data_raw, verify_status, verify_suggest)
    }
  }

  async batch_approval(raws, verify_status, verify_suggest) {
    const success = [];
    const fails = [];
    const last_trx = this.trx;

    for (let i = 0; i < raws.length; i++) {
      try {
        // 每一条数据处理 开启一次事务 失败回滚操作
        // 不使用内部事务 可以在外部 loop 调用 approval
        await knexTransaction(async trx => {
          this.trx = trx;
          await this.approval(raws[i], verify_status, verify_suggest);
          success.push(raws[i].id);
        })
      } catch (err) {
        const err_msg = err.message || err || "审核失败！";
        fails.push({ id: raws[i].id, message: err_msg });
      }
    }
    this.trx = last_trx;

    return { success, fails }
  }
  
  /**
   * @private
   */
  async approval_submit(data_raw, verify_status, verify_suggest) {
    if (![1, 4, 5].includes(data_raw.verify_status)) throw "该数据已提交，请勿重复操作！";
    const update_obj = this.get_submit_info(data_raw);

    await this.exec_hook("before_update", update_obj, data_raw, verify_status, verify_suggest);

    update_obj.approval_process =  ApprovalUtil.set_json(update_obj.approval_process);
    update_obj.approval_process_info =  ApprovalUtil.set_json(update_obj.approval_process_info);

    await this.exec_hook("on_update", update_obj, data_raw);

    await this.exec_hook("after_update", update_obj, data_raw);
  }

  /**@private */
  get_submit_info(data_raw) {
    const process_info = ApprovalUtil.parse_json(data_raw?.approval_process_info) || [];
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

    return update_obj;
  }

  /**
   * @private
   */
  async approval_verify(data_raw, verify_status, verify_suggest) {
    if (![3, 4, 5].includes(verify_status)) throw "审核状态错误！";
    if (data_raw.verify_status != 2) throw "该审批数据未提交或已审核，无法重新审核！";
    this.check_approval_account(data_raw, verify_status);

    const { current_step } = data_raw;
    const process_info =  ApprovalUtil.parse_json(data_raw.approval_process_info) || [];
    const approval_process =  ApprovalUtil.parse_json(data_raw.approval_process) || [];
    const total_step = approval_process.length;

    const process_item = approval_process[current_step] || {};
    const process_info_item = {
      create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
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

    switch(verify_status) {
      case 3: // 通过
        const new_step = current_step + 1;
        update_obj.current_step = new_step;
        update_obj.next_account_id = approval_process[new_step]?.id || null;
        if (new_step == total_step) { // 全部通过
          update_obj.verify_status = 3
          update_obj.verify_suggest = null;
        }
        break;
      case 4: // 拒绝
        update_obj.verify_status = 4
        update_obj.verify_suggest = verify_suggest;
        update_obj.current_step = null
        update_obj.next_account_id = null;
        break;
      case 5: // 召回
        update_obj.verify_status = 5
        update_obj.verify_suggest = verify_suggest;
        update_obj.current_step = null
        update_obj.next_account_id = null;
        break;
      default:
        throw "设置审核状态错误！";
    }

    await this.exec_hook("before_update", update_obj, data_raw, verify_status, verify_suggest);

    update_obj.approval_process_info =  ApprovalUtil.set_json(update_obj.approval_process_info);

    await this.exec_hook("on_update", update_obj, data_raw);

    await this.exec_hook("after_update", update_obj, data_raw);
  }

  /**
   * @private
   */
  check_approval_account(data_raw, verify_status) {
    const user_id = this.userinfo.id;
    if (access_user.includes(user_id)) return;
    // 审核
    if (verify_status != 5) {
      if (data_raw.next_account_id != user_id) {
        throw "非审批人操作！"
      }
    } else {
      // 召回
      if (data_raw.create_user_id) {
        if (data_raw.create_user_id != user_id) throw "非创建人操作！"
      }
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
   * @implements
   * @private
   */
  async before_update(update_obj, data_raw, verify_status, verify_suggest) {
    // do something...
  }

  // 默认提供实现 修改当前表数据并记录日志
  // 可重载自定义实现
  /**
   * @implements
   * @private
   */
  async on_update(update_obj, data_raw) {
    await this.trx(this.data_table)
      .update(update_obj)
      .where("id", data_raw.id);
      
    if (this.log_type) {
      await insertLog(this.trx, getLogData(data_raw.id, this.log_type, update_obj, this.userinfo, data_raw));
    }
  }

  /**
   * @implements
   * @private
   */
  async after_update(update_obj, data_raw) {
    // do something...
  }

  static parse_json(json_str) {
    if(isEmpty(json_str)) return null;
    if (typeof json_str != 'string') return json_str;
    return JSON.parse(json_str);
  }
  
  static set_json(json_obj) {
    if(isEmpty(json_obj, true)) return null;
    return JSON.stringify(json_obj);
  }
}



module.exports = ApprovalUtil