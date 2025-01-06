import request from '@/utils/request';
import { encrypt } from '@/utils/auth';
import { DX_DES_KEY } from '@/utils/config/constants';

// 登录方法
export function login(email, password, captcha_code, check_realname = false, fingerprint) {
  const data = {
    email,
    password,
    captcha_code,
    check_realname,
    fingerprint
  };
  return request({
    url: '/login/login',
    method: 'post',
    data: encrypt(data, decodeURI(atob(DX_DES_KEY))),
  });
}
//扫码登陆
export function scanLogin(data) {
  return request({
    url: '/login/scan_login',
    method: 'post',
    timeout: 110000,
    data,
  });
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/manage/marking/user/info',
    method: 'get',
  });
}

// 退出方法
export function logout() {
  return request({
    url: '/login/logout',
    method: 'post',
  });
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: '/login/captcha',
    method: 'get',
  });
}

export function concantInfo(data) {
  return request({
    url: '/login/concat_info',
    method: 'post',
    data,
  });
}

//获取验证码
export function sendSms(data) {
  return request({
    url: '/login/send_sms',
    method: 'post',
    data,
  });
}
//验证验证码
export function checkSms(data) {
  return request({
    url: '/login/check_sms',
    method: 'post',
    data,
  });
}

//获取短信验证码
export function getSendSms(data) {
  return request({
    url: '/login/send_sms',
    method: 'post',
    data,
  });
}
