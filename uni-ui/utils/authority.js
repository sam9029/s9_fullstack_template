import store from "@/store/index.js";
const WhiteList = [
  "/pages/login/login",
  "/pages/login/register",
  "/pagesUser/setting/account/phone",
  "/pagesUser/setting/account/password",
  "/pages/login/scanAuth",
  "/pagesUser/service/agreement/privacy",
  "/pagesUser/service/agreement/pay",
  "/pages/login/forget",
  "/pagesUser/service/agreement/user",
  "pagesUser/setting/index",
];
function invokeRouter() {
  uni.addInterceptor("navigateTo", {
    //监听跳转
    invoke(args) {
      args.url = matchAuth(args.url, "navigateTo");
    }
  });
  uni.addInterceptor("redirectTo", {
    //监听关闭本页面跳转
    invoke(args) {
      args.url = matchAuth(args.url, "redirectTo");
    }
  });
  uni.addInterceptor("switchTab", {
    //监听tabBar跳转
    invoke(args) {
      // store.commit("SET_CURRENT_TAB", getCurrentTab(args.url));
      args.url = matchAuth(args.url, "switchTab");
    }
  });
  // uni.addInterceptor("reLaunch", {
  //   complete(res) {
  //     store.dispatch("message/GetMessageCount");
  //   },
  // });
}
function getCurrentTab(url) {
  // console.log(url);
  return 1;
}
function pathDeleteSplit(url) {
  let path = url;
  if (!path) return "";
  path = path.split("?")[0];
  let arr = path.split("/").filter((i) => i);
  return arr.join("/");
}
function matchAuth(url, type) {
  return url;
  //匹配权限
  const check_url = pathDeleteSplit(url);
  let router_authority = store.getters.router_authority.filter(
    (i) => i.meta && i.meta.hasPermission
  ); // 先筛选有权限的路由
  let access_router = router_authority.find(
    (i) => pathDeleteSplit(i.path) == check_url
  );
  if (!access_router)
    access_router = WhiteList.find((i) => pathDeleteSplit(i) == check_url);
  if (!access_router) {
    // console.log("暂无权限路由：", url);
    let path = "";
    if (!store.getters.has_login) path = `/pages/login/login?type=${type}`;
    else path = `/pagesUser/authority/authority?type=${type}`;
    if (type == "switchTab") {
      uni.navigateTo({ url: path });
      return "";
    }
    return path;
  } else {
    return url;
  }
}
function checkAuthority(data = []) {
  // return true;
  if (!data || !data.length) return true;
  if (data && Array.isArray(data) && data.length > 0) {
    data = data.map((i) => i.trim());
    let router_authority = store.getters.router_authority.filter(
      (i) => i.meta && i.meta.hasPermission
    );
    let button_authority = store.getters.button_authority;
    let all_btn = router_authority
      .concat(button_authority)
      .filter((i) => String(i.perms || "").trim())
      .map((i) => i.perms);
    const hasPermission = data.some((perms) => {
      return all_btn.includes(perms);
    });
    return hasPermission;
  } else {
    console.error(
      `need roles! Like checkAuthority="['system:user:add','system:user:edit']", got ${data}`
    );
    return false;
  }
}
export { invokeRouter, checkAuthority };
