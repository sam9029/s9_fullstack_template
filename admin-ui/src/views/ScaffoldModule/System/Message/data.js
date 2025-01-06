import {
  setSearchItemOpts,
  mapperToOptions,
  formToOptions,
  renderCount,
  renderPrice,
} from '@/utils/tools.js';
import { MESSAGE_TYPE_MAPPER, MESSAGE_STATUS_MAPPER } from '@/utils/mapper';

export const AUTH_CONFIG = {
  edit: ['system:message:edit'],
  send: ['system:message:send'],
  recall: ['system:message:recall'],
  restore: ['system:message:restore'],
};

export const dropdownsItem = [
  {
    label: '发送',
    command: 'batchSend',
    auth: AUTH_CONFIG.send,
  },
  {
    label: '撤回',
    command: 'batchRecall',
    auth: AUTH_CONFIG.recall,
  },
  {
    label: '删除',
    command: 'batchDelete',
    auth: AUTH_CONFIG.delete,
  },
];

export function initSearch() {
  return {
    model: {
      type: null,
      send_status: null,
    },
    item: [
      {
        genre: 'select',
        label: '消息类型',
        model: 'type',
        options: mapperToOptions(MESSAGE_TYPE_MAPPER),
        clearable: true,
      },
      {
        genre: 'select',
        label: '消息状态',
        model: 'send_status',
        options: mapperToOptions(MESSAGE_STATUS_MAPPER),
        clearable: true,
      },
    ],
  };
}

export const tableItems = [
  {
    label: '序号',
    prop: 'id',
    minWidth: 80,
  },
  {
    label: '消息类型',
    prop: 'message_title',
    minWidth: 150,
    tooltip: true,
  },
  {
    label: '预览',
    prop: 'preview',
    minWidth: 100,
    slots: { customRender: 'custom_preview' },
  },
  {
    label: '消息状态',
    prop: 'send_status',
    minWidth: 120,
    slots: { customRender: 'custom_send_status' },
    // slots:{customRender:(row)=>MESSAGE_STATUS_MAPPER[row.send_status]}
  },
  {
    label: '已读用户数',
    prop: 'read_count',
    minWidth: 120,
    slots: { customRender: (row) => renderCount(row.read_count) },
  },
  {
    label: '未读用户数',
    prop: 'unread_count',
    minWidth: 120,
    slots: { customRender: (row) => renderCount(row.unread_count) },
  },
  {
    label: '发送时间',
    prop: 'send_time',
    minWidth: 150,
  },
  {
    label: '创建人',
    prop: 'create_user_name',
    minWidth: 100,
  },
  {
    label: '创建时间',
    prop: 'create_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' },
  },
  {
    label: '操作人',
    prop: 'sender_user_name',
    minWidth: 100,
  },
  {
    label: '操作时间',
    prop: 'send_time',
    slots: { customRender: 'dateTime' },
    minWidth: 120,
  },
  {
    prop: 'action',
    label: '操作',
    fixed: 'right',
    minWidth: 180,
    actions: [
      {
        label: '编辑',
        onClick: 'handleEdit',
        show: (row) => checkAction('edit', row),
      },
      {
        label: '发送',
        onClick: 'handleSend',
        confirm: (row) => `确定发送消息 ${row.message_title + '(' + row.id + ')'}`,
        show: (row) => checkAction('send', row),
      },
      {
        label: '撤回',
        onClick: 'handleRecall',
        confirm: (row) => `确定撤回消息 ${row.message_title + '(' + row.id + ')'}`,
        show: (row) => checkAction('recall', row),
      },
      {
        label: '删除',
        onClick: 'handleDelete',
        confirm: (row) => `确定删除消息 ${row.message_title + '(' + row.id + ')'}`,
        show: (row) => checkAction('delete', row),
      },
      {
        label: '恢复',
        onClick: 'handleRestore',
        confirm: (row) => `确定恢复消息 ${row.message_title + '(' + row.id + ')'}`,
        show: (row) => checkAction('restore', row),
      },
    ],
  },
];

const actionCondition = {
  send: { status: [1], send_status: [1] },
  recall: { status: [1], send_status: [2] },
  edit: { status: [1], send_status: [1] },
  delete: { status: [1], send_status: [1] },
  restore: { status: [3] },
};

export function checkAction(action, row) {
  const condition = actionCondition[action];
  if (!condition) return true;
  const { send_status, status } = condition;

  if (send_status) {
    if (!send_status.includes(row.send_status)) return false;
  }
  if (status) {
    if (!status.includes(row.status)) return false;
  }
  return true;
}
