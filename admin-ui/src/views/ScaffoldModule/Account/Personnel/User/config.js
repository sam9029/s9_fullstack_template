export const columns = [
  {
    label: '用户编号',
    prop: 'id',
    fixed: 'left',
    minWidth: 100,
    slots: { customRender: 'link' },
  },
  {
    label: '用户名称',
    prop: 'name',
    fixed: 'left',
    tooltip: true,
    minWidth: 120,
  },
  {
    label: '部门',
    prop: 'departments',
    minWidth: 120,
    slots: { customRender: 'departments' },
  },
  {
    label: '角色',
    prop: 'role_names',
    minWidth: 240,
    slots: { customRender: 'role_names' },
  },
  {
    label: '权限类型',
    prop: 'auth_type',
    minWidth: 120,
    slots: {
      customRender: (row) => {
        return row.auth_type == 1 ? '角色' : '自定义';
      },
    },
  },
  {
    label: '直属上级',
    prop: 'leader_name',
    minWidth: 120,
  },
  {
    label: '邮箱',
    show: false,
    prop: 'email',
    minWidth: 160,
  },
  {
    label: '手机号',
    minWidth: 120,
    prop: 'telephone',
  },
  {
    label: '状态',
    prop: 'flag_status',
    minWidth: 120,
    auth: ['admin:user:remove'],
    disabled: (row) => {
      return row.status > 2
    },
    slots: { customRender: 'switch', },
  },
  {
    label: '操作者',
    prop: 'create_user_name',
    tooltip: true,
    minWidth: 120,
    slots: {
      customRender: (row) => {
        return row.update_user_name || row.create_user_name;
      },
    },
  },
  {
    label: '创建时间',
    prop: 'create_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' },
  },
  {
    label: '更新时间',
    prop: 'update_time',
    minWidth: 120,
    slots: { customRender: 'dateTime' },
  },
  {
    prop: 'action',
    label: '操作',
    fixed: 'right',
    width: 180,
    actions: [
      {
        label: '修改',
        auth: ['admin:user:add'],
        onClick: 'handleUpdate',
      },
      {
        label: '删除',
        customRender: (row, index) => {
          switch (Number(row.status)) {
            case 1:
              return '删除';
            case 2:
              return '删除';
            case 3:
              return '恢复';
            default:
              return '未知';
          }
        },
        auth: ['admin:user:remove'],
        onClick: 'handleDelete',
      },
      {
        label: '重置',
        auth: ['admin:user:add'],
        onClick: 'handleResetPwd',
      },
    ],
  },
];

export const rules = {
  name: [
    {
      required: true,
      message: '用户名称不能为空',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: '用户密码不能为空',
      trigger: 'blur',
    },
  ],
  email: [
    {
      required: true,
      type: 'email',
      message: "'请输入正确的邮箱地址",
      trigger: ['blur', 'change'],
    },
  ],
  gender: [
    {
      required: true,
      message: '请选择用户性别',
      trigger: ['change'],
    },
  ],
  telephone: [
    {
      required: true,
      pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ],
  department: [{ required: true, message: '请选择归属部门', trigger: ['change'] }],
  role_ids: [
    {
      required: true,
      message: '请选择角色类型',
      trigger: ['change'],
    },
  ],
  flag: [
    {
      required: true,
      message: '请选择状态',
      trigger: ['blur', 'change'],
    },
  ],
  phone_verification: [
    {
      required: true,
      message: '请选择是否开启短信验证',
      trigger: ['blur', 'change'],
    },
  ],
};
