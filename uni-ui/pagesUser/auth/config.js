export const ENTRY_STATUS_MAPPER = {
  APPLY_JOIN: "申请入驻",
  VERIFY: "平台审核中",
  REJECT: "申请未通过",
  WAIT_REALNAME: "去实名认证",
  ENTRIED: "已入驻复制链接",
};

export const ENTRY_STATUS_TEXT_MAPPER_FOR_BTN = {
  APPLY_JOIN: { icon: "", content: "申请入驻",},
  VERIFY: { icon: "c_i_tip_computer.png", content: "平台审核中...", },
  REJECT: { icon: "c_i_tip_plaint.png", content: "申请未通过 点此查看原因",},
  WAIT_REALNAME: { icon: "c_i_tip_guard.png", content: "去认证", bottom_content: "去实名认证", },
  ENTRIED: { icon: "c_i_tip_check.png", content: "点击复制链接", bottom_content: "你已入驻 复制链接", },
  LOCAL_QUERY: { icon: "", content: "点击查询入驻状态" },
  // 本地使用
};

export const ENTRY_STATUS_TEXT_MAPPER_FOR_HEADER = {
  APPLY_JOIN: {
    icon: "c_i_fill_star.png",
    title: "欢迎加入创作者",
    content:
      "请添加您的抖/快账号申请入驻，平台会根据您提供账号的作品来判断是否符合创作者入驻要求",
  },
  VERIFY: {
    icon: "c_i_tip_computer_primary.png",
    title: "您的入驻申请已提交",
    content: "我们已收到您的申请，将尽快进行审核",
  },
  REJECT: {
    icon: "c_i_tip_plaint_primary.png",
    title: "入驻申请未通过",
    content: "请查看原因后重新申请入驻",
  },
  WAIT_REALNAME: {
    icon: "c_i_tip_guard_primary.png",
    title: "您的入驻申请已通过",
    content: "实名认证成功后即可开启创作者权益",
  },
  ENTRIED: {
    icon: "c_i_tip_check_primary.png",
    title: "您已成功入驻创作者平台",
    content:
      "请复制链接后在PC端打开、使用“欢乐创”APP扫码登录创作者后台进行原创剧集的上传与管理",
  },
  LOCAL_QUERY: {
    icon: "c_i_fill_star.png",
    title: "点击查询入驻状态",
    content: "",
  }, // 本地使用
};

export const TEXT_DOCS = {
  p0: {
    title: "欢迎加入创作者",
    t1: {
      content:
        "请添加您的抖/快账号申请入驻，平台会根据您提供账号的作品来判断是否符合创作者入驻要求",
    },
  },
  p1: {
    title: "创作者用户说明",
    t1: {
      content:
        "如果您是优质内容原创创作者/机构或版权方(小说、故事、科普,财经、图片等不限内容品类和形式)，以及优质视频内容创作者/机构(短视频、中长视频等)，欢迎入驻欢乐创平台，我们将为您提供自媒体领域全新合作模式，让您的才华获得更好变现。",
    },
  },
  p2: {
    title: "当前市场困惑",
    t1: {
      content1: "耗尽心力创作，被搬运侵权，却又无计可施？",
      content2: "抖音收益大不如前，新的变现链路在哪里？",
      content3: "商单很少又无稳定变现方式怎么办？",
      content4: "被迫抄小说文案，甘冒侵权风险？",
    },
  },
  p3: {
    title: "我们的平台优势",
    t1: {
      title: "提供版权书籍授权",
      content:
        "有近万本书的版权授权，不用担心因侵权惹官司，导致收益归零甚至倒贴",
    },
    t2: {
      title: "提供原创认证保护",
      content:
        "您的作品，都须提前原创认证，原创中心为您作品的版权保驾护航，无后顾之忧",
    },
    t3: {
      title: "提供专业帮助指导",
      content:
        "平台媒介运营1v1提供流程讲解和优化指导，让同样的流量变现效率更高",
    },
  },
  p4: {
    title: "创作者收益说明",
    t1: {
      title: "什么是创作者收益？",
      content:
        "创作者拿到版权授权后或自己原创的内容，持续更新上传优质内容到看点平台，产生的充值收益，按照比例给予创作者分成。",
    },
    t2: {
      title: "什么是分发收益？",
      content:
        "达人基于看点平台内所有已上线内容，制作推广视频，引导粉丝到看点平台付费观看内容，产生的可分配充值，按照比例给予达人分成。",
    },
  },
  p5: {
    title: "创作者入驻流程",
    t1: {
      title: "提交资料：",
      content: "提交抖/快账号资料，申请入驻",
    },
    t2: {
      title: "平台审核：",
      content: "平台进行审核，约1-3个工作日",
    },
    t3: {
      title: "实名认证：",
      content: "验证个人实名信息",
    },
    t4: {
      title: "入驻成功：",
      content: "欢迎加入欢乐创平台",
    },
  },
};
