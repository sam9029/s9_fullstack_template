const { project, environment, logstash_host, logstash_auth } = require("../../config")
const moment = require("moment")
const winston = require('winston')
const http = require("http");
const httpAgent = new http.Agent({ keepAlive: true });
// const path = require("path")
// const LogstashTransport = require("winston-logstash/lib/winston-logstash-latest");
const logger = winston.createLogger({
    format: winston.format.json(),
    defaultMeta: { project, environment, },
    transports: [
        new winston.transports.Http({
            port: 3060,
            host: logstash_host,
            auth: logstash_auth,
            batch: true,
            batchCount: 50,
            batchInterval: 5000,
            agent: httpAgent
        }),
        /* new LogstashTransport({
            port: 3060,
            node_name: project,
            max_connect_retries: -1,
            host: logstash_host,
            // ssl_enable: true,
            // ssl_key: path.join(__dirname, './private.key'),
            // ssl_cert: path.join(__dirname, './certificate.crt')
        }) */
    ],
});
const operate_logger = winston.createLogger({
    format: winston.format.json(),
    defaultMeta: { project:`${project}-operate`, environment, },
    transports: [
        new winston.transports.Http({
            port: 3060,
            host: logstash_host,
            auth: logstash_auth,
            batch: true,
            batchCount: 5,
            batchInterval: 5000,
            agent: httpAgent
        }),
    ],
});
logger.on('error', (error) => {
    // Make the decission in here
    console.log('日志记录异常：', error);
});
function info(message = '', meta = {}) {
    let data = { date: moment().format("YYYY-MM-DD"), log_type: "request", ...meta }
    logger.info(message, data);
}
function error(message = '', meta = {}) {
    let data = { date: moment().format("YYYY-MM-DD"), log_type: "request", ...meta }
    logger.error(message, data);
}
function debug(message = '', meta = {}) {
    let data = { date: moment().format("YYYY-MM-DD"), log_type: "debug", ...meta }
    logger.warn(message, data);
}
function operate(message = '', meta = {}) {
    let data = { date: moment().format("YYYY-MM-DD"), log_type: "operate", ...meta }
    operate_logger.info(message, data);
}
// debug('测试debug日志', { path: '/test/debug' })
module.exports = {
    logger,
    info,
    error,
    debug,
    operate
}