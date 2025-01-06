import request from "@/utils/request";

export function appInfo(query) {
  return request({
    url: "/public/app_version",
    method: "get",
    data: query,
    skip_encode: true
  });
}
