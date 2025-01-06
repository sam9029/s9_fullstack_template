import { getCookies, setUser } from './auth';
import { USER_DATA, USER_NAME } from '@/utils/config/constants';
import JWT from '@/utils/jwt.js';
import store from '@/store';
const getUserName = () => {
  const userInfo = JSON.parse(getCookies(USER_NAME));
  return decodeURIComponent(escape(window.atob(userInfo.uid)));
};
const getUserData = () => {
  let user_info = localStorage.getItem(USER_DATA);
  try {
    if (user_info) {
      user_info = JWT.verify(user_info, 'USER_INFO');
    } else {
      user_info = {};
    }
  } catch (error) {
    localStorage.removeItem(USER_DATA);
    user_info = {};
  }
  return user_info;
};
const setUserData = (data, creator_host = `https://xiaoguofanxing.lizhibj.cn/login`) => {
  data.creator_host = creator_host;
  let user_info = JWT.sign(data, 'USER_INFO', { expiresIn: 60 * 60 * 24 * 7 });
  store.commit('SET_CURRENT_USER_DATA', data);
  localStorage.setItem(USER_DATA, user_info);
  var uinfo = {
    usname: window.btoa(unescape(encodeURIComponent(data.name))),
    uid: window.btoa(unescape(encodeURIComponent(data.id))),
    email: data.email,
    role_id: data.role_id,
  };
  if (data.department) {
    uinfo.department = JSON.parse(data.department);
  }
  setUser('usname', uinfo);
};
const getPlatfrom = () => {
  let UserAgent = navigator && navigator.userAgent;
  UserAgent = UserAgent.toUpperCase();
  if (UserAgent.indexOf('IPAD') != -1 || UserAgent.indexOf('WINDOWS') != -1) return false;
  if (UserAgent.indexOf('IPHONE') != -1 || UserAgent.indexOf('ANDROID') != -1) return true;
  return false;
};
export { getUserName, getUserData, setUserData, getPlatfrom };
