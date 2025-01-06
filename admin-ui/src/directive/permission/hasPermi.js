/**
 * 操作权限处理
 * Copyright (c) 2019 ruoyi
 */

import store from '@/store';

export default {
  inserted(el, binding, vnode) {
    if (!binding) {
      return (el.style.display = 'none');
    }
    const { value } = binding;
    // v-hasPermi="" 认为无权限控制
    if (!value) {
      el.classList.remove('is-disabled');
      el.disabled = false;
      return;
    }
    if (Array.isArray(value)) {
      const permsMapper = store.getters && store.getters.permsMapper;
      const btnPermiIds = value.map((item) => permsMapper[item] || item);
      if (process.env.NODE_ENV === 'development') {
        // btnPermiIds.push("*:*:*")
      }
      if (btnPermiIds.indexOf('INTB') != -1) {
        // INTB
        if (newCheckPermission(btnPermiIds)) {
          return;
        } else if (btnPermiIds.includes('SELF')) {
          // HAVE SELF
          let rowdata = vnode.data.attrs.rowdata || {};
          let create_user_id = rowdata.order_create_user_id || rowdata.create_user_id;
          if (Number(store.getters.currentAccountId) == Number(create_user_id)) {
            el.classList.remove('is-disabled');
            el.disabled = false;
          } else {
            el.classList.add('is-disabled');
            el.disabled = true;
          }
        } else {
          el.classList.add('is-disabled');
          el.disabled = true;
        }
      } else {
        // NOT INTB
        if (newCheckPermission(btnPermiIds)) {
          // el.style.display = ''
        } else {
          // el.style.display = 'none'
          el.parentNode.removeChild(el);
        }
      }
    } else {
      console.error(
        `need auths! expected v-hasPermi="['system:user:add','SELF', 'INTB']", got ${value}`,
      );
      // el.parentNode && el.parentNode.removeChild(el)
    }
  },
};

function newCheckPermission(btnPermiIds) {
  const all_permission = '*:*:*';
  /**
   * @type {string[] | number[]}
   */
  const permissions = store.getters && store.getters.permissions;
  const permissionFlag = btnPermiIds;
  const hasPermissions = permissionFlag.some((idOrStrPermi) => {
    return all_permission === idOrStrPermi || permissions.includes(idOrStrPermi);
  });

  return hasPermissions;
}
