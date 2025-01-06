// const session = require("express-session");
const cookieParase = require('cookie-parser');
const compression = require('compression')
const errorFormat = require('./utils/errorFormat')
const { getUuid, getRefererAppId } = require('./utils/tools')
const { saveReqLogs, endMiddleware } = require('./utils/logs/index')
const morgan = require('morgan');
const { ui_version } = require('./config/index')
const { getSession } = require('./db/redis')
const swagger = require('swagger-stats')

// var SESSION = {}
exports.publicUse = (app, express) => {
    // 使用gzip进行response压缩
    app.use(swagger.getMiddleware({
        name: '繁星监控服务',
        uriPath: '/api/swagger',
        // swaggerSpec: apiSpec,
        authentication: true,
        lang: 'zh-CN', // 或者 'zh-CN'
        onAuthenticate: function (req, username, password) {
            // simple check for username and password
            return ((username === 'zhangjinlin') && (password === '159357..'));
        }
    }))
    app.use(compression());
    app.use(express.json({ limit: '256mb' }));
    app.use(express.urlencoded({ limit: '256mb', extended: true }));
    app.use(cookieParase());
    app.use(async function (req, res, next) {
        let req_id = getUuid()
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin,Content-Type,Accept,authorization,content-type,token,X-Requested-With,koc-session,timestamp,request-id,koc-platform,app-version,koc-oem-type,channel-appkey,deviceid,fingerprint');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,PATCH,DELETE');
        res.setHeader("Access-Control-Allow-Credentials", true); //带cookies7
        res.setHeader("Access-Control-Expose-Headers", "koc-session,koc-version,koc-platform,app-version")
        res.set('ETag', req_id)
        res.set('koc-version', ui_version)
        if (req.method == 'OPTIONS') return res.sendStatus(200)
        if (req.method == 'HEAD') return res.sendStatus(200)
        res.errorFormat = errorFormat
        req.koc_request_id = req_id
        req.$platform = req.headers['koc-platform'] || null // 平台 android ios
        req.$platform && (req.$platform = String(req.$platform).toLowerCase());

        req.$oem_type = req.headers['koc-oem-type'] || null // 渠道 xiaomi huawei
        req.$oem_type && (req.$oem_type = String(req.$oem_type).toLowerCase());

        req.$version = req.headers['app-version'] || null // 编译版本号 例如 234 非 1.2.2
        req.$app_info = getRefererAppId(req?.headers?.referer || req?.headers?.['koc-referer'])
        if (req.headers && req.headers['koc-session']) req['$session'] = await getSession(req.headers['koc-session']) || null
        req.$req_channel = {
            app_key: req.headers?.['channel-appkey'] || req.body?.app_key || req.query?.app_key || null,
            timestamp: req.headers?.timestamp || req.body?.timestamp || req.query?.timestamp || null
        }
        // console.log(req['$session']);
        // 开始异步写入请求信息
        saveReqLogs(req, res).catch(err => {
            console.log('日志存储失败！', err);
        })
        next();
    });
    app.use(endMiddleware);
    if ((process.env.NODE_ENV || '').indexOf("prod") == -1) {
        morgan.format('joke', '[request] :method :url :status :response-time ms');
        app.use(morgan('joke'));
    }

};
// exports.SESSION = SESSION