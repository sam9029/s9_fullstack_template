//该代码将生产环境的 static 目录上传到CND
const fs = require("fs")
const path = require("path")
const OSS = require("ali-oss");
const wangsu = 'https://wangsu.lizhibj.cn/open-img/cdn/'
const aliyun = 'https://koc-img.lizhibj.cn/cdn/'
const project_name = 'scaffold' // 需要针对服务器部署文件夹修改，此处默认 scaffold 仅作演示
const minio = require('minio');
const dotenv = require('dotenv')

// console.log(public_setting);
// https://koc-img.lizhibj.cn cdn 主域名
let bucket = {
    internal: false,//是否使用阿里云内网访问，默认false。比如通过ECS访问OSS，则设置为true，采用internal的endpoint可节约费用。
    publicHost: 'https://koc-img.lizhibj.cn/',//域名替换时使用的公网域名
    host: 'https://koc-img.lizhibj.cn/',//线上部署时使用内网OSS加快访问速度
    region: 'oss-cn-beijing',
    accessKeyId: 'noneKey',
    accessKeySecret: 'noneKey',
    bucket: 'koc-img'
}
let minioBucket = {
    endPoint: 'minio.lizhibj.cn', //本地IP多线路1
    port: 8000,
    useSSL: false,
    accessKey: 'noneKey',
    secretKey: 'noneKey',
    openBucketName: 'open-img'
}
const minioClient = new minio.Client(minioBucket)

function readFileList(file_path, filesList) {
    var files = fs.readdirSync(file_path);
    files.forEach(function (itm, index) {
        var stat = fs.statSync(file_path + itm);
        if (stat.isDirectory()) {//递归读取文件
            readFileList(file_path + itm + "/", filesList)
        } else {
            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = file_path;//路径
            obj.filename = itm//名字
            obj.ossfilename = 'cdn/' + project_name + '/static/' + String(file_path).replace(String(path.join(__dirname, '../dist/static/')), '') + itm
            filesList.push(obj);
        }
    })
}
const store = new OSS(bucket);
async function uploadCdn() {
    let file_path = path.join(__dirname, '../dist/static/')
    if (!fs.existsSync(file_path)) throw new Error('打包文件目录不存在！')
    let files = []
    readFileList(file_path, files)
    // console.log(files);
    await uploadFiles(files)
    console.log('CDN文件上传完毕！');
}


/**
 * Minio上传执行
 * */ 
async function ExecMinioClientUpload(_item) {
    let bucketName = minioBucket.openBucketName
    let objectName = minioBucket.public_path + _item.ossfilename
    let filePath =  `${_item.path + _item.filename}`
    // 使用Promise包裹原生回调接口
    return await minioClient.fPutObject(bucketName, objectName, filePath)
}

/**
 * 重试机制上传函数
 * */ 
const MAX_RETRY = 3 // 最大重试次数
async function uploadWithRetry(_item, retryCount = 0){
    try {
        return await ExecMinioClientUpload(_item)
    } catch (err) {
        if (retryCount >= MAX_RETRY) {
            console.error(`文件 ${_item.filename} 上传失败，已达最大重试次数`)
            throw err
        }
        console.warn(`文件 ${_item.filename} 上传失败，开始第 ${retryCount+1} 次重试`)
        return await uploadWithRetry(_item, retryCount + 1)
    }
}

async function uploadFiles(files) {
    if (!files || !files.length) return
    const env = loadEnv('production');
    const ConcurrentNum = 5 // 5个一组上传文件
    let len = Math.ceil(files.length / ConcurrentNum)
    for (let index = 0; index < len; index++) {
        console.log(`文件一共有${len}组，正在上传${env?.VUE_CDN_SITE == 'WANGSU' ? '网宿' : '阿里云'}第${index + 1}组`)
        let be_select = files.slice(index * ConcurrentNum, (index + 1) * ConcurrentNum)
        let all_array = be_select.map(async item => {
            if (env?.VUE_CDN_SITE == 'WANGSU') return await uploadWithRetry(item)
            else return await store.putStream(item.ossfilename, fs.createReadStream(`${item.path + item.filename}`))
        })
        await Promise.all(all_array)
    }
}


function loadEnv(mode) {
    if (mode == 'production') return dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.production')))
    else return dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.development')))
}

if (process.argv?.[2] == 'upload') uploadCdn()
module.exports.getCdnHost = (mode) => {
    const env = loadEnv(mode);
    if (mode != 'production') return '/' //测试环境直接使用本地静态文件
    if (env?.VUE_CDN_SITE == 'WANGSU') return `${wangsu}${project_name}/`
    else return `${aliyun}${project_name}/`
}

