const getters = {
  account_id: (state) => state.userInfo.id,
  account_name: (state) => state.userInfo?.name,
  account_type: (state) => state.userInfo?.joyful_account_type, // 1、博主 2、投顾 3、其他（管理员商务等）
  avaturl: (state) => state.userInfo.avatar,
  birth: (state) => state.userInfo.birth,
  blogger_id: (state) => state.userInfo.blogger_id,
  button_authority: (state) => state.button_authority, //按钮白名单
  consultant_id: (state) => state.userInfo.consultant_id,
  current_tab: (state) => state.tabar.current,
  email: (state) => state.userInfo.email,
  gender: (state) => state.userInfo.gender,
  has_login: (state) => state.hasLogin, //是否登录标识
  image: (state) => state.image,
  invitee: (state) => state.invitee,
  navbar_height: (state) => state.navbarHeight,
  phone: (state) => state.userInfo.telephone,
  region: (state) => state.userInfo.region,
  router_authority: (state) => state.router_authority, //路由白名单
  tabar: (state) => state.tabar,
  tabbar_height: (state) => state.tabbarHeight,
  token: (state) => state.token,
  theme_color: (state) => state.themeColor,
  theme_mode: (state) => state.themeMode,
  // message_info: state => state.message.message_info,
  home_refresh_flag: (state) => state.home_refresh_flag,
  wechat_tempids: (state) => state.userInfo.wechat_tempids, //消息订阅
  auth_scope: (state) => state.userInfo.auth_scope, //授权权限
  applet_id: (state) => state.applet_id, //applet_id
  userInfo: (state) => state.userInfo, //用户信息
  duolai_account_id: (state) => state.duolai_account_id,
  user_name: (state) => state.user_name,
  user_avatar: (state) => state.user_avatar,
  system: (state) => state.system,
  pay_info: (state) => state.pay_info,
  ad_config: (state) => state.ad_config,
  sleep_time: (state) => state.sleep_time,
  share_image: (state) => state.share_image,
  local_late: (state) => state.local_late, //本地分流延迟
  integral_mode: (state) => state.ad_config?.integral_mode, //看点模式
  integral_info: (state) => state.integralInfo, //看点信息
  fingerprint: (state) => state.fingerprint, //设备指纹
  device_id: (state) => state.userInfo.device_id, //设备id
  static_path: (state) => {
    let str = "";
    // #ifdef APP
    str = "/static/images/";
    // #endif
    // #ifndef APP
    str = state.staticPath;
    // #endif
    return str;
  }, // 静态资源路径
  scan_data: (state) => state.scanData, //扫码数据
};

export default getters;
