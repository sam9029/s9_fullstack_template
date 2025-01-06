import Cookies from 'js-cookie';
import { APP_TITLE, APP_TOKEN_KEY } from '@/utils/config/constants.js';

export function getToken() {
  return Cookies.get(APP_TOKEN_KEY);
}

export function setToken(token) {
  return Cookies.set(APP_TOKEN_KEY, token);
}

export function removeToken() {
  return Cookies.remove(APP_TOKEN_KEY);
}

export function getCookies(name) {
  return Cookies.get(`${APP_TITLE}_${name}`);
}

export function setUser(name, val) {
  return Cookies.set(`${APP_TITLE}_${name}`, val);
}
