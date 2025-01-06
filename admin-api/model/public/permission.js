const knex = require("../../db/knexManager").knexProxy
const { ACCOUNT_TABLE, ACTINFO_TABLE, OEM_TABLE, ROLE_TABLE, ACCOUNT_ROLE, CHANNEL_TABLE } = require("../../config/setting")
const { access_user } = require('../../utils/marking')
const { getCustomCache, setCustomCache, useCustomCache } = require("../../db/redis")
const { RK_PC_AUTHORITY, RK_BUTTON_AUTHORITY } = require("../../config/redis_key")
const CryptoJs = require("crypto-js")
/**
 * @typedef {Object} query
 * @property {Number} [interface_id] 接口interface_id
 */
/**
 * 
 * @param {query} query 
 * @param {userInfo} userInfo 
 * @param {*} accountIds 有权限的账号ID数组
 * @param {*} filterStatus 是否过滤状态正常的账号
 * @returns 
 */
async function getPermission(query, userInfo, accountIds = [], filterStatus = true) {
    let { id: account_id } = userInfo || {}
    let redis_key = `${RK_PC_AUTHORITY}${account_id}:${String(filterStatus)}:${CryptoJs.MD5(JSON.stringify(query)).toString()}`
    return await useCustomCache(redis_key, async () => {
        return await PermissionModel(query, userInfo, accountIds, filterStatus)
    }, 600, false, true)
}
/**
 * @typedef {Object} userInfo
 * @property {Number} [id] 账户ID
 * @property {Number} [oem_id] oem_id
 * @property {String} [role_ids] role_ids 角色ID 逗号分割
 */
/**
 * 获取用户按钮权限
 * @param {Array} interface_ids 
 * @param {userInfo} userInfo 
 * @returns {Boolean} true or error 是否有权限
 */
async function getBottonPermission(interface_ids = [], userInfo = {}) {
    if (!interface_ids?.length) return Promise.reject('查询的按钮ID不存在！')
    let { id: account_id, role_ids } = userInfo || {}
    if (!account_id) return Promise.reject('查询的用户不存在！')
    if (!role_ids) return Promise.reject('用户角色不存在！')
    const redis_key = `${RK_BUTTON_AUTHORITY}${account_id}`
    let auth_interface_ids = await useCustomCache(redis_key, async () => {
        return await PermissionModel({ interface_id: 1 }, userInfo, null, true, true)
    })
    if (!auth_interface_ids) return true
    let set_val = new Set(interface_ids)
    let find_item = auth_interface_ids.find(item => set_val.has(item))
    if (!find_item) return Promise.reject('暂无权限！')
    return true
}
// getBottonPermission([1, 2], { oem_id: 1, id: 10014771, role_ids: '3,6' })
async function PermissionModel(query, userInfo, accountIds = [], filterStatus = true, return_auth_router = false) {
    //公司超管不控制
    let auth_info = await knex(OEM_TABLE).select('root_user_id').where('id', userInfo.oem_id || 0)
    let company_super_account = auth_info.length && auth_info[0].root_user_id == userInfo.id
    if (access_user.includes(userInfo.id) || company_super_account) return accountIds

    if (!query.interface_id) throw new Error("未设置接口ID(interface_id)！");
    let interface_id = Number(query.interface_id);

    let accountPermission = await knex(ACTINFO_TABLE).select('auth_type', 'auth_data', 'auth_router').where({
        account_id: query.account_id || userInfo.id
    });
    // 数据权限 auth_type 1：为角色权限，到mkt_main_role表查询auth_data, 2: 为用户权限，到account_info 表查auth_data
    let auth_type = 1, auth_data = [], auth_router = [];

    if (accountPermission && accountPermission[0]) auth_type = accountPermission[0].auth_type;

    if (auth_type == 2) {
        auth_data = JSON.parse(accountPermission[0].auth_data || [])
        auth_router = JSON.parse(accountPermission[0].auth_router || [])
    } else {
        let role_ids = userInfo.role_ids.split(',')
        let roleInfo = await knex(ROLE_TABLE).select('auth_data', 'auth_router').where({ oem_id: userInfo.oem_id, status: 1 }).whereIn('id', role_ids)
        roleInfo.forEach(i => auth_router = auth_router.concat(JSON.parse(i.auth_router || '[]')))
        auth_data = roleInfo.length && handler.dealAuthData(roleInfo.map(item => item.auth_data))
    }
    if (return_auth_router) return auth_router //获取所有有权限的interface_id
    let index = auth_data.findIndex(item => item.interface_id == interface_id)
    if (!auth_data.length || index == -1) {
        throw new Error('您暂无权限访问！')
    } else {
        let auth_type = auth_data[index].type
        await handler.permissionControl(accountIds, userInfo, auth_type, filterStatus)
    }
    return accountIds
}
async function getPermissionByinterfaceIds(interface_ids = [], userInfo) {
    if (!interface_ids.length) Promise.reject('未设置接口ID')
    let permission_mapper = {}
    let all = interface_ids.map((interface_id) => {
        let accountIds = []
        return getPermission({ interface_id }, userInfo, accountIds)
            .then(() => {
                if (accountIds.length) permission_mapper[interface_id] = accountIds
                else permission_mapper[interface_id] = null
            })
            .catch(() => {
                permission_mapper[interface_id] = []
            })
    })
    await Promise.all(all)
    return permission_mapper
}
async function onlyControlInterface(query, userInfo) {
    let auth_info = await knex(OEM_TABLE).select('root_user_id').where('id', userInfo.oem_id || 0)
    let company_super_account = auth_info.length && auth_info[0].root_user_id == userInfo.id
    if (access_user.includes(userInfo.id) || company_super_account) return
    if (!query.interface_id) throw new Error("未设置接口ID！");
    let interface_id = Number(query.interface_id);

    let accountPermission = await knex(ACTINFO_TABLE).select('auth_type', 'auth_data').where({
        account_id: query.account_id || userInfo.id
    });
    let auth_type = 1, auth_data = [];
    if (accountPermission && accountPermission[0]) {
        auth_type = accountPermission[0].auth_type;
    }

    if (auth_type == 2) {
        auth_data = JSON.parse(accountPermission[0].auth_data || [])
    } else {
        let role_ids = userInfo.role_ids.split(',')
        let roleInfo = await knex(ROLE_TABLE).select('auth_data').where({
            oem_id: userInfo.oem_id
        }).whereIn('id', role_ids)
        auth_data = roleInfo.length && handler.dealAuthData(roleInfo.map(item => item.auth_data))
    }

    let index = auth_data.findIndex(item => item.interface_id == interface_id)
    if (!auth_data.length || index == -1) {
        throw new Error('您暂无权限访问！')
    }
}

// async function searchAccountTree(account, userInfo, filterStatus = true) {
//     let result = [...account]
//     let sql = knex.select('distinct r.post_id as post_id').whereIn('a.id', result).from(ACCOUNT_TABLE + ' as a')
//         .leftJoin(ROLE_TABLE + ' as r', 'a.role_id', 'r.role_id')
//     let post_id = (await knex.raw(sql.toQuery().replace(/`/g, '')))[0]
//     let post_ids = []
//     post_id.forEach(item => {
//         if (item.post_id) post_ids.push(...JSON.parse(item.post_id))
//     })
//     post_ids = [...new Set(post_ids)]
//     await handler.parentAccountIds(result, userInfo, post_ids, filterStatus)
//     return [...new Set(result)]
// }

async function checkProjectPermi(interface_id, advertiser_type, userInfo) {
    // if (process.env.NODE_ENV == "production") return; // 目前仅测试

    if (access_user.includes(userInfo.id)) return;
    if (!interface_id) throw "未设置接口ID(interface_id)！";
    const permi_ads = await getProjectPermission(interface_id, userInfo);
    if (!permi_ads.length) return
    if (!permi_ads.includes(+advertiser_type)) {
        throw "暂无访问权限！请勿非法访问";
    }
}

async function queryChannelAuth(userInfo, type = 'all') {
    let response = {
        manage_router: [], applet_router: []
    };
    let columns = ['applet_router', 'manage_router']
    if (type == 'pc') {
        columns = ['manage_router']
    } else if (type = 'applet') {
        columns = ['applet_router']
    }
    let data = (await knex(CHANNEL_TABLE).where('id', userInfo.channel_id).select(columns).andWhere({ oem_id: userInfo.oem_id, status: 1 }))[0];
    if (data?.manage_router) {
        response.manage_router = JSON.parse(data.manage_router);
    }
    if (data?.applet_router) {
        response.applet_router = JSON.parse(data.applet_router);
    }
    return response
}

let handler = {
    // 自己及下级
    async getPersonAccountIds(userInfo, result, filterStatus = true) {
        let { oem_id = 1, id: account_id, account_type } = userInfo || {}
        if (account_type && account_type == 1) return result.push(account_id)
        let all_account = await knex(ACCOUNT_TABLE).select('id', 'direct_leader as pid')
            .where({ oem_id }).where('direct_leader', '!=', 0)
            .where(builder => {
                if (filterStatus) builder.where({ status: 1 })
                if (account_type == 2) builder.where({ direct_leader: account_id }) //投顾时，只查自己的下级
            })
        let mapper = {}
        for (let index = 0; index < all_account.length; index++) {
            let item = all_account[index]
            let { id, pid } = item;
            if (!pid) continue
            if (mapper[pid]) mapper[pid].push(id)
            else mapper[pid] = [id]
        }
        function findChild(id, result) {
            if (mapper[id]) return mapper[id].forEach(cid => {
                result.push(cid)
                findChild(cid, result)
            })
            else return []
        }
        findChild(account_id, result)
        result.push(account_id)
    },
    /* async getPersonAccountIds(userInfo, result, filterStatus = true) {
        await getAllChildren(userInfo.id, result)
        result.push(userInfo.id)

        // 获取所有下级
        async function getAllChildren(userId, result) {
            const children = await getNextChildren(userId);
            if (!children.length) {
                return;
            }
            for (let child of children) {
                result.push(child);
                await getAllChildren(child, result);
            }
        }

        // 获取直属下级
        async function getNextChildren(userId) {
            const childrenArr = await knex(ACCOUNT_TABLE).select('id').where({
                'direct_leader': userId,
                "oem_id": userInfo.oem_id,
            }).andWhere(builder => {
                if (filterStatus) {
                    builder.where({ 'status': 1 })
                }
            })
            const childId = childrenArr.map(item => item.id)
            if (childId.length) {
                return childId;
            } else {
                return [];
            }
        }
    }, */
    //自己及上级
    // async parentAccountIds(result, userInfo, post_ids = [], filterStatus = true) {
    //     let account = [...result]

    //     await getAllParent(account, filterStatus)
    //     // 获取所有上级
    //     async function getAllParent(account) {
    //         const parent = await getParent(account);
    //         if (!parent.length) {
    //             return;
    //         }
    //         for (let i = 0, len = parent.length; i < len; i++) {
    //             result.push(parent[i]);
    //             await getAllParent([parent[i]], filterStatus);
    //         }
    //     }

    //     // 获取直属上级
    //     async function getParent(account, filterStatus = true) {
    //         let sql = ''
    //         if (post_ids.length) {
    //             sql = knex.select('direct_leader').where({
    //                 "a.oem_id": userInfo.oem_id
    //             })

    //                 .from(ACCOUNT_TABLE + ' as a')
    //                 .leftJoin(ROLE_TABLE + ' as r', 'a.role_id', 'r.role_id')
    //                 .whereIn('a.id', account).whereNotNull('direct_leader')
    //                 .andWhere(builder => {
    //                     for (let i = 0, len = post_ids.length; i < len; i++) {
    //                         builder.orWhereRaw(`JSON_CONTAINS(r.post_id->>'$[*]',JSON_ARRAY(${post_ids[i]}))`)
    //                     }
    //                 })
    //         } else {
    //             sql = knex(ACCOUNT_TABLE).select('direct_leader').where({
    //                 "oem_id": userInfo.oem_id,
    //             }).whereIn('id', account).whereNotNull('direct_leader');
    //         }
    //         if (filterStatus) {
    //             sql.where({ 'a.status': 1 })
    //         }
    //         const parentArr = (await knex.raw(sql.toQuery().replace(/`/g, '')))[0]
    //         const parentIds = parentArr.map(item => item.direct_leader)
    //         if (parentIds.length) {
    //             return parentIds;
    //         } else {
    //             return [];
    //         }
    //     }
    // },
    // 角色
    // async getRoleAccountIds(userInfo, result, filterStatus = true) {
    //     let sameRoleAccounts = await knex(ACCOUNT_TABLE).select('id', 'oem_id').where({
    //         'role_id': userInfo.role_id,
    //         'oem_id': userInfo.oem_id,
    //     }).andWhere(builder => {
    //         if (filterStatus) {
    //             builder.where({ 'status': 1 })
    //         }
    //     })
    //     for (let i = 0; i < sameRoleAccounts.length; i++) {
    //         handler.getPersonAccountIds(sameRoleAccounts[i], result, filterStatus)
    //     }
    // },
    // 部门
    async getDepartmentAccountIds(userInfo, result, filterStatus = true) {
        let department = userInfo.department ? JSON.parse(userInfo.department) : []
        let sqlKnex = knex(ACCOUNT_TABLE).select('id', 'department')
        if (filterStatus) sqlKnex.where({ 'status': 1 })
        sqlKnex.where(builder => {
            for (let index = 0; index < department.length; index++) {
                const element = department[index];
                if (index == 0) builder.whereRaw(`JSON_CONTAINS(department,JSON_ARRAY(${element}))`)
                else builder.orWhere(knex.raw(`JSON_CONTAINS(department,JSON_ARRAY(${element}))`))
            }
        })
        let data = (await sqlKnex).map(item => item.id)
        if (!data.length) return
        let child = [], times = 0
        do {
            let childKnex = knex(ACCOUNT_TABLE).select('id')
            if (filterStatus) childKnex.where({ 'status': 1 })
            if (times == 0) childKnex.whereIn('direct_leader', data).whereNotIn('id', result)
            else childKnex.whereIn('direct_leader', child).whereNotIn('id', result)
            child = (await childKnex).map(i => i.id)
            times++
            result.push(...child)
        } while (times <= 6 && child.length);
        result.push(...data)
    },
    async permissionControl(accountIds, userInfo, auth_type, filterStatus = true) {
        if (auth_type) {
            switch (auth_type) {
                case 1:  // 仅自己（自己及所有下级）
                    await handler.getPersonAccountIds(userInfo, accountIds, filterStatus);
                    break;
                // case 2: // 角色（同角色及所有下级）
                //     await handler.getRoleAccountIds(userInfo, accountIds, filterStatus);
                //     break;
                case 3: // 部门
                    await handler.getDepartmentAccountIds(userInfo, accountIds, filterStatus);
                    break;
                case 4:  // 公司
                    // accountIds = []
                    break;
                default:
                    throw new Error('您暂无权限访问！')
            }
        } else {
            throw new Error('您暂无权限访问！')
        }
    },
    //处理数据权限
    dealAuthData(arr = []) {
        if (arr.length <= 1) return JSON.parse(arr || '[]')
        let map = new Map()
        arr.forEach(item => {
            let dataArr = JSON.parse(item || '[]')
            dataArr.forEach(dItem => {
                //map中已有此interface_id 且 已有>当前时不需要处理原map
                if (!(map.has(dItem.interface_id) && map.get(dItem.interface_id) > dItem.type)) map.set(dItem.interface_id, dItem.type)
            })
        })
        let result = [...map].map(([k, v]) => {
            return { interface_id: k, type: v }
        })
        return result
    }
}

function peopleFilter(accountIds, builder, table, table2) {
    builder.where(`${table}.manager_id`, 'in', accountIds)
        .orWhere(builder => {
            if (table2) {
                builder.where(`${table2}.editor_director`, 'in', accountIds)
                    .orWhere(`${table2}.post_production`, 'in', accountIds)
                    .orWhere(`${table2}.pat_cut`, 'in', accountIds)
            }
        })
        .orWhere(`${table}.saler_user_id`, 'in', accountIds)
        .orWhere(builder => {
            for (let index = 0; index < accountIds.length; index++) {
                const element = accountIds[index];
                if (index == 0) builder.whereRaw(`JSON_CONTAINS(leader,JSON_ARRAY(${element}))`)
                else builder.orWhere(knex.raw(`JSON_CONTAINS(leader,JSON_ARRAY(${element}))`))
            }
        }).orWhere(builder => {
            for (let index = 0; index < accountIds.length; index++) {
                const element = accountIds[index];
                if (index == 0) builder.whereRaw(`JSON_CONTAINS(pat_cut_leader,JSON_ARRAY(${element}))`)
                else builder.orWhere(knex.raw(`JSON_CONTAINS(pat_cut_leader,JSON_ARRAY(${element}))`))
            }
        })
    // .orWhere(builder => {
    //     for (let index = 0; index < accountIds.length; index++) {
    //         const element = accountIds[index];
    //         if (index == 0) builder.whereRaw(`JSON_CONTAINS(director_visible,JSON_ARRAY(${element}))`)
    //         else builder.orWhere(knex.raw(`JSON_CONTAINS(director_visible,JSON_ARRAY(${element}))`))
    //     }
    // })
}

async function getGroupAccountId(userInfo, accountIds = [], filterStatus = true) {
    await handler.getPersonAccountIds(userInfo, accountIds, filterStatus);
    return accountIds
}
async function getChildrenByPermission(userInfo, accountIds = [], filterStatus = true) {
    //公司超管不控制
    let { oem_id, id: account_id } = userInfo || {}
    let auth_info = (await knex(OEM_TABLE).select('root_user_id').where('id', oem_id))[0]
    let company_super_account = auth_info && auth_info.root_user_id == account_id
    if (access_user.includes(account_id) || company_super_account) return null
    //这个时候是超管或公司管理员权限 不返回有权限的account_id
    let data_type = (await knex.max('rol.applet_data_type as applet_data_type')
        .from(`${ACCOUNT_ROLE} as acr`)
        .leftJoin(`${ROLE_TABLE} as rol`, 'acr.role_id', 'rol.id')
        .where({ "rol.oem_id": oem_id, "acr.account_id": account_id, "acr.status": 1 }))[0]
    if (!data_type) return Promise.reject('暂无访问权限！')
    // console.log(data_type);
    if (data_type.applet_data_type == 4) return null
    //这个时候是公司的数据权限 不返回有权限的account_id
    await handler.permissionControl(accountIds, userInfo, data_type.applet_data_type, filterStatus)
    accountIds.push(account_id)
    return [...new Set(accountIds)]
}


function isIdsCanOperate(account_ids, operate_ids, user_info) {
    const { id: account_id, account_type } = user_info;

    if (!Array.isArray(operate_ids)) operate_ids = [operate_ids];

    // 博主只能操作自己
    if (account_type == 1) {
        if (operate_ids.some(v => v != account_id)) {
            throw '非法操作，已记录您的信息！'
        }
    }

    if (account_ids?.length) {
        const acc_set = new Set(account_ids);
        if (operate_ids.some(v => !acc_set.has(v))) {
            throw '禁止操作！'
        }
    }

    return true;
}

async function getChildrenByPermissionPc(userInfo, accountIds = [], filterStatus = true) {
    //公司超管不控制
    let { id: account_id } = userInfo || {}
    let redis_key = `${RK_PC_AUTHORITY}${account_id}:${String(filterStatus)}`
    return await useCustomCache(redis_key, async () => {
        return await await PcPermissionModel(userInfo, accountIds, filterStatus)
    }, 600, false, true)
}
async function PcPermissionModel(userInfo, accountIds = [], filterStatus = true) {
    let { oem_id, id: account_id } = userInfo || {}
    let auth_info = (await knex(OEM_TABLE).select('root_user_id').where('id', oem_id))[0]
    let company_super_account = auth_info && auth_info.root_user_id == account_id
    if (access_user.includes(account_id) || company_super_account) return null
    //这个时候是超管或公司管理员权限 不返回有权限的account_id
    let data_type = (await knex.max('rol.data_type as data_type')
        .from(`${ACCOUNT_ROLE} as acr`)
        .leftJoin(`${ROLE_TABLE} as rol`, 'acr.role_id', 'rol.id')
        .where({ "rol.oem_id": oem_id, "acr.account_id": account_id, "acr.status": 1 }))[0]
    if (!data_type) return Promise.reject('暂无访问权限！')
    // console.log(data_type);
    if (data_type.data_type == 4) return null
    //这个时候是公司的数据权限 不返回有权限的account_id
    await handler.permissionControl(accountIds, userInfo, data_type.data_type, filterStatus)
    accountIds.push(account_id)
    return [...new Set(accountIds)]
}
module.exports = {
    getPermission,
    peopleFilter,
    onlyControlInterface,
    // searchAccountTree,
    getGroupAccountId,
    getPermissionByinterfaceIds,
    getChildrenByPermission,
    isIdsCanOperate,
    checkProjectPermi,
    queryChannelAuth,
    getChildrenByPermissionPc,
    getBottonPermission
}
