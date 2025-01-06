export const columns = [
  {
    label: '主体ID',
    prop: 'id',
    minWidth: 80,
  },
  {
    label: '主体名称',
    prop: 'name',
    tooltip: true,
    minWidth: 150,
  },
  // {
  //   label: '开户行',
  //   prop: 'bank',
  //   tooltip: true,
  //   minWidth: 150,
  // },
  // {
  //   label: '开户行账号',
  //   prop: 'bank_no',
  //   tooltip: true,
  //   minWidth: 150,
  // },
  {
    label: '每月上限',
    prop: 'money_upper',
    tooltip: true,
    minWidth: 150,
  },
  {
    label: '当前费率（%）',
    prop: 'rate',
    tooltip: true,
    minWidth: 150,
  },
  // {
  //   label: '项目名称',
  //   prop: 'advertiser_types_name',
  //   minWidth: 150,
  //   slots: { customRender: 'advertiser_types_name' },
  // },
  {
    label: '启用状态',
    prop: 'flag',
    minWidth: 100,
    auth: ['sys:config:recivingcompany:edit'],
    slots: { customRender: 'switch' },
  },
  {
    label: '创建者',
    prop: 'create_user_name',
    minWidth: 100,
  },
  {
    label: '创建时间',
    prop: 'create_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
  },
  {
    label: '更新建者',
    prop: 'update_user_name',
    minWidth: 100,
  },
  {
    label: '更新时间',
    prop: 'update_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
  },
  {
    prop: 'action',
    label: '操作',
    fixed: 'right',
    width: 100,
    minWidth: 100,
    actions: [
      {
        label: '修改',
        auth: ['sys:config:recivingcompany:edit'],
        onClick: 'handleUpdate',
        disabled: (row) => row.status == 3,
      },
      {
        label: '删除',
        auth: ['sys:config:recivingcompany:edit'],
        onClick: 'handleDelete',
        disabled: (row) => row.status == 3,
      },
    ],
  },
];
