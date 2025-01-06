//各个模块的interface_id
const INTERFACE = {
    ACCOUNT_DEPT_INTERFACE: { //部门管理权限
        list: 15,
        add: 120,
        edit: 122
    },
    ACCOUNT_ROLE_INTERFACE: { //角色管理权限
        list: 11,
        add: 124,
        edit: 124,
        del: 127,
    },
    ACCOUNT_USER_INTERFACE: { //用户管理权限
        list: 16,
        add: 129,
        edit: 129,
        del: 133,
        custom: 484
    },
}
module.exports = INTERFACE;
