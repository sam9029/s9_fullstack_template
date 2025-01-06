const OSS = require('ali-oss');
const { UPLOAD_LOG_TABLE } = require('../../config/setting')
const { getUuid, getUrlPath, bufferToStream, replaceUrlOrigin } = require("../../utils/tools")
const request = require("../../utils/request")
const { isEmpty } = require("../../utils/check_type")
const ExcelJS = require('exceljs');
const knex = require("../../db/knexManager").knexProxy;
const { bucket, materialBucket, duolaiBucket, production_url } = require('../../config/index')
const store = new OSS(bucket);
const materialStore = new OSS(materialBucket)
const duolaiStore = new OSS(duolaiBucket)
const publicHost = bucket.publicHost;
const xlsx = require('xlsx');
const crypto = require('crypto');
const sts = new OSS.STS(bucket);
const replace_host = ['.aliyuncs.com', '-internal.aliyuncs.com'].map(i => materialBucket.region + i)
const oss_host = 'lizhibj.cn'
const multer = require('multer');
const { isObject } = require('lodash');
const uploadSingle = multer().single('file');
const moment = require('moment');

function getFileName(originalName) {
    const index = originalName.lastIndexOf(".");
    if (index < 0) return getUuid() // 没有后缀的时候
    let suffix = originalName.substring(index);
    suffix = suffix.toLocaleLowerCase();
    return getUuid() + suffix;
}
function getFileMd5Name(originalName, md5 = '') {
    const index = originalName.lastIndexOf(".");
    if (index < 0) return md5 // 没有后缀的时候
    let suffix = originalName.substring(index);
    suffix = suffix.toLocaleLowerCase();
    return md5 + suffix;
}
function getOssKeyByUrl(file) {
    let file_info = JSON.parse(file || '{}')
    let url = file_info.url || ''
    if (!url) return null
    let oss_key = url.split("/").pop()
    return oss_key
}
async function uploadFile(req, userInfo, path_type = false, check_md5 = true) {
    let { md5, name, path_type: path_info } = req.query || {}
    // let oem_id = userInfo.oem_id || 0
    if (!path_type) path_type = path_info
    let file_name = getFileName(name)
    if (path_type) file_name = `${path_type}/${file_name}` //对于用户反馈，明确标识
    // if (path_type == 'avatar') file_name = `avatar/avatar-${file_name}` //对于用户头像，明确标识,存放于avatar文件夹
    // else if (path_type == 'feedback') file_name = `feedback/${file_name}` //对于用户反馈，明确标识
    let result = await store.putStream(file_name, req)
    let real_md5 = String(result.res.headers.etag.toLowerCase().replace(/"/g, ''))
    let oss_key = result.name
    if (check_md5 && real_md5 != md5) { //MD5 不一致，上传失败
        await store.delete(oss_key)
        return Promise.reject('文件校验失败!')
    }
    let back_oss_key = oss_key
    let before_file = (await knex(UPLOAD_LOG_TABLE).select('oss_key').where({ md5: md5 || real_md5 }).limit(1))[0]
    if (before_file) {
        await store.delete(oss_key)
        back_oss_key = before_file.oss_key
    }
    let url = publicHost + back_oss_key
    let upload_log = {
        name,
        md5: md5 || real_md5,
        oss_key: back_oss_key,
        url,
        create_user_id: userInfo.id,
        update_user_id: userInfo.id
    }
    let upload_id = (await knex(UPLOAD_LOG_TABLE).insert(upload_log))[0]
    return {
        identical: before_file ? true : false,
        url,
        upload_id,
        oss_key: back_oss_key
    }
}

async function analysisSheet(url = "", sheet_header = [], requiredTag = false, needSheetName = false, get_image = false, options = {}) {
    // 表头存在'（必填）'字样的，传入requiredTag = true，将同时校验两种表头，例如，表头名称可能为['关键词']，也可能是['关键词（必填）']，
    // 则传入required = true, sheet_header传入sheet_header = ['关键词'];
    if (!url) return Promise.reject('未设置文件URL')
    // let oss_key = url.split('/').pop();
    let oss_key = getUrlPath(url)
    const { content } = await store.get(oss_key);
    // console.log(1, content)
    let result = xlsx.read(content, { type: 'buffer', ...options });
    let data = xlsx.utils.sheet_to_json(result.Sheets[result.SheetNames[0]], { defval: null, ...options });
    if (data && !data.length) return Promise.reject('请先填写数据！')
    let header = Object.keys(data[0]);
    for (let i = 0; i < sheet_header.length; i++) {
        let item = sheet_header[i], requireItem = item + '（必填）'
        if (requiredTag) {
            if (!header.includes(item) && !header.includes(requireItem)) return Promise.reject(`表格缺失「${item}」字段！`);
        } else {
            if (!header.includes(item)) return Promise.reject(`表格缺失「${item}」字段！`)
        }

    }
    if (get_image) {
        let stream = bufferToStream(content)
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.read(stream)
        const worksheet = workbook.worksheets[0]
        for (const image of worksheet.getImages()) {
            console.log('processing image row', image.range.tl.nativeRow, 'col', image.range.tl.nativeCol, 'imageId', image.imageId);
            // fetch the media item with the data (it seems the imageId matches up with m.index?)
            const img = workbook.model.media.find(m => m.index === image.imageId);
            let key = header[image.range.tl.nativeCol]
            if (data[image.range.tl.nativeRow - 1] && key) data[image.range.tl.nativeRow - 1][key] = img
            // data[]
            // console.log(img);
            // fs.writeFileSync(`${image.range.tl.nativeRow}.${image.range.tl.nativeCol}.${img.name}.${img.extension}`, img.buffer);
        }
    }
    if (needSheetName) return { data, sheet_name: result.SheetNames[0] }
    // console.log(data);
    return data;
}

// 将表格转为数组 每行缺失字段在 error 标注
function sheetJsonToData(json_raws, require_headers, options_headers, header_mapper, show_log = false) {
    const data = [];
    for (let i = 0; i < json_raws.length; i++) {
        const raw = json_raws[i];
        const item = {};
        const empty_cols = [];

        for (let i = 0; i < require_headers.length; i++) {
            const h = require_headers[i];
            const prop = header_mapper[h];
            if (!prop) throw "error header map!";
            item[prop] = raw[h];
            if (isEmpty(item[prop])) item[prop] = raw[h + '（必填）'];
            if (isEmpty(item[prop])) empty_cols.push(h);
        }
        options_headers.forEach(h => {
            const prop = header_mapper[h];
            if (prop) item[prop] = raw[h];
        });

        if (empty_cols.length) item.error = empty_cols.join('、') + '为必填项！';
        if (show_log) console.log('sheetJsonToData raw to item', raw, item);
        data.push(item);
    }

    return data;
}
async function uplodImageObj(image = {}, file_path = '') {
    if (!image) return null
    if (!isObject(image)) return image
    let md5 = await getBufferMd5(image.buffer)
    let file_name = `${md5}.${image.extension || 'jpg'}`
    if (file_path) file_name = `${file_path}/${file_name}`
    let { name } = await store.put(file_name, image.buffer)
    let url = publicHost + name
    return url
}
async function getStreamMd5(stream) {
    let md5 = null
    await new Promise((resolve, reject) => {
        const fsHash = crypto.createHash('md5');
        stream.on('data', function (d) {
            fsHash.update(d);
        });
        stream.on('error', function (d) {
            reject(d.message)
        });
        stream.on('end', function () {
            md5 = fsHash.digest('hex');
            return resolve()
        });
    })
    return md5
}
async function checkMd5(oss_key, md5) {
    if (!oss_key || !md5) return Promise.reject('参数错误！')
    let stream = await store.getStream(oss_key)
    let file_md5 = await getStreamMd5(stream)
    if (String(file_md5).toLowerCase() != String(md5).toLowerCase()) return Promise.reject('文件签名不合法！')
    return true
}
/**
 * 仅有OSS文件上传的权限，防止因为权限问题导致被盗刷
 * @returns 
 */
async function getAccess() {
    let roleArc = 'acs:ram::1228945113520611:role/accesssdk'
    let sdk_info = await sts.assumeRole(roleArc, null, 900, 'browser-oss')
    // console.log(sdk_info.credentials);
    return { code: 0, data: sdk_info.credentials }
}
const CONTENT_TYPE_MAPPER = {
    mp4: 'video/mp4',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    mov: 'video/quicktime',
    bmp: 'image/bmp',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    mp3: 'audio/mpeg',
    aac: 'audio/aac',
    unknow: 'application/octet-stream'
}
/**
 * 获取文件上传链接，OSS直传，减小服务器压力
 * @param {string} [filename=''] 文件名，若包含.mp4 类似的，就不要传 mine_type
 * @param {*} mine_type 文件的MIME类型，例如mp4、png 等，不要加 .
 * @param {*} folder 上传文件保存的目录
 * @param {string} [put_bucket='duolai-img'] 上传文件保存的bucket
 * @param {*} userInfo 用户信息
 * @returns 
 */
async function getUploadUrl(filename = '', mine_type = '', folder = '', put_bucket = 'duolai-img', userInfo = {}) {
    let bucket_info = { ...bucket }
    let { id: account_id } = userInfo
    if (put_bucket) bucket_info.bucket = put_bucket
    let file_name = filename
    if (file_name && mine_type) filename += `.${mine_type}`
    if (!filename) filename = `${moment().format('YYYY-MM-DD')}/${getUuid()}` + (mine_type ? `.${mine_type}` : '')
    if (account_id) filename = `${account_id}/` + filename
    if (folder) filename = `${folder}/` + filename
    const client = new OSS({ ...bucket_info, internal: false }); //生产环境返回公网地址
    const url = client.signatureUrl(filename, {
        method: "PUT",
        "Content-Type": CONTENT_TYPE_MAPPER[mine_type] || "application/octet-stream",
    });
    // console.log(url);
    return url
}
/**
 * 获取多来文件上传链接，OSS直传，减小服务器压力
 * @param {*} mine_type 文件的MIME类型，例如mp4、png 等，不要加 .
 * @param {string} [put_bucket='duolai-img'] 上传文件保存的bucket
 * @param {*} oss_key oss_key
 * @returns 
 */
function getDuolaiUploadUrl(mine_type = '', put_bucket = 'duolai-img', oss_key, callback_info = {}) {
    let bucket_info = { ...bucket }
    if (put_bucket) bucket_info.bucket = put_bucket
    const client = new OSS({ ...bucket_info, internal: false }); //生产环境返回公网地址
    let body = { ...callback_info, oss_key }
    let put_obj = {
        method: "PUT",
        expires: 1800,
        "Content-Type": CONTENT_TYPE_MAPPER[mine_type] || "application/octet-stream",
        callback: {
            url: `${production_url}/public/callback/duolai_upload`,
            body: JSON.stringify(body),
            contentType: 'application/json',
        }
    }
    if (process.env.NODE_ENV != "production") delete put_obj.callback
    let url = client.signatureUrl(oss_key, put_obj);
    return { url, oss_key }
}
/**
 * 获取视频、图片原信息
 * @param {*} put_bucket 
 * @param {*} oss_key 
 */
async function getOssMediaInfo(put_bucket = 'duolai-img', oss_key = '', mine_type = 'video') {
    let bucket_info = { ...bucket }
    if (put_bucket) bucket_info.bucket = put_bucket
    const client = new OSS({ ...bucket_info }); //生产环境返回公网地址
    let type = 'other'
    if (['mp4', 'mov', 'mp3'].includes(mine_type)) type = 'video'
    if (['png', 'jpg', 'jpeg', 'bmp'].includes(mine_type)) type = 'image'
    if (type == 'other') {
        let file_info = await client.listV2({ prefix: oss_key, "max-keys": 1 })
        // console.log(file_info.objects[0]);
        if (!file_info.objects[0]) return Promise.reject('文件异常！')
        return {
            file_size: file_info.objects[0]?.size || 0,
            md5: file_info.objects[0]?.etag?.toLowerCase()?.replace(/"/g, '') || 0
        }
    }
    let data = await client.get(oss_key, { process: type == 'video' ? 'video/info' : 'video/info' })
    let info = JSON.parse(data.content?.toString())
    // console.log(info);
    return {
        type,
        duration: info?.Duration || 0,
        height: info?.VideoHeight || 0,
        width: info?.VideoWidth || 0,
        file_size: info?.Size || 0,
        md5: data.res.headers.etag?.toLowerCase()?.replace(/"/g, '') || 0
    }
}
/**
 * 删除oss文件
 * @param {*} put_bucket 
 * @param {*} oss_key 
 */
async function removeOssFile(put_bucket = 'duolai-img', oss_key = '') {
    let bucket_info = { ...bucket }
    if (put_bucket) bucket_info.bucket = put_bucket
    const client = new OSS({ ...bucket_info }); //生产环境返回公网地址
    return await client.delete(oss_key)
}
/**
 * 
 * @param {*} put_bucket OSS 存储名称
 * @param {*} oss_key 
 * @param {Object} tag 设置的标签
 * @returns 
 */
async function setOssMediaTag(put_bucket = 'duolai-img', oss_key = '', tag = {}) {
    let bucket_info = { ...bucket }
    if (put_bucket) bucket_info.bucket = put_bucket
    const client = new OSS({ ...bucket_info }); //生产环境返回公网地址
    return await client.putObjectTagging(oss_key, tag)
}
function getCoverUrl(type = 1, oss_key = '', bucket = 'koc-material') {
    //1 图片 2 视频
    let Store = getStore(bucket)
    if (!oss_key) return null
    let process = {
        expires: 3600,
        process: type == 2 ? 'video/snapshot,t_1000,f_jpg,m_fast' : 'image/resize,h_90/quality,q_90',
        // callback: { host: oss_host }
    }
    if (type == 3) delete process.process
    let url = Store.signatureUrl(oss_key, process)
    replace_host.forEach(i => {
        url = url.replace(i, oss_host)
    })
    return url
    //
}
/**
 * 
 * @param {*} bucket 
 * @returns {OSS}
 */
function getStore(bucket) {
    let Store = store
    switch (bucket) {
        case 'koc-material':
            Store = materialStore
            break;
        case 'duolai-img':
            Store = duolaiStore
            break;
        case 'koc-img':
            Store = store
            break;
        default:
            break;
    }
    return Store
}
/**
 * 获取文件的签名链接
 * @param {*} oss_key oss的文件key
 * @param {String} [bucket='koc-material'] 存储的bucket
 * @param {String} [cdn_host=null] CDN的host 例如同一个bucket有不同的host
 * @returns 
 */
function getOriginalUrl(oss_key = '', bucket = 'koc-material', cdn_host = null, other_info = null) {
    //1 图片 2 视频
    if (!oss_key) return ''
    let Store = getStore(bucket)
    let sign_info = { expires: 3600 }
    if (other_info) sign_info = { ...sign_info, ...other_info }
    let url = Store.signatureUrl(oss_key, sign_info)
    replace_host.forEach(i => {
        url = url.replace(i, oss_host)
    })
    if (cdn_host) url = replaceUrlOrigin(url, cdn_host)
    return url
    // .replace('oss-cn-beijing.aliyuncs.com', oss_host)
}

function getOssUrl(oss_key, bucket) {
    const store = getStore(bucket);
    let object_url = store.getObjectUrl(oss_key, store.options.publicHost);

    replace_host.forEach(i => {
        object_url = object_url.replace(i, oss_host)
    })
    return object_url;
}
function getDownloadUrl(oss_key, file_name, bucket = 'koc-material') {
    if (!oss_key || !file_name) return null
    file_name = `${file_name}.${oss_key.split('.').pop()}`;
    let Store = getStore(bucket)
    // console.log(file_name)
    let url = Store.signatureUrl(oss_key, {
        expires: 1800, //下载链接30分钟有效
        response: {
            "content-disposition": `attachment; filename=${file_name};filename*=UTF-8''${encodeURI(file_name)}`
        }
    });
    replace_host.forEach(i => {
        url = url.replace(i, oss_host)
    })
    return url
}
async function getClientFileMd5(oss_key, client = materialStore) {
    let info = await client.head(oss_key)
    // console.log(info);
    let md5 = ''
    let headers = info.res.headers
    if (headers && headers['x-oss-object-type'] && headers['x-oss-object-type'] == 'Multipart') {
        if (info && info.meta && info.meta.md5) return info.meta.md5
        let stream = (await client.getStream(oss_key)).stream
        md5 = await getStreamMd5(stream)
        await client.putMeta(oss_key, { md5 })
        return md5
    }
    md5 = headers.etag.toLowerCase().replace(/"/g, '')
    return md5
}
async function getStreamMd5(stream) {
    let md5 = null
    await new Promise((resolve, reject) => {
        const fsHash = crypto.createHash('md5');
        stream.on('data', function (d) {
            fsHash.update(d);
        });
        stream.on('error', function (d) {
            reject(d.message)
        });
        stream.on('end', function () {
            md5 = fsHash.digest('hex');
            return resolve()
        });
    })
    return md5
}
async function checkFileMd5(oss_key = '', md5 = '', bucket = 'koc-material') {
    if (!oss_key || !md5) return Promise.reject('文件信息不完整！')
    let Store = getStore(bucket)
    let file_md5 = await getClientFileMd5(oss_key, Store)
    if (file_md5 != md5) return Promise.reject('文件签名信息与文件不一致！')
    return true
}
// checkFileMd5('koc_task_dev/452580566ec742df81f342cf048c6a9a.mp4', 'hffrkfkr')
async function getBufferMd5(buffer) {
    let md5 = crypto.createHash('md5').update(buffer).digest('hex')
    return md5
}
async function upload(req, userInfo = {}, res) {
    let data = await new Promise((resolve, reject) => {
        uploadSingle(req, res, (err) => {
            if (err) return reject(err)
            if (!req.file) return reject('未上传头像文件！')
            if (req.file.size > 2048 * 1024) return reject('文件大小不超过2Mb！')
            // console.log(req.body);
            let { path_type } = req.body || {}
            if (!['avatar', 'id_card', 'account_screenshot', 'to_word'].includes(path_type)) return reject('非法上传路径！')
            resolve({ buffer: req.file.buffer, file_name: req.file.originalname, path_type })
        })
    })
    let file_md5 = await getBufferMd5(data.buffer)
    let before_file = (await knex(UPLOAD_LOG_TABLE).select('oss_key').where({ md5: file_md5 }).limit(1))[0]
    let file_name = getFileMd5Name(data.file_name, file_md5)
    // let md5 = String(result.res.headers.etag.toLowerCase().replace(/"/g, ''))
    let back_oss_key = null
    if (before_file) {
        back_oss_key = before_file.oss_key
    } else {
        if (data.path_type) file_name = `${data.path_type}/${file_name}` //对于用户反馈，明确标识
        let result = await store.put(file_name, data.buffer)
        back_oss_key = result.name
    }
    let url = publicHost + back_oss_key
    let upload_log = {
        name: file_name,
        md5: file_md5,
        oss_key: back_oss_key,
        url,
        create_user_id: userInfo.id,
        update_user_id: userInfo.id
    }
    let upload_id = (await knex(UPLOAD_LOG_TABLE).insert(upload_log))[0]
    return {
        identical: before_file ? true : false,
        url,
        upload_id,
        oss_key: back_oss_key
    }
}
/**
 * @description 从网络URL读取csv文件数据
 * @param {String} url 文件URL
 * @param {Boolean} needSheetName 是否需要单元格名称
 * @param {boolean} [raw=true] 从csv读取原始值，不进行format
 * @returns 
 */
async function analysisCSV(url = "", raw = true, needSheetName = false,) {
    if (!url) return Promise.reject('未设置文件URL')
    const file_buffer = await request({
        url,
        method: 'get',
        responseType: "arraybuffer"
    })
    let result = xlsx.read(file_buffer, { type: 'buffer', raw: raw });
    let data = xlsx.utils.sheet_to_json(result.Sheets[result.SheetNames[0]], { defval: null, raw: raw, rawNumbers: raw });
    // console.log(data);
    if (data && !data.length) return Promise.reject('文件无数据！')
    if (needSheetName) return { data, sheet_name: result.SheetNames[0] }
    // console.log(data);
    return data;
}
// analysisCSV('https://koc-img.domain.cn/test/9e2edbd90e6944ab9f5661fa3b7821d8.csv')
module.exports = {
    upload,
    uploadFile,
    analysisSheet,
    sheetJsonToData,
    checkMd5,
    getAccess,
    getCoverUrl,
    getOriginalUrl,
    getOssUrl,
    getDownloadUrl,
    checkFileMd5,
    uplodImageObj,
    analysisCSV,
    getUploadUrl,
    CONTENT_TYPE_MAPPER,
    getDuolaiUploadUrl,
    getOssMediaInfo,
    setOssMediaTag,
    removeOssFile
}