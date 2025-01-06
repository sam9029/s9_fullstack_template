export const columns = [
  {
    label: '模板编号',
    prop: 'id',
    minWidth: 80,
  },
  {
    label: '模板名称',
    prop: 'name',
    tooltip: true,
    minWidth: 150,
  },
  {
    label: 'oss_key',
    prop: 'oss_key',
    tooltip: true,
    minWidth: 150,
  },
  {
    label: '状态',
    prop: 'status',
    minWidth: 100,
    slots: { customRender: 'switch' },
    auth: ['sys:config:template:edit'],
  },
  {
    label: '更新时间',
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
        onClick: 'handleUpdate',
        auth: ['sys:config:template:edit'],
      },
      {
        label: '删除',
        onClick: 'handleDelete',
        auth: ['sys:config:template:edit'],
        confirm: (row) => {
          switch (Number(row.status)) {
            case 1:
              return '是否确定删除 ' + row.name + ' 模板';
            case 2:
              return '是否确定启用 ' + row.name + ' 模板';
            case 3:
              return '是否确定恢复 ' + row.name + ' 模板';
          }
        },
        customRender: (row, index) => {
          switch (Number(row.status)) {
            case 1:
              return '删除';
            case 2:
              return '启用';
            case 3:
              return '恢复';
          }
        },
      },
    ],
  },
];
