
// 消息一级类型
// 1审核2财务3提醒4官方

// 消息类型
const MESSAGE_TYPE_MAPPER = {
  401:'新项目上线通知',
  402:'激励政策',
  403:'爆款任务推荐',
  404:'政策变更',
};

// 消息状态
const MESSAGE_STATUS_MAPPER = {
  1: '待发送',
  2: '已发送',
  3: '己撤回',
  4: '己删除',
};


// 政策mapper
const POLICY_TYPE_MAPPER = {
  1: '博主政策',
  2: '会员政策',
  3: '返利政策',
  4: '工具政策',
};


export { 
  MESSAGE_TYPE_MAPPER, 
  MESSAGE_STATUS_MAPPER,
  POLICY_TYPE_MAPPER,
};
