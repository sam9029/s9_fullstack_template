// const Config = require("@alicloud/openapi-client");
// const CloudAuth = require("@alicloud/cloudauth20190307");
// const CloudAuthClient = CloudAuth.default;
// const { RuntimeOptions } = require("@alicloud/tea-util");
// const { default: Credential } = require('@alicloud/credentials');
const { real_name, production_url } = require("../../../config");
const { checkKeys } = require("../../../utils/check_type");


function createClient(endpoint) {
    // 阿里云账号AccessKey拥有所有API的访问权限，建议您使用RAM用户进行API访问或日常运维。
    // 强烈建议不要把AccessKey ID和AccessKey Secret保存到工程代码里，否则可能导致AccessKey泄露，威胁您账号下所有资源的安全。
    // 本示例通过阿里云Credentials工具从环境变量中读取AccessKey，来实现API访问的身份验证。
    // const cred = new Credential();
    const config = new Config.Config({
        accessKeyId: real_name.accessKeyId,
        accessKeySecret: real_name.accessKeySecret,
        // credential: cred,
        endpoint: endpoint,
    });
    return new CloudAuthClient(config);
}

async function initFaceVerify(endpoint, request) {
    const client = createClient(endpoint);
    // 创建RuntimeObject实例并设置运行参数。
    const runtime = new RuntimeOptions([]);
    runtime.readTimeout = 10000;
    runtime.connectTimeout = 10000;
    return await client.initFaceVerifyWithOptions(request, runtime);
}

// async function initFaceVerifyAutoRoute(request) {
//     const endpoints = [
//         "cloudauth.cn-beijing.aliyuncs.com",
//         "cloudauth.cn-shanghai.aliyuncs.com",
//     ];

//     for (const endpoint of endpoints) {
//         const response = await initFaceVerify(endpoint, request);
//         if (response.statusCode === 500) continue;
//         if (response?.body?.code === 500) continue;
//         return response;
//     }
//     return null;
// }

async function describeFaceVerify(endpoint, request) {
    const client = createClient(endpoint);
    // 创建RuntimeObject实例并设置运行参数。
    const runtime = new RuntimeOptions([]);
    runtime.readTimeout = 10000;
    runtime.connectTimeout = 10000;
    return await client.describeFaceVerifyWithOptions(request, runtime);
}
/**
 * 
 * @param {CloudAuth.initFaceVerify} request 
 * @param {Function} fun 
 * @returns 
 */
async function faceVerifyAutoRoute(request, fun = null) {
    const endpoints = [
        "cloudauth.cn-beijing.aliyuncs.com",
        "cloudauth.cn-shanghai.aliyuncs.com",
    ];

    for (const endpoint of endpoints) {
        const response = await fun(endpoint, request);
        if (response.statusCode === 500) continue;
        if (response?.body?.code === 500) continue;
        return response;
    }
    return null;
}

/**
 * @typedef { Object } CertifyIdObj
 * @property { String } [outerOrderNo]
 * @property { String } [certName]
 * @property { String } [certNo]
 * @property { String } [metaInfo]
 */

/**
 * 获取用户实名认证 CertifyId
 * @param { CertifyIdObj } [data={}] 
 */
async function getCertifyId(data = {}) {
    let { outerOrderNo, certName, certNo, metaInfo } = checkKeys(data, ['outerOrderNo', 'certName', 'certNo', 'metaInfo'])
    const request = new CloudAuth.InitFaceVerifyRequest({
        // 请输入场景ID。
        sceneId: real_name.sceneId,
        // 设置商户请求的唯一标识。
        outerOrderNo,
        // 要接入的认证方案。
        productCode: "ID_PLUS",
        // 模式。
        model: "MULTI_ACTION",
        certType: "IDENTITY_CARD",
        certName,
        certNo,
        metaInfo,
        callbackUrl: `${production_url}/public/callback/ali_real_name`,
        // mobile: "130xxxxxxxx",
        // ip: "114.xxx.xxx.xxx",
        // userId: "12345xxxx",
        // callbackToken: "xxxxxxx",
        // 如需开启个人信息加密传输。
        // encryptType: "SM2",
        // certName: "BCRD/7ZkNy7Q*****M1BMBezZe8GaYHrLwyJv558w==",
        // certNo: "BMjsstxK3S4b1YH*****Pet8ECObfxmLN92SLsNg=="
    });

    // 推荐，支持服务路由。
    const response = await faceVerifyAutoRoute(request, initFaceVerify);
    // 不支持服务自动路由。
    // const response = await initFaceVerify("cloudauth.cn-shanghai.aliyuncs.com", request);
    // console.log(response?.body)
    if (response?.body?.code != 200) return Promise.reject(response?.body?.message || '未知异常！')
    // {
    // console.log(response);
    // console.log(response.body.requestId);
    // console.log(response.body.code);
    // console.log(response.body.message);
    // console.log(response.body);
    // }
    if (!response?.body || !response?.body?.resultObject) return Promise.reject('未获取到认证平台响应！')
    return response.body.resultObject
}
/**
 * @typedef {Object} CertifyResultObj
 * @property {String} [certifyId]
 */
/**
 * 
 * @param {CertifyResultObj} data 
 * @returns 
 */
async function getCertifyResult(data = {}) {
    let { certifyId } = checkKeys(data, ['certifyId'])
    const request = new CloudAuth.DescribeFaceVerifyRequest({
        sceneId: real_name.sceneId,
        certifyId
    });
    // 推荐，支持服务路由。
    const response = await faceVerifyAutoRoute(request, describeFaceVerify);
    // console.log(response?.body)
    if (response?.body?.code != 200) return Promise.reject(response?.body?.message || '未知异常！')
    if (!response?.body || !response?.body?.resultObject) return Promise.reject('未获取到认证平台响应！')
    return response.body.resultObject
}

module.exports = {
    getCertifyId,
    getCertifyResult
}