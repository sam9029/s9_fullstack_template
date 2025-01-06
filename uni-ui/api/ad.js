import request from "@/utils/request.js";

// 获取广告配置
export function getAdPosition(data) {
  return request({
    url: "/duolai/login/ad_position",
    method: "get",
    data,
  });
}

// 获取激励视频广告UID
export function makeAdVideo(data) {
  return request({
    url: "/duolai/order/make_ad_video",
    method: "POST",
    data,
  });
}

// 验证激励视频广告结果
export function verifyAdVideo(data) {
  return request({
    url: "/duolai/order/verify_ad_video",
    method: "POST",
    data,
  });
}

//获取与本地服务器的延迟，用于本地分流
export function getLocalLate() {
  return request({
    url: 'https://minio.lizhibj.cn/api/test_connect',
    method: 'get',
    back_difftime: true
  })
}