const { exportData } = require("./index")
process.on('message', async (info) => {
    console.log('开启一个数据导出子进程：', info.id);
    await forkExport(info).catch(err => {
        console.log("数据导出出现异常，ID:", info.id, err);
    })
    process.send('success-export');
})
async function forkExport(info = {}) {
    let { file_path, model, body, userInfo, site_key, formatModel, uid, type, limit, delField, id } = info
    const file_model = require(file_path)
    await exportData(file_model[model], body, userInfo, site_key, file_model[formatModel], uid, type, limit, null, delField)
}