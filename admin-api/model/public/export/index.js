const { EXPORT_LOG, ACCOUNT_TABLE } = require('../../../config/setting');
const { getUuid, selectName } = require("../../../utils/tools")
const moment = require("moment")
const OSS = require('ali-oss');
const knex = require("../../../db/knexManager").knexProxy;
const bucket = (require('../../../config/index')).bucket;
const store = new OSS(bucket);
const publicHost = bucket.publicHost;
const XLSX = require("xlsx")
const { getDownloadUrl } = require('../upload')
const { cloneDeep, chunk } = require("lodash")
const { newFork } = require("../../../forks/index")
const pathManage = require("path")
const ExcelJS = require('exceljs');
const stream = require('stream')

async function exportMain(model, body = {}, userInfo = {}, site_key = "id", formatModel = null, type = "site", limit = 500, delField = null) {
    // console.log(Object.prototype.toString.call(model));
    let access_type = ["[object Function]", "[object AsyncFunction]"]
    if (!access_type.includes(Object.prototype.toString.call(model))) return Promise.reject("参数类型错误！")
    let site = null
    let all_data = []
    let data = []
    let page = 1 //位点和页码两种方式均可以导出
    let max_id = null //当前查询时的最新数据
    do {
        let item_data = await model(body, userInfo, type == "site" ? site : page, limit, max_id)
        data = type == "site" ? item_data : item_data.data
        if (item_data && item_data.max_id) max_id = item_data.max_id
        if (!data || !data.length) break
        let site_item = data[data.length - 1]
        site = site_item?.[site_key]
        // console.log(site_item);
        if (site_item) all_data = all_data.concat(data) //存在数据时，才开始concat
        page++
        if (page >= 1000) break //方式出现死循环，超过1000次就关闭查询
    } while (data.length >= limit);
    if (body.cols && formatModel) {
        // all_data = all_data.map(item => formatModel(item, body.cols))
        const filter_format_data = [];
        all_data.forEach(item => {
            const obj = formatModel(item, body.cols)
            if (!obj) return;
            if (delField && delField?.length) {
                delField.forEach(t => {
                    delete obj[t]
                })
            }
            filter_format_data.push(obj);
        })
        all_data = filter_format_data;
    }
    if (!all_data || !all_data.length) return Promise.reject("查询无数据，无法导出！")
    return all_data
}
async function exportXlsxToOSS(export_data, uid = "", export_type = 'xlsx') {
    let passThroughtStream = export_type == 'csv' ? writeCsvFile(export_data) : writexlsxFile(export_data)
    let { name, url } = await store.put(`export/${getUuid()}.${export_type}`, passThroughtStream)
    url = publicHost + name
    return { name, url }
}
function writexlsxFile(export_data) {
    let passThroughtStream = new stream.PassThrough()
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: passThroughtStream,
        useStyles: false,
        useSharedStrings: true
    });
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = Object.keys(export_data[0]).map(key => {
        return { header: key, key }
    })
    // let chunk_data = chunk(export_data, 10000)
    for (let index = 0; index < export_data.length; index++) {
        const element = export_data[index];
        worksheet.addRow(element).commit()
    }
    worksheet.commit()
    workbook.commit()
    return passThroughtStream
}
function writeCsvFile(export_data) {
    let passThroughtStream = new stream.PassThrough()
    let header = Object.keys(export_data[0]).map(key => key).join(',') + '\n'
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    passThroughtStream.write(bom);
    passThroughtStream.write(header)
    function escapeCsvField(field) {
        if (typeof field === 'string') {
            // 如果字段包含逗号、引号或换行符，使用双引号括起来
            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                // 替换引号内部的引号
                field = `"${field.replace(/"/g, '""')}"`;
            }
        }
        return field;
    }
    // 定义一个转换流，将 JSON 对象转换为 CSV 格式的字符串
    const jsonToCsv = new stream.Transform({
        objectMode: true,
        transform(row, encoding, callback) {
            const csvLine = `${Object.keys(row).map(k => escapeCsvField(row[k])).join()}\n`;
            callback(null, csvLine);
        }
    });
    // 模拟从数据源读取数据并写入 PassThrough 流
    export_data.forEach(row => {
        jsonToCsv.write(row);
    });
    // 当所有数据都被写入时，结束流
    jsonToCsv.end();
    // 将 jsonToCsv 流连接到 PassThrough 流
    jsonToCsv.pipe(passThroughtStream);
    return passThroughtStream
}
async function exportData(model, body = {}, userInfo = {}, site_key = "id", formatModel = null, uid = "", type = "site", limit = 500, callback = null, delField = []) {
    if (uid) await knex(EXPORT_LOG).update({ export_status: 2 }).where({ uid })
    let successData = []
    let oss_info = await exportMain(model, body, userInfo, site_key, formatModel, type, limit, delField)
        .then(data => {
            if (callback) successData = cloneDeep(data)
            else successData = data
            if (delField && delField.length && !(body.cols && formatModel)) {
                data.forEach(k => {
                    delField.forEach(t => {
                        delete k[t]
                    })
                })
            }
            return exportXlsxToOSS(data, uid, body.export_type)
        }).catch(async err => {
            // console.log(err);
            let export_message = String(err.message || err || "未知异常！").substring(0, 120)
            if (uid) await knex(EXPORT_LOG).update({ export_status: 4, export_message }).where({ uid })
        })
    if (callback) callback(successData)
    if (uid && oss_info) await knex(EXPORT_LOG).update({ export_status: 3, oss_key: oss_info.name }).where({ uid })
    return oss_info
}
async function exportLog(path, task_name, model, body = {}, userInfo = {}, site_key = "id", formatModel = null, type = "site", limit = 500, callback = null, delField = []) {
    let { id: create_user_id } = userInfo || {}
    if (!create_user_id) return Promise.reject("用户信息获取异常！")
    let doing_data = (await knex(EXPORT_LOG).select("id").where({ path, create_user_id }).where("export_status", "<", 3).limit(1))[0]
    if (doing_data) return Promise.reject("存在正在导出的重复任务，请等待上一任务执行完毕后重试！")
    let uid = getUuid()
    let insert_data = {
        create_user_id,
        task_name: String(`${task_name || "数据导出"}`).replace('.xlsx', ''),
        path,
        create_date: moment().format("YYYY-MM-DD"),
        uid
    }
    let id = (await knex(EXPORT_LOG).insert(insert_data))[0]
    exportData(model, body, userInfo, site_key, formatModel, uid, type, limit, callback, delField).catch(err => {
        // console.log("数据导出出现异常，ID:", id, err);
    })
    return id
}

async function logList(query, userInfo) {
    // const accountIds = await getChildrenByPermission(userInfo);
    let page = query.page || 1, pagesize = query.pagesize || 20;
    let sql = knex(`${EXPORT_LOG} as log`).select('log.id').where('log.create_user_id', userInfo.id || 0)
    // .where(builder => {
    //     if (accountIds && accountIds.length) {
    //         builder.whereIn('log.create_user_id', accountIds);
    //     }
    // })
    if (query.create_date) sql.where("log.create_date", query.create_date)
    if (query.export_status) sql.where("log.export_status", query.export_status)
    let count = await knex.count({ count: "id" }).from(knex.raw(`(${sql}) as t`));
    sql = sql
        .select('task_name', 'create_time', 'export_status', 'export_message')
        .select(selectName('log', 'create_user_id', ACCOUNT_TABLE, 'name', 'create_user_name'))
        .select(knex.raw(`IF(export_status > 2, update_time, null) as update_time`))
        .limit(pagesize)
        .offset((page - 1) * pagesize).orderBy('id', 'desc');
    let data = await sql;
    return {
        code: 0,
        data,
        count: (count.length && count[0]["count"]) || 0
    }
}

async function def(query, userInfo) {
    if (!query.id) throw new Error('请设置日志ID！');
    let data = (await knex(EXPORT_LOG).select('id', 'oss_key', 'export_message', 'task_name', 'export_status').where('id', query.id))[0];
    if (data.export_message) {
        return {
            code: 1,
            message: data.export_message
        }
    } else {
        let url = getDownloadUrl(data.oss_key, data.task_name, 'koc-img');
        return {
            code: 0,
            data: {
                download_url: url,
                export_status: data.export_status
            }
        }
    }
}
//子进程进行数据导出操作
async function forkExportLog(file_path, path, task_name, model = '', body = {}, userInfo = {}, site_key = "id", formatModel = '', type = "site", limit = 500, callback = null, delField = []) {
    let { id: create_user_id } = userInfo || {}
    if (!create_user_id) return Promise.reject("用户信息获取异常！")
    let doing_data = (await knex(EXPORT_LOG).select("id").where({ path, create_user_id }).where("export_status", "<", 3).limit(1))[0]
    if (doing_data) return Promise.reject("存在正在导出的重复任务，请等待上一任务执行完毕后重试！")
    let uid = getUuid()
    let insert_data = {
        create_user_id,
        task_name: String(`${task_name || "数据导出"}`).replace('.xlsx', ''),
        path,
        create_date: moment().format("YYYY-MM-DD"),
        uid
    }
    let id = (await knex(EXPORT_LOG).insert(insert_data))[0]
    newFork(null, { file_path, model, body, userInfo, site_key, formatModel, uid, type, limit, delField, id }, pathManage.join(__dirname, './fork.js'), async (err) => {
        await knex(EXPORT_LOG).update({ export_status: 4, export_message: String(err?.message || err || '系统繁忙，请稍后重试！').substring(0, 50) }).where({ id })
    })
    return id
}
// console.log(pathManage.join(__dirname,'./fork.js'));
var started = false
//项目重启时，将之前在执行的导出任务状态设置为失败
async function restartExportProject() {
    if (started) return
    started = true
    return await knex(EXPORT_LOG).update({ export_status: 4, export_message: '系统繁忙，请稍后重试！' }).whereIn('export_status', [1, 2])
}
module.exports = {
    exportData,
    exportMain,
    exportXlsxToOSS,
    exportLog,
    logList,
    def,
    forkExportLog,
    restartExportProject
}
//正常情况下使用 exportLog 方法
//用位点标识导出位置 且导出的model
// exportMain(exportModel, {
//     date: ['2022-10-01', '2022-10-31'],
//     page: '1',
//     pagesize: '20',
//     count: '7332',
//     advertiser_type: '1',
//     interface_id: '1731',
//     query_type: 'blogger',
//     cols:
//         [{ label: '结算日期', prop: 'date' },
//         { label: '关键词', prop: 'keyword' },
//         { label: '内容类型', prop: 'content_type' },
//         { label: '发布起始日期', prop: 'publish_begin_date' },
//         { label: '搜索量', prop: 'query_num' },
//         { label: '效果结算量', prop: 'settle_num' },
//         { label: '效果结算单价', prop: 'settle_price' },
//         { label: '发布效果收益', prop: 'settle_total_price' }]
// }, {
//     id: 10010985,
//     uid: 'D232FC5AA7DB4EE7891A484B8C222BD3',
//     name: '张锦林',
//     email: null,
//     password: '01ac8963f7c87f2d4a94a7c59908b923',
//     telephone: '17396983034',
//     phone_verification: 1,
//     contacts: '',
//     address: '',
//     flag: 1,
//     status: 1,
//     create_time: '2022-07-18 12:27:49',
//     update_user_id: 10000001,
//     update_time: '2022-10-08 19:19:07',
//     create_user_id: 10000001,
//     version: '1.0',
//     department: '[138]',
//     direct_leader: 10007047,
//     oem_id: 1,
//     role_ids: '147',
//     koc_role: 2,
//     token: '891893c09fa03d9c80a96c51df476dbd',
//     token_after: 1668150019
// }, "id", formatExportItem).then(data => {
//     return exportXlsxToOSS(data)
//     // console.log(data);
// }).then(oss => {
//     console.log(oss);
// })