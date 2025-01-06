import request from '@/utils/request';
import { encrypt } from '@/utils/tools/crypto.js';
import { DX_DES_KEY } from '@/utils/config/constants';

export function AuthLogin(data) {
  return request({
    url: '/login/scan_auth',
    method: 'POST', //默认的是GET,必须大写
    data,
  });
}

export function kocLogin(data) {
  let newObj = encrypt(data, decodeURI(atob(DX_DES_KEY)));
  return request({
    url: '/login/login',
    method: 'POST',
    data: newObj,
  });
}

export function getCodeImg(params) {
  return request({
    url: '/login/captcha',
    method: 'get',
    params
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

// 注册
export function kocRegister(data) {
  return request({
    url: '/login/register',
    method: 'post',
    data,
  });
}

export function getPhoneNumber(params) {
  return request({
    url: '/login/get_phone_number',
    method: 'GET',
    params,
  });
}

export function logout(params) {
  return request({
    url: '/login/logout',
    method: 'GET',
    params,
  });
}

// 滑动验证码
export function getSlideCode() {
  return request({
    url: '/login/slide_code',
    method: 'get',
  });
}