import moment from 'moment';
import { mapperToOptions } from '@/utils/tools.js';

import { VERIFY_MAPPER as V_M } from '@/utils/mapper.js';
export const VERIFY_MAPPER = V_M;

// 权限
export const AUTHCONFIG = {
  edit: ['project:report:edit'], // 新增/编辑
  operation: ['project:report:operation'], //开启/终止
  del: ['project:report:delete'], //删除
  // submit: ["project:report:submit"], //提交
  // verify: ["project:report:verify"], //通过/拒绝
  // stop: ["project:report:stop"], //终止
  // restore: ["project:report:restore"], //恢复
};

// 批量操作按钮
export const AuthDropDownItem = [
  {
    command: 'open',
    // disabled:'',
    label: '批量开启',
    auth: AUTHCONFIG.operation,
  },
  {
    command: 'stop',
    label: '批量终止',
    auth: AUTHCONFIG.operation,
  },
  {
    command: 'delete',
    label: '批量删除',
    auth: AUTHCONFIG.del,
  },
];

// 检索配置
/**
 * @param {*} vm 环境变量
 */
export function initSearchConfig(vm) {
  // 搜索配置-初始日期
  const today = moment().format('YYYY-MM-DD');
  const lastSeven = moment().subtract(30, 'd').format('YYYY-MM-DD');

  let config = [
    {
      genre: 'input',
      label: '项目名称：',
      model: 'keyword',
      clearable: true,
    },
    {
      genre: 'select',
      label: '业务类型：',
      placeholder: '不限',
      model: 'type',
      options: [],
      type: 'primary',
      clearable: true,
    },
    {
      genre: 'daterange',
      label: '周期：',
      placeholder: '不限',
      model: 'date_range',
      options: [],
      clearable: true,
    },
    {
      genre: 'select',
      label: '审核状态：',
      placeholder: '不限',
      model: 'verify_status',
      options: mapperToOptions(VERIFY_MAPPER),
      clearable: true,
    },
    // 远程搜索
    {
      genre: 'selectRemoteSearch',
      model: 'remoteSearch',
      label: '远程搜索：',
      placeholder: '请选择',
      options: [],
      remoteEvent: vm.handleRemoteSearch, // 在 method的 定义函数
      // tip_key: 'account_type', //UN--指定显示返回数据对象的哪一个属性
    },
  ];

  return {
    model: {
      keyword: '',
      type: '',
      promote_method: '',
      date_range: [lastSeven, today],
      remoteSearch: '',
      verify_status: '',
    },
    item: config,
  };
}

// 列配置
export const columns = [
  {
    show: true,
    label: 'ID',
    prop: 'id',
    minWidth: 120,
  },
  {
    show: true,
    label: '测试',
    prop: 'name',
    minWidth: 120,
  },
  // {
  //   label: "审批流",
  //   prop: "",
  //   slots: { customRender: "verify_process" },
  //   minWidth: 120,
  // },
  {
    label: '创建人',
    prop: 'create_user_name',
    minWidth: 120,
  },
  {
    label: '创建日期',
    prop: 'create_time', // 13位数 毫秒格式
    slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
    minWidth: 120,
  },
  {
    label: '操作',
    prop: 'action',
    fixed: 'right',
    width: 180,
    actions: [
      {
        label: '编辑',
        onClick: 'handleRowEdit',
        auth: AUTHCONFIG.edit,
        // show: (row) => checkAction("edit", row),
        // disabled: (row) => checkActionDisabled('edit', row),
      },
      {
        label: '删除',
        onClick: 'handleRowDel',
        confirm: (row) => `确认删除 ${row.id}`,
        auth: AUTHCONFIG.del,
        // show: (row) => checkAction("del", row),
        // disabled: (row) => checkActionDisabled('del', row),
      },
      {
        label: '启用',
        onClick: 'handleRowOpen',
        confirm: (row) => `确认启用 ${row.id}`,
        auth: AUTHCONFIG.open,
        // show: (row) => checkAction("open", row),
        // disabled: (row) => checkActionDisabled('open', row),
      },
      {
        label: '停用',
        onClick: 'handleRowStop',
        confirm: (row) => `确认停用 ${row.id}`,
        auth: AUTHCONFIG.stop,
        // show: (row) => checkAction("stop", row),
        // disabled: (row) => checkActionDisabled('stop', row),
      },
      // {
      //   label: "恢复",
      //   onClick: "handleRowRestore",
      //   confirm: (row) => `确认恢复 ${row.id}`,
      //   auth: AUTHCONFIG.restore,
      //   show: (row) => checkAction("restore", row),
      // disabled: (row) => checkActionDisabled('restore', row),

      // },
      // {
      //   label: "提交审核",
      //   onClick: "handleRowSubmit",
      //   confirm: (row) => `确认提交 ${row.id}`,
      //   auth: AUTHCONFIG.submit,
      //   show: (row) => checkAction("submit", row),
      // disabled: (row) => checkActionDisabled('submit', row),

      // },
      // {
      //   label: "通过",
      //   onClick: "handleRowPass",
      //   confirm: (row) => `确认通过 ${row.id}`,
      //   auth: AUTHCONFIG.pass,
      //   show: (row) => checkAction("pass", row),
      // disabled: (row) => checkActionDisabled('pass', row),

      // },
      // {
      //   label: "拒绝",
      //   onClick: "handleRowReject",
      //   auth: AUTHCONFIG.reject,
      //   show: (row) => checkAction("reject", row),
      // disabled: (row) => checkActionDisabled('reject', row),

      // },
    ],
  },
];

//#region =====  操作权限检测枚举
//  * verify_status* 审核状态：1：未提交 2：审核中，3：审核通过，4：审核拒绝
//  * status* 状态：1：启用 2：停用，3：删除，
//  */
// const actionCondition = {
//   edit: { verify_status: [1, 4], status: [1] },
//   // 状态
//   open: { verify_status: [3], status: [2] },
//   stop: { verify_status: [3], status: [1] },
//   del: { verify_status: [1, 4], status: [1, 2] },
//   restore: { status: [3] },
//   // 审核状态
//   submit: { verify_status: [1, 4, 5], status: [1, 2] },
//   reject: { verify_status: [2], status: [1, 2] },
//   pass: { verify_status: [2], status: [1, 2] },
// };
//#endregion

//#region =====  /* 操作权限检测函数 */
// export function checkAction(action, row) {
//   const condition = actionCondition[action];
//   if (!condition) return true;
//   const { verify_status, status } = condition;
//   if (status) {
//     if (!status.includes(row.status)) return false;
//   }
//   if (verify_status) {
//     if (!verify_status.includes(row.verify_status)) return false;
//   }
//   return true;
// }

// function isCreateUser(row) {
//   return row.create_user_id == row.curr_account_id || row.curr_account_id == 10000001;
// }

// function isApprovalUser(row) {
//   return row.next_account_id == row.curr_account_id || row.curr_account_id == 10000001;
// }

// export function checkActionDisabled(action, row) {
//   if (['submit', 'edit', 'open', 'stop', 'del'].includes(action)) {
//     if (!isCreateUser(row)) return true;
//   }
//   if (['pass', 'reject'].includes(action)) {
//     if (!isApprovalUser(row)) return true;
//   }
//   return false;
// }
//#endregion

