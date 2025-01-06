import request from "@/utils/request";

// 获取用户状态
export function getUserEntryStatus(data) {
  return request({
    url: "/applet/user/realname/entry_status",
    method: "GET",
    data,
  });
}

// 创作者申请
export function postApprovalSubmit(data) {
  return request({
    url: "/applet/user/realname/approval_submit",
    method: "POST",
    data,
  });
}