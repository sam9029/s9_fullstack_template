export const columns = [
  {
    label: '公司编号',
    prop: 'id',
    minWidth: 80,
  },
  {
    label: '公司名称',
    prop: 'name',
    tooltip: true,
    minWidth: 150,
  },
  {
    label: '公司全称',
    prop: 'company',
    tooltip: true,
    minWidth: 150,
  },
  {
    label: '状态',
    prop: 'status',
    minWidth: 100,
    slots: { customRender: 'switch' },
  },
  {
    label: '更新时间',
    prop: 'update_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
  },
  {
    label: '描述',
    minWidth: 180,
    tooltip: true,
    prop: 'remark',
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
        onClick: 'handleUpdate',
      },
      {
        label: '删除',
        onClick: 'handleDelete',
      },
    ],
  },
];
