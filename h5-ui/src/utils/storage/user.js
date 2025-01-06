const stage_key = 'H5-UI-USER';
const invitee_key = 'H5-UI-INVITEE';

export function setLocalInvitee(data) {
  if (typeof data != 'string') {
    data = JSON.stringify(data);
  }
  try {
    localStorage.setItem(invitee_key, data);
    return true;
  } catch (e) {
    return false;
  }
}

// 读取用户信息
export function getLocalInvitee() {
  try {
    const value = localStorage.getItem(invitee_key);
    if (value) return Number(value);
    return null;
  } catch (e) {
    return null;
  }
}

// 存储用户信息到本地
export function setLocalUser(data) {
  if (data) {
    data = JSON.stringify(data);
    try {
      localStorage.setItem(stage_key, data);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

// 读取用户信息
export function getLocalUser() {
  try {
    const value = localStorage.getItem(stage_key);
    if (value) return JSON.parse(value);
    return null;
  } catch (e) {
    return null;
  }
}

export function removeLocalUser() {
  try {
    localStorage.removeItem(stage_key);
  } catch (e) {
    // error
  }
}
export function setPageTitle(title = '') {
  try {
    document.title = title
  } catch (e) {
    // error
  }
}


export function getChannelId() {
  let channel_id = null
  if (localStorage.getItem('channel_id')) {
    channel_id = localStorage.getItem('channel_id');
  }
  return Number(channel_id);
}

export function setChannelId(channel_id) {
  if (!channel_id) return
  return localStorage.setItem('channel_id', channel_id)
}