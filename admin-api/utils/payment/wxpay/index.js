//注：key为商户平台设置的密钥key
const utils = require("../../../model/public/externalMedia/utils")
function getDataSign(data={},pay_key='') {
    let str = utils.sort_and_join(data)
    console.log(str);
    return utils.md5(`${str}&key=${pay_key}`).toUpperCase()
}

console.log(getDataSign({a:'djdkjd',d:'mdekdkme'}));