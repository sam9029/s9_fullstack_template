export const columns = [
  {
    label: '平台ID',
    prop: 'value',
    minWidth: 80,
  },
  {
    label: '平台名称',
    prop: 'label',
    tooltip: true,
    minWidth: 90,
  },
  {
    label: '推广方式',
    prop: 'promotion_type',
    tooltip: true,
    minWidth: 150,
    slots: { customRender: 'promotion_type' },
  },
  {
    label: '状态',
    prop: 'status',
    auth: ['sys:config:platform:edit'],
    minWidth: 100,
    slots: { customRender: 'switch' },
  },
  {
    label: '备注',
    prop: 'remark',
    minWidth: 150,
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
    prop: 'action',
    label: '操作',
    fixed: 'right',
    width: 100,
    minWidth: 100,
    actions: [
      {
        label: '修改',
        auth: ['sys:config:platform:edit'],
        onClick: 'handleUpdate',
        disabled: (row) => row.status == 3,
      },
      {
        label: '删除',
        auth: ['sys:config:platform:edit'],
        onClick: 'handleDelete',
        disabled: (row) => row.status == 3,
      },
    ],
  },
];
