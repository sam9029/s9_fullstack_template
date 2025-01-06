export const columns = [
  {
    label: '角色ID',
    prop: 'id',
    fixed: 'left',
    minWidth: 80,
  },
  {
    label: '角色名称',
    prop: 'role_name',
    minWidth: 120,
  },
  {
    label: '上级角色',
    prop: 'upper_name',
    minWidth: 120,
  },
  {
    label: '所属公司',
    prop: 'company',
    minWidth: 150,
  },
  {
    label: '状态',
    prop: 'status',
    minWidth: 80,
    auth: ['admin:role:remove'],
    slots: { customRender: 'switch' },
  },
  {
    label: '操作者',
    prop: 'update_user_name',
    minWidth: 120,
  },
  {
    label: '创建时间',
    prop: 'create_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' },
  },
  {
    label: '创建者',
    prop: 'create_user_name',
    minWidth: 120,
  },
  {
    label: '更新时间',
    prop: 'update_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
  },
  {
    groupLevel: 99,
    label: '备注',
    minWidth: 100,
    prop: 'remark',
  },
  {
    prop: 'action',
    label: '操作',
    fixed: 'right',
    width: 180,
    actions: [
      {
        label: '修改',
        auth: ['admin:role:add'],
        onClick: 'handleUpdate',
      },
      {
        label: '复制',
        auth: ['admin:role:add'],
        onClick: 'handleCopy',
      },
      {
        label: '删除',
        auth: ['admin:role:remove'],
        onClick: 'handleDelete',
      },
    ],
  },
];
