const getters = {
  sidebar: (state) => state.app.sidebar,
  size: (state) => state.app.size,
  device: (state) => state.app.device,
  visitedViews: (state) => state.tagsView.visitedViews,
  cachedViews: (state) => state.tagsView.cachedViews,
  token: (state) => state.user.token,
  userInfo: (state) => state.user.userInfo,
  avatar: (state) => state.user.avatar,
  name: (state) => state.user.name,
  roles: (state) => state.user.roles,
  permissions: (state) => state.user.permissions,
  permission_routes: (state) => state.permission.routes,
  topbarRouters: (state) => state.permission.topbarRouters,
  defaultRoutes: (state) => state.permission.defaultRoutes,
  sidebarRouters: (state) => state.permission.sidebarRouters,
  permsMapper: (state) => state.permission.permsMapper,
  firstRouter: (state) => state.permission.firstRouter,
  effectSettings: (state) => state.settings.effectSettings,

  currentAccountId: (state) => state.user.currentUserData.id,
  currentAccountName: (state) => state.user.currentUserData.name,
  currentOemId: (state) => state.user.currentUserData.oem_id,
  isAccessUser: (state) => state.user.userInfo.isAccessUser,
  accountType: (state) => state.user.userInfo.account_type,

  message_info: (state) => state.message.message_info,
  fingerprint: (state) => state.user.fingerprint,//浏览器指纹
};
export default getters;
