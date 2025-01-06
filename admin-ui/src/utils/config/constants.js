/** 项目常量库 */

// 项目
const APP_TITLE = 'SCAFFOLD';

// 登录密钥（已混淆）
const DX_DES_KEY = 'TU5DNDYzQzBORDBJNDVEVk1OQzQ2M0MwTkQwSTQ1RFY=';

// 项目token字段
const APP_TOKEN_KEY = `${APP_TITLE}_ADMIN_TOKEN`;

// 用户信息字段
const USER_NAME = `${APP_TITLE}_USER_NAME`;
const USER_DATA = `${APP_TITLE}_USER_DATA`;
const USER_INFO = `${APP_TITLE}_USER_INFO`;
const USER_DEFAULT_AVATAR = `https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png`;


// 导出
// prettier-ignore
export { 
    APP_TOKEN_KEY, 
    USER_NAME, 
    USER_INFO, 
    USER_DATA, 
    USER_DEFAULT_AVATAR, 
    DX_DES_KEY 
};
