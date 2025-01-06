import { STATUS_OPTIONS } from '@/utils/mapper'


export const tableItems = [
  {
    label: '项目ID',
    prop: 'id',
    minWidth: 60,
  },
  {
    label: '项目封面',
    prop: 'icon',
    slots: { customRender: 'icon' },
    minWidth: 60,
  },
  {
    label: '项目产品',
    prop: 'name',
    minWidth: 80,
  },
  {
    label: '公司全称',
    prop: 'company',
    minWidth: 80,
  },
  {
    label: '推广类目',
    prop: 'promotion',
    slots: { customRender: 'promotion' },
    minWidth: 120,
  },
  {
    label: '商务',
    prop: 'koc_account_name',
    minWidth: 80,
  },
  {
    label: '创建人',
    prop: 'create_user_name',
    minWidth: 80,
  },
  {
    label: '创建时间',
    prop: 'create_time',
    slots: { customRender: 'dateTime' },
    minWidth: 110,
  },
  {
    prop: 'action',
    label: '操作',
    fixed: 'right',
    minWidth: 100,
    actions: [
      {
        label: '编辑',
        onClick: 'handleEdit',
      },
      // {
      //   label: '类目管理',
      //   onClick: 'showRowPromotion',
      // },
      {
        label: '删除',
        onClick: 'handleDel',
        show: row => row.status != 3,
      },
      {
        label: '启用',
        onClick: 'handleRecover',
        show: row => row.status == 3,
      },
    ],
  },
]


export function initSearch() {
  const search = {
    model: {
      keyword: '',
      koc_account_id: '',
      status: 1,
    },
    item: [
      {
        genre: 'input',
        label: '项目产品：',
        model: 'keyword',
        placeholder: "请输入项目产品名称或ID"
      },
      {
        genre: 'select-user',
        label: '商务：',
        model: 'koc_account_id',
        clearable: true,
        params: { koc_role: 3 }
      },
      {
        genre: 'select',
        label: '状态：',
        model: 'status',
        clearable: true,
        options: STATUS_OPTIONS
      },
    ]
  }

  return search;
}

export const SIGN_TYPE = {
  NEW_AD: 1,
  EDIT_AD: 2,
  NEW_SALER: 3
}

export const expandSalerColumns = [
  {
    label: '商务',
    prop: 'koc_account_name',
    minWidth: 100,
  },
  {
    label: '起始日期',
    prop: 'start_date',
    minWidth: 100,
  },
  {
    label: '截止日期',
    prop: 'end_date',
    minWidth: 100,
  },
  {
    label: '启用状态',
    prop: 'status',
    minWidth: 100,
    slots: { customRender: 'status' },
  },
  {
    label: '创建人',
    prop: 'create_user_name',
    minWidth: 100,
  },
]

export const promoteColumns = [
  {
    label: 'ID',
    prop: 'id',
    minWidth: 80,
  },
  {
    label: '名称',
    prop: 'name',
    minWidth: 120,
  },
  {
    label: '启用状态',
    prop: 'status',
    minWidth: 100,
    slots: { customRender: 'status' },
  },
  {
    label: '创建人',
    prop: 'create_user_name',
    minWidth: 100,
  },
  {
    prop: 'action',
    label: '操作',
    // fixed: 'right',
    minWidth: 80,
    actions: [
      {
        label: '编辑',
        onClick: 'handleEdit',
      },
    ],
  },
]

const defaultOptions = {
  needMapper: false,
  nameKey: 'name',
  nameConnectParent: false,
  nameSeparator: '/',
  key: 'category_id',
  pKey: 'pid'
};

export function listToTree(list = [], setOptions = {}) {
  const options = Object.assign({}, defaultOptions, setOptions);
  const { needMapper, nameKey, nameConnectParent, key, pKey } = options;

  const virtualRootNode = { __virtual: true, children: [] };
  virtualRootNode[key] = 0;
  virtualRootNode[nameKey] = '';

  const nodeMap = new Map();
  nodeMap.set(0, virtualRootNode);

  const mapper = {};
  list.forEach(v => {
    if (needMapper && !nameConnectParent) {
      mapper[v[key]] = v[nameKey]
    }
    const temp = nodeMap.get(v[key]);
    if (temp) {
      // 是其他节点父节点 且被提前使用 必有children
      Object.assign(temp)
    } else {
      // v.children = [];
      nodeMap.set(v[key], v);
    }

    let parentNode = nodeMap.get(v[pKey]);
    if (!parentNode) {
      // 未找到父节点 设置临时节点
      parentNode = {};
      parentNode[key] = v[pKey];
      map.set(v.pid, parentNode);
    }
    parentNode.children = parentNode.children || [];
    parentNode.children.push(v);
  })

  nodeMap.clear();
  if (needMapper && nameConnectParent) {
    getConnectTreeMapper(virtualRootNode, mapper, options);
  }
  const result = {
    tree: virtualRootNode.children
  }
  if (needMapper) {
    result.mapper = mapper;
  }
  return result;
}

function getConnectTreeMapper(node, mapper, options) {
  if (!node.children || !node.children.length) return;
  const { nameKey, key, nameSeparator } = options;
  node.children.forEach(subNode => {
    if (!node.__virtual) {
      subNode.__pathName = node[nameKey] + nameSeparator + subNode[nameKey];
    } else {
      subNode.__pathName = node[nameKey]
    }
    mapper[subNode[key]] = subNode.__pathName;
    getConnectTreeMapper(subNode, mapper, options)
  })
}