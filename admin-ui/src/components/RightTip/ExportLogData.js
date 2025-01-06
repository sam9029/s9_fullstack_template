import moment from "moment";
import store from '@/store';
import { mapperToOptions } from '@/utils/tools'

export const EXPORT_STATUS = {
  1: '等待中',
  2: '导出中',
  3: '导出完成',
  4: '导出失败'
}

export function initSearch() {
  const today = moment().format('YYYY-MM-DD');
  const model = {
    export_status: null,
    create_date: today,
    create_user_id: null,
  };

  const item = [
    {
      genre: 'select',
      label: '导出状态：',
      model: 'export_status',
      options: mapperToOptions(EXPORT_STATUS),
    },
    {
      genre: 'day',
      label: '创建时间：',
      model: 'create_date',
    },
  ]

  // const account_type = store.getters.accountType;
  // if (account_type == 3) {
  //   item.push({
  //     genre: 'select-user',
  //     model: 'create_user_id',
  //     label: '创建人：',
  //     clearable: true,
  //     params: { pagesize: 50 },
  //   })
  // }

  return { model, item }
}

export const tableItems = [
  {
    label: '任务ID',
    prop: 'id',
    width: 70,
  },
  {
    label: '任务名称',
    prop: 'task_name',
    minWidth: 150,
  },
  {
    label: '任务状态',
    prop: 'export_status',
    minWidth: 100,
    slots: { customRender: 'export_status' },
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
    // slots: { customRender: 'dateTime' },
  },
  {
    label: '完成时间',
    prop: 'update_time',
    minWidth: 120,
    // slots: { customRender: 'dateTime' },
  },
  {
    show: true,
    fixed: 'right',
    label: '操作',
    width: 80,
    prop: 'action',
    actions: [
      {
        label: '下载',
        onClick: 'download',
        disabled: row => row.export_status != 3
      },
    ]
  }
]