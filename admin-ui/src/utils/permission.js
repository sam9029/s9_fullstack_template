import store from '@/store';

/**
 * 字符权限校验
 * @param {Array} value 校验值
 * @returns {Boolean}
 */
export function checkPermi(value) {
  if (value && value instanceof Array && value.length > 0) {
    // if (process.env.NODE_ENV === 'development') return true;
    const permissions = store.getters && store.getters.permissions;
    const permsMapper = store.getters && store.getters.permsMapper;
    const btnPermiIds = value.map((item) => permsMapper[item] || item);

    const all_permission = '*:*:*';

    const hasPermission = btnPermiIds.some((idOrPermi) => {
      return all_permission === idOrPermi || permissions.includes(idOrPermi);
    });
    // console.log(value, hasPermission);
    return hasPermission;
  } else {
    console.error(
      `need roles! Like checkPermi="['system:user:add','system:user:edit']", got ${value}`,
    );
    return false;
  }
}
export function checkDropDown(_this, ref) {}
/**
 * 角色权限校验
 * @param {Array} value 校验值
 * @returns {Boolean}
 */
export function checkRole(value) {
  if (value && value instanceof Array && value.length > 0) {
    const roles = store.getters && store.getters.roles;
    const permissionRoles = value;
    const super_admin = 'admin';

    const hasRole = roles.some((role) => {
      return super_admin === role || permissionRoles.includes(role);
    });

    if (!hasRole) {
      return false;
    }
    return true;
  } else {
    console.error(`need roles! Like checkRole="['admin','editor']"`);
    return false;
  }
}
