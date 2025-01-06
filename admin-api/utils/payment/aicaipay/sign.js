// const utils = require("../../../model/public/externalMedia/utils");

const DEV_CONFIG = {
    no: "201607092893",
    key: "36e7eee66dc0425cb54c2bdf82e8dae0"
};

const PRO_CONFIG = {
    no: "500279098019",
    key: "c6db3ac6995c48559108faee80b4e45f"
};

const config = process.env.NODE_ENV == "production" ? PRO_CONFIG : DEV_CONFIG;

function sign_params(params = {}) {
    params.no = config.no;
    const str = utils.sort_and_join(params, { handler: (key, value) => (`${key}=${value}`) });
    let sign_str =`${str}&key=${config.key}`;
    const sign = utils.md5(sign_str).toLocaleUpperCase();
    params.sign = sign;
    return params;
}


module.exports = {
    sign_params
}