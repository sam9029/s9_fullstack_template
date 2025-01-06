const RAM_ACCESSKEY = { //阿里云RAM角色的access_key, 目前有 OSS \实名认证接口权限
    accessKeyId: 'noneKey',
    accessKeySecret: 'noneKey',
}
const MINIO_ACCESSKEY = {
    accessKey: 'noneKey',
    secretKey: 'noneKey',
}
module.exports = {
    port: process.env.PORT || 3000,
    cluster_instance: process.env.NODE_ENV == "production" ? 4 : 1,
    diff_time: process.env.NODE_ENV == "production" ? 180 : 60000000,
    project: "test-api",
    environment: process.env.NODE_ENV || 'development',
    logstash_host: process.env.NODE_ENV == "production" ? "192.168.4.2" : "192.168.0.1",
    logstash_auth: { username: "lizhi", password: "jiayin2020" },
    log_storage: "BOTH", //BOTH 既存数据库，又存ELK || ELK 只存ELK || MYSQL 只存数据库
    production_url: "https://test.domain.cn/api",
    h5_production_host: "https://test.domain.cn/h5",
    system_account_id: 10000000,//系统账户ID
    dbs: {
        xgfx_base: process.env.DB_MYSQL_URL || "mysql://developer_name:developer_pwd@192.168.0.1:33061/scaffold_base?timezone=+8000&charset=utf8mb4_unicode_ci",
    },
    cert_path: process.env.CERT_PATH || `${__dirname}/cert`,
    deviation: 'qwert',
    ui_version: '1.0.1',
    token_after: 7 * 24 * 60 * 60, //默认为秒  token 过期时间  0 代表不过期
    bucket: {
        internal: process.env.NODE_ENV == "production" ? true : false,//
        publicHost: 'https://koc-img.domain.cn/',//域名替换时使用的公网域名
        host: 'https://koc-img.domain.cn/',//线上部署时使用内网OSS加快访问速度
        region: 'oss-cn-beijing',
        ...RAM_ACCESSKEY,
        bucket: 'koc-img',
        secure: true,
    },
    materialBucket: {
        internal: process.env.NODE_ENV == "production" ? true : false,//
        publicHost: 'https://koc-material.domain.cn/',//域名替换时使用的公网域名
        host: 'https://koc-material.domain.cn/',//线上部署时使用内网OSS加快访问速度
        region: 'oss-cn-beijing',
        ...RAM_ACCESSKEY,
        bucket: 'koc-material',
        secure: true,
    },
    duolaiBucket: {
        internal: process.env.NODE_ENV == "production" ? true : false,
        publicHost: 'https://duolai-img.domain.cn/',//域名替换时使用的公网域名
        host: 'https://duolai-img.domain.cn/',//线上部署时使用内网OSS加快访问速度
        region: 'oss-cn-beijing',
        ...RAM_ACCESSKEY,
        bucket: 'duolai-img',
        secure: true,
    },
    sms: { //短信验证码SDK
        accessKeyId: 'noneKey',
        accessKeySecret: 'noneKey',
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
    },
    real_name: { //实名认证
        sceneId: 1000009369,
        ...RAM_ACCESSKEY
    },
    redis: {
        url: process.env.NODE_ENV == "production" ?
            "redis://:@r-2zeye028rqn52n33s9.redis.rds.aliyuncs.com:6379/10"
            : (process.env.REDIS_URL || "redis://:@127.0.0.1:6379/10"),
        expire_interface: 30 * 60,//接口缓存时间 30分钟
        default_expire_time: 24 * 3600, //默认的token有效期
    },
    weak_pwd: ['123456', '1234567', '12345678', '123456789', '1234567890', '000000', '111111', '11111111', '112233',
        '123123', '123321', '159357', '654321', '666666', '888888', 'abcdef', 'abcabc', 'abc123', 'a1b2c3', 'aaa111',
        '123qwe', 'qwerty', 'qweasd', 'admin', 'password', 'p@ssword', 'passwd', 'iloveyou', '5201314', 'asdfghjkl',
        '66666666', '8888888', 'password', 'qwerty', 'monkey', 'letmein', '1234567', 'dragon', 'trustno1', 'baseball',
        'master', 'iloveyou', 'ashley', 'sunshine', 'passw0rd', 'bailey', '123123', 'shadow', 'superman', '654321',
        'michael', 'qazwsx', 'asdfghjkl', 'football'],
    app_image_resize: "?x-oss-process=image/resize,h_534/quality,q_95",
    test_amount: null,//订单测试金额 单位 分
    CAN_PREOLOAD_HOUR: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], //可以预热的时刻
    DUOLAI_ORDER_BLOCK_DATE: '2024-10-13',
    minioClients: [
        {
            endPoint: '192.168.0.1',
            port: 8003,
            useSSL: false,
            ...MINIO_ACCESSKEY,
            duoLaiBucketName: 'duolai-img',
            cdn_host: 'https://wangsu.domain.cn',
            cdn_client: 'client2',
        },
        {
            endPoint: '192.168.0.1',
            port: 8000,
            useSSL: false,
            ...MINIO_ACCESSKEY,
            duoLaiBucketName: 'duolai-img',
            cdn_host: 'https://wangsu.domain.cn',
            cdn_client: 'main',
        },
        {
            endPoint: 'minio.domain.cn', //本地IP多线路1
            port: 443,
            useSSL: true,
            ...MINIO_ACCESSKEY,
            duoLaiBucketName: 'duolai-img',
            cdn_client: 'local0',
        },
        {
            endPoint: 'shouyun.domain.cn', //本地IP多线路2
            port: 443,
            useSSL: true,
            ...MINIO_ACCESSKEY,
            duoLaiBucketName: 'duolai-img',
            cdn_client: 'local1',
        }
    ]
};
