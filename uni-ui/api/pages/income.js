import request from "@/utils/request.js";

export function getWalletTotal(data) {
  return request({
    url: '/applet/user/wallet/total',
    method: 'get',
		data,
  })
}