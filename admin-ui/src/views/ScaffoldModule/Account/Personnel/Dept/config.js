export const columns = [
  {
    label: '部门ID',
    prop: 'id',
    fixed: 'left',
    minWidth: 80,
  },
  {
    label: '部门名称',
    prop: 'dept_name',
    minWidth: 100,
  },
  {
    label: '所属公司',
    prop: 'company',
    minWidth: 120,
  },
  {
    label: '状态',
    prop: 'status',
    minWidth: 80,
    auth: ['admin:department:remove'],
    slots: { customRender: 'switch' },
  },

  {
    label: '更新时间',
    prop: 'update_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
  },
  {
    label: '操作者',
    prop: 'update_user_name',
    minWidth: 120,
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
        auth: ['admin:department:add'],
        onClick: 'handleUpdate',
      },
      {
        label: '删除',
        auth: ['admin:department:remove'],
        onClick: 'handleDelete',
      },
    ],
  },
];

// export const dataScopeOptions = [
//   {
//     value: "1",
//     label: "全部数据权限",
//   },
//   {
//     value: "2",
//     label: "自定数据权限",
//   },
//   {
//     value: "3",
//     label: "本部门数据权限",
//   },
//   {
//     value: "4",
//     label: "本部门及以下数据权限",
//   },
//   {
//     value: "5",
//     label: "仅本人数据权限",
//   },
// ];
