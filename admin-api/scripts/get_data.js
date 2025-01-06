const { getBillLink } = require("../model/oauth/douyin/applet_plan")
const axios = require('axios')
const path = require('path')
const fs = require('fs')


let date_str = '2024-02-'
let dates = [6, 7, 8, 13, 14, 16, 17, 18, 19, 20, 21, 23, 29]

async function test(params) {
    for (let index = 0; index < dates.length; index++) {
        const date = date_str + String(dates[index]).padStart(2, 0)
        let { bill_link } = await getBillLink(date)
        if (!bill_link) {
            console.log(date, '获取数据失败！');
            continue
        }
        let { data: stream } = await axios.get(bill_link, { timeout: 110000, responseType: 'stream' })
        if (!stream) return Promise.reject('下载缓存文件异常！')
        let save_file_path = path.join(__dirname, date + '.csv')
        await new Promise((resolve, reject) => {
            let outStream = fs.createWriteStream(save_file_path)
            stream.on('end', () => {
                resolve()
            }).on('error', function (err) {
                reject(err?.message)
            }).pipe(outStream)
        })
        // return save_file_path
        console.log(date, '下载完毕！');
    }
}
// test()
// getBindLink