// import variables from '@/assets/styles/element-variables.scss';
// import logoImg from '@/assets/logo/logo.png';
import { changeThemeColor, ORIGINAL_THEME } from '@/utils/theme';
import { topStyleChange } from '@/utils/topNavStyle.js';

const lockedSettings = {
  topNav: true,
  fixedHeader: true,
};

const companySettingKeys = ['logoMode', 'logo', 'title', 'theme'];
const companyDefaultSettings = {
  logoMode: 'image',
  logo: 'https://koc-img.lizhibj.cn/manage/logo.png',
  title: '力值广告平台',
  theme: ORIGINAL_THEME,
};

const userDefaultSetting = {
  showSettings: false,
  sideTheme: 'blue',
  theme: '',
  tagsView: true,
  dynamicTitle: false,
  echartsTheme: 'macarons',
};
const userStorageSetting = JSON.parse(localStorage.getItem('layout-setting')) || {};
const userSettings = Object.assign({}, userDefaultSetting, userStorageSetting);

const state = {
  pageTitle: '', // 页面动态标题
  lockedSettings,
  companySettings: companyDefaultSettings,
  userSettings: userSettings,
  effectSettings: assignSettings(lockedSettings, companyDefaultSettings, userSettings),
};

function assignSettings(...settings) {
  const target = {};
  for (let i = 0; i < settings.length; i++) {
    const keys = Reflect.ownKeys(settings[i]).filter((k) => k != '__ob__');
    keys.forEach((k) => {
      if (settings[i][k] === undefined || settings[i][k] === null || settings[i][k] === '') return;
      target[k] = settings[i][k];
    });
  }

  return target;
}

function checkSetSettingKey(settings, key, type) {
  if (settings.hasOwnProperty(key)) {
    return true;
  } else {
    console.error(`change setting error: type: ${type}, key: ${key}!`);
    return false;
  }
}
function calcEffectSetting(state) {
  state.effectSettings = assignSettings(
    state.lockedSettings,
    state.companySettings,
    state.userSettings,
  );
}
const mutations = {
  CHANGE_COMPANY_SETTING: (state, settings) => {
    state.companySettings = settings;
    calcEffectSetting(state);
  },
  CHANGE_SETTING: (state, { key, type, value }) => {
    // eslint-disable-next-line no-prototype-builtins
    if (type == 'company') {
      if (checkSetSettingKey(state.companySettings, key, type)) {
        state.companySettings[key] = value;
        calcEffectSetting(state);
      }
    } else if (type == 'user') {
      if (checkSetSettingKey(state.userSettings, key, type)) {
        state.userSettings[key] = value;
        calcEffectSetting(state);
      }
    } else {
      console.error(`change setting error: unknow type: ${type}`);
    }
  },
};

const actions = {
  // 修改布局设置
  changeSetting({ commit, dispatch }, data) {
    commit('CHANGE_SETTING', data);
    if (data.key == 'sideTheme') {
      dispatch('changeSideTheme');
    }
  },
  // 修改公司设置
  changeCompanySetting({ commit, state, dispatch }, data) {
    const setting = Object.assign({}, companyDefaultSettings);
    companySettingKeys.forEach((k) => {
      if (data[k]) {
        setting[k] = data[k];
      }
    });
    commit('CHANGE_COMPANY_SETTING', setting);
    dispatch('changeTheme', true);
    if (state.sideTheme != 'blue') {
      dispatch('changeSideTheme');
    }
  },
  // 设置网页标题
  setTitle({ commit }, title) {
    state.pageTitle = title;
  },
  changeTheme({ state }, forceUpdate = false) {
    // 更改主题色有多个入口
    // 1. 登录后获取到公司设置 需要changeCompanySetting -> changeTheme
    // 2. 个人在右侧配置，成功后才会changeSetting, 所以不需要changeTheme
    // 3. 个人保存配置,进入时会合并为store初始值, 之后由1触发
    // 所以此处只处理登陆后获取到公司配置时的情况
    changeThemeColor(state.effectSettings.theme, forceUpdate).catch((err) => {
      console.log(err);
      const { Message } = require('element-ui');
      Message.warning('配置页面主题色失败, 正在使用默认主题!');
    });
  },
  changeSideTheme({ state }) {
    topStyleChange(state.effectSettings.sideTheme);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
