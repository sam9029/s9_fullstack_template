import request from '@/utils/request.js';
import { DX_DES_KEY } from '@/utils/config/constants.js';
import { encrypt } from "@/utils/auth.js";

export function UserLogin(data) {
	return request({
		url: '/v1/login',
		method: 'POST', //默认的是GET,必须大写
		data
	})
}
// export function WxLogin(data) {
// 	return request({
// 		url: '/v1/wx_login',
// 		method: 'POST', //默认的是GET,必须大写
// 		data
// 	})
// }
export function postScanLogin(data) {
	return request({
		url: '/login/scan_auth',
		method: 'POST', //默认的是GET,必须大写
		data
	})
}

export function kocLogin(data) {
	return request({
		url: '/login/login',
		method: 'POST',
		data: encrypt(data, decodeURI(atob(DX_DES_KEY)))
	})
}

export function getCodeImg() {
  return request({
    url: "/login/captcha?base64=true",
    method: "get",
  });
}

//获取验证码
export function sendSms(data) {
  return request({
    url: "/login/send_sms",
    method: "post",
    data,
  });
}

//验证验证码 / 忘记密码更改
export function checkSms(data) {
  return request({
    url: "/login/check_sms",
    method: "post",
    data,
  });
}

// 注册
export function kocRegister(data) {
  return request({
    url: "/login/register",
    method: "post",
    data: encrypt(data, decodeURI(atob(DX_DES_KEY))),
  });
}

// 注销
export function kocLogoff(data) {
	return request({
		url: '/applet/user/account/unsubscribe',
		method: 'post',
		data
	})
}

export function getPhoneNumber(data) {
	return request({
		url: "/login/get_phone_number",
		method: 'GET',
		data
	})
}

// 统一登录注册
export function postLoginOrRegister(data) {
	return request({
		url: '/login/unified_login',
		method: 'post',
		data
	})
}

// 修改密码
export function postChangePad(data) {
	return request({
		url: '/public/account/change_password',
		method: 'post',
		data
	})
}

// 扫码获取登录信息
export function postScanLocation(data) {
	return request({
		url: '/login/scan_location',
		method: 'post',
		data
	})
}