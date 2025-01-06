export const columns = [
  {
    label: 'ID',
    prop: 'id',
    minWidth: 80,
  },
  {
    label: '素材类型',
    prop: 'type',
    // tooltip: true,
    minWidth: 90,
    slots: { customRender: 'type' }
  },
  {
    label: '大小',
    prop: 'size',
    // tooltip: true,
    minWidth: 80,
    slots: { customRender: (item) => item.size + 'M' }
  },
  {
    label: '状态',
    prop: 'flag',
    minWidth: 100,
    auth: ['sys:config:material:edit'],
    slots: { customRender: 'switch' },
  },
  // {
  //   label: '备注',
  //   prop: 'remark',
  //   minWidth: 150,
  // },
  {
    label: '操作者',
    prop: 'update_user_name',
    minWidth: 100,
  },
  {
    label: '创建时间',
    prop: 'create_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
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
        auth: ['sys:config:material:edit'],
        onClick: 'handleUpdate',
        disabled: (row) => row.status == 3,
      },
      {
        label: '删除',
        auth: ['sys:config:material:edit'],
        onClick: 'handleDelete',
        disabled: (row) => row.status == 3,
      },
    ],
  },
];
