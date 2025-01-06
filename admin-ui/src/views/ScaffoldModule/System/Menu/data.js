export const columns = [
  {
    label: '菜单名称',
    prop: 'meta',
    minWidth: 120,
    slots: {
      customRender: 'name',
    },
  },
  {
    label: '图标',
    prop: 'icon',
    minWidth: 60,
    slots: { customRender: 'icon' },
  },
  {
    label: '排序',
    prop: 'order',
    minWidth: 40,
  },
  {
    label: '权限标识',
    prop: 'perms',
    minWidth: 120,
    tooltip: true,
  },
  {
    label: '菜单类型',
    prop: 'menu_type',
    tooltip: true,
    minWidth: 40,
  },
  {
    label: 'ID',
    minWidth: 40,
    tooltip: true,
    prop: 'id',
  },
  {
    label: '组件名称',
    tooltip: true,
    minWidth: 40,
    prop: 'component',
  },
  {
    label: '状态',
    minWidth: 40,
    prop: 'status',
    slots: { customRender: 'switch' },
  },
  {
    label: '创建时间',
    tooltip: true,
    prop: 'create_time',
    minWidth: 100,
  },
  {
    prop: 'action',
    label: '操作',
    fixed: 'right',
    width: 160,
    minWidth: 160,
    actions: [
      {
        label: '修改',
        onClick: 'handleUpdate',
      },
      {
        label: '新增',
        onClick: 'handleAdd',
        disabled: (val) => {
          return val.menu_type == 'F';
        },
      },
      {
        label: '删除',
        onClick: 'handleDelete',
      },
    ],
  },
];

export const applet_columns = [
  {
    label: '菜单名称',
    prop: 'meta',
    minWidth: 120,
    slots: {
      customRender: 'name',
    },
  },
  {
    label: '权限标识',
    prop: 'perms',
    minWidth: 120,
    tooltip: true,
  },
  {
    label: '菜单类型',
    prop: 'menu_type',
    tooltip: true,
    minWidth: 40,
  },
  {
    label: 'ID',
    minWidth: 40,
    tooltip: true,
    prop: 'id',
  },
  {
    label: '状态',
    minWidth: 40,
    prop: 'status',
    slots: { customRender: 'switch' },
  },
  {
    label: '创建时间',
    tooltip: true,
    prop: 'create_time',
    minWidth: 100,
  },
  {
    prop: 'action',
    label: '操作',
    fixed: 'right',
    width: 160,
    minWidth: 160,
    actions: [
      {
        label: '修改',
        onClick: 'handleUpdate',
      },
      {
        label: '新增',
        onClick: 'handleAdd',
        disabled: (val) => {
          return val.menu_type == 'F';
        },
      },
      {
        label: '删除',
        onClick: 'handleDelete',
      },
    ],
  },
];
