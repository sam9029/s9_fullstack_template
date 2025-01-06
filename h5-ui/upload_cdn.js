//该代码将生产环境的 assets 目录上传到CND
const fs = require("fs")
const path = require("path")
const OSS = require("ali-oss");
// const public_setting = require("../vue.config");
// const { Promise } = require("core-js");
const public_path = 'cdn/xgfx_h5/assets/'
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
            obj.ossfilename = public_path + String(file_path).replace(String(path.join(__dirname, './dist/assets/')), '') + itm
            filesList.push(obj);
        }
    })
}
const store = new OSS(bucket);
async function uploadCdn() {
    let file_path = path.join(__dirname, './dist/assets/')
    if (!fs.existsSync(file_path)) throw new Error('打包文件目录不存在！')
    let files = []
    readFileList(file_path, files)
    // console.log(files);
    await uploadFiles(files)
    console.log('CDN文件上传完毕！');
}
async function uploadFiles(files) {
    if (!files || !files.length) return
    const ConcurrentNum = 5 // 5个一组上传文件
    let len = Math.ceil(files.length / ConcurrentNum)
    for (let index = 0; index < len; index++) {
        console.log(`文件一共有${len}组，正在上传第${index + 1}组`)
        let be_select = files.slice(index * ConcurrentNum, (index + 1) * ConcurrentNum)
        let all_array = be_select.map(async item => {
            return store.putStream(item.ossfilename, fs.createReadStream(`${item.path + item.filename}`))
        })
        await Promise.all(all_array)
    }
}
uploadCdn()

