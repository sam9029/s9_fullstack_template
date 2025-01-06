export const columns = [
  {
    label: '业务类别',
    prop: 'business_category',
    minWidth: 100,
    slots: { customRender: 'business_category' },
  },
  {
    label: '审批流类目',
    prop: 'type',
    minWidth: 100,
    slots: { customRender: 'type' },
  },
  {
    label: '审批流层级',
    prop: 'select_length',
    minWidth: 80,
    slots: { customRender: 'select_length' },
  },
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
    width: 130,
    actions: [
      {
        label: '编辑',
        onClick: 'handleUpdate',
        auth: ['sys:approvalV2:edit'],
        disabled: (row) => row.status == 3,
      },
      {
        label: '删除',
        onClick: 'handleDelete',
        auth: ['sys:approvalV2:edit'],
        disabled: (row) => row.status == 3,
      },
    ],
  },
];

export const BUINESS_TYPE_MAPPER = {
  1: '创作业务',
};
export const COMMON_MAPPER = {
  1: {
    1: '剧集管理',
  },
};
