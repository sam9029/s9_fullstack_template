const request = require("../../request")
const qs = require('qs');
// const utils = require("../../../model/public/externalMedia/utils")
const { getUuid } = require('../../tools')
const { sign_params } = require("./sign")
const path = require('path');
const { cert_path } = require("../../../config");

const DOMAIN = process.env.NODE_ENV == "production" ? 'https://api.yunqiandou.com/api' : 'http://test.api.yunqiandou.com/api';

// 查询企业
async function getCompanyInfo(data = {}, path = "/company/info") {
    const params = sign_params(data);
    return request({
        url: DOMAIN + path,
        method: "POST",
        data: params,
    }).then(res => {
        console.log(res)
        if (res.code != '0') {
            throw res.msg;
        }
        return res.data;
    })
}

async function getCompanyBalance(data = {}, path = "/company/balance") {
    const params = sign_params(data);
    return request({
        url: DOMAIN + path,
        method: "POST",
        data: params,
    }).then(res => {
        if (res.code != '0') {
            throw res.msg;
        }
        return res.data;
    })
}

// 新增用户
async function userMakeSign(data = {}, path = '/user') {
    const params = sign_params(data);
    let res = await request({
        url: DOMAIN + path,
        method: 'POST',
        no_need_retry: true,
        data: params
    })
    if (res.code != '0') {
        throw res.msg;
    }
    return res.data;
}

// 查询用户
async function userQuery(data = {}, path = '/user/query') {
    const params = sign_params(data);
    let res = await request({
        url: DOMAIN + path,
        method: 'POST',
        data: params
    })
    if (res.code != '0') {
        throw res.msg;
    }
    return res.data;
}

// 新增发放任务
async function addPayTask(data, path = "/pay/task") {
    if (!data.name) return Promise.reject('请传入发放任务名称');
    const params = sign_params(data);
    let res = await request({
        url: `${DOMAIN}${path}`,
        method: 'post',
        data: params
    })
    // {
    //     code: 0,
    //     msg: 'success',
    //     data: { no: '201607092893', batchNo: '2024080617263230693' }
    //   }
    if (res.code != '0') {
        return res;
        // throw res.msg;
    }
    return res.data;
}

// 查询发放任务结果
async function taskQuery(data = {}, path = '/pay/task/query') {
    const params = sign_params(data);
    let res = await request({
        url: `${DOMAIN}${path}`,
        method: 'POST',
        no_need_retry: true,
        data: params
    })
    if (res.code != '0') {
        throw res.msg;
    }
    return res.data;
}

// 新增发放明细
async function addTaskInfo(data = {}, path = '/task/info') {
    const params = sign_params(data);
    let res = await request({
        url: `${DOMAIN}${path}`,
        method: 'POST',
        data: params
    })
    if (res.code != '0') {
        return res;
        // throw res.msg;
    }
    return res.data;
}

// 查询发放明细结果
async function taskInfoQuery(data = {}, path = '/task/info/query') {
    const params = sign_params(data);
    let res = await request({
        url: `${DOMAIN}${path}`,
        method: 'POST',
        data: params
    })
    if (res.code != '0') {
        throw res.msg;
    }
    return res.data;
}

// 确认发放任务
async function taskConfirm(data = {}, path = '/pay/task/confirm') {
    const params = sign_params(data);
    let res = await request({
        url: `${DOMAIN}${path}`,
        method: 'POST',
        data: params
    })
    if (res.code != '0') {
        return res;
        // throw res.msg;
    }
    return res.data;
}

// 删除发放任务
async function taskDelete(data = {}, path = '/pay/task/delete') {
    const params = sign_params(data);
    let res = await request({
        url: `${DOMAIN}${path}`,
        method: 'POST',
        data: params
    })
    if (res.code != '0') {
        throw res.msg;
    }
    return res.data;
}
module.exports = {
    getCompanyInfo,
    getCompanyBalance,
    userMakeSign,
    userQuery,
    addPayTask,
    taskQuery,
    addTaskInfo,
    taskInfoQuery,
    taskConfirm,
    taskDelete,
    DOMAIN
}
// getCompanyInfo().then(res => console.log(res)).catch(err => console.log(err))
// getCompanyBalance().then(res => console.log(res)).catch(err => console.log(err))
// userMakeSign({ idNumber: '519099091889898898989', mobile: '183111111111', realName: '张伟'  }).then(res => console.log(res)).catch(err => console.log(err))
// userQuery({ idNumber: '519099091889898898989' }).then(res => console.log(res)).catch(err => console.log(err))

// addPayTask({ name: "测试任务4" }).then(res => console.log(res)).catch(err => console.log(err))
// taskQuery({ batchNo: '202408061840331cd16' }).then(res => console.log(res)).catch(err => console.log(err))
// addTaskInfo({ batchNo: '202408061840331cd16', uid: 100089081, amount: 20, idNumber: '530423199507141621', accountNo: '18328086203', accountName: '王舒瑜', bankMobile: '18328086203', bankName: '支付宝' }).then(res => console.log(res)).catch(err => console.log(err))
// taskInfoQuery({ taskInfoBatchNo: '2024080618412681595'}).then(res => console.log(res)).catch(err => console.log(err))
// taskConfirm({ batchNo: '202408061840331cd16' }).then(res => console.log(res)).catch(err => console.log(err))
// taskDelete({ batchNo: '202408061840331cd16' }).then(res => console.log(res)).catch(err => console.log(err))