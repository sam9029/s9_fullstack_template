const TokenKey = 'H5-UI-TOKEN';
import Cookies from 'js-cookie';
export function getToken() {
  let token = null
  if (localStorage.getItem(TokenKey)) {
    token = localStorage.getItem(TokenKey);
  } else {
    token = Cookies.get(TokenKey);
  }
  return token;
}

export function setToken(token) {
  if (!token) return
  return localStorage.setItem(TokenKey, token) && Cookies.set(TokenKey, token);
}

export function removeToken() {
  return Cookies.remove(TokenKey);
}
