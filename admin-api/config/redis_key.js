//redis key
const KEY = {
    RK_LOGIN_TOKEN: 'xgfx:login:token:',
    RK_CONTENT_PLATFROM: 'xgfx:content:platfrom:',
    RK_ADVERTISER_SETTLEMENTS: 'xgfx:finance:advertier:settlements',
    RK_MOYIN_AUDIO: "xgfx:create:moyin:audio:",
    RK_DRAMA_PLAN_INCOME: "xgfx:realization:drama_plan:charges",

    RK_ADVERTISER_MAPPER: "xgfx:advertiser:mapper",

    // content_id => { download_url, name }[]
    RK_CONTENT_LINK_WITH: "xgsj:content:links",
    RK_CHANNEL_ROUTER: "xgsj:channel:router",
    RK_CHANNEL_ACC_COUNT: "xgsj:channel:bloggercount",
    RK_DOUYIN_AUTH: "xgsj:douyin:auth",
    RK_ADVERTISER_REALTIME: "xgfx:advertiser:realtime",
    RK_TOOLS_CHEACK_WORDS: "xgfx:applet:tools:check_word:",
    RK_BIND_XGSJ: "xgfx:bind:xgsj_douyin:",
    RK_APPROVAL_LOCK: "xgfx:approval:lock",
    RK_CASHOUT_LOCK: "xgfx:cashout:lock",
    RK_RESUBMIT_LOCK: "xgfx:resubmit:lock",
    RK_CHANNEL_PREVIEW_LOCK: "xgfx:channel:preview:lock:",
    RK_REQUEST_LOADING: "xgfx:request:loading",
    RK_MAPPER_MIME_TYPE: "xgfx:mapper:mime_type",
    RK_CHANNEL_INFO: "xgfx:channel:info",
    RK_MAPPER_TAGS: "xgfx:mapper:tags:",
    RK_MAPPER_ACCOUNT_LELVE: "xgfx:mapper:account:lelve:",
    RK_MAPPER_PLATFORM: "xgfx:mapper:platform",
    RK_KWD_DICT_TO_NAME_KEY: "xgfx:keyword_config:dict_to_name",
    RK_KWD_NAME_TO_DICT_KEY: "xgfx:keyword_config:name_to_dict",

    RK_PROMOTION_APPROVAL: "xgfx:promotion:approval",
    RK_SETTLEMENT_APPROVAL: "xgfx:settlement:approval",
    RK_VIPREBATE_APPROVAL: "xgfx:viprebate:approval",
    RK_APPLET_PLAN_ADVERTISER_LOCK: "xgfx:applet:plan:sync_lock:",
    RK_APPLET_PLAN_ESTIMATE_DATA: "xgfx:applet:plan:estimate:data",
    RK_APPLET_PLAN_ESTIMATE_DATA_2023: "xgfx:applet:plan:estimate:data:2023",
    RK_APPLET_ORDER_SYNC_LOCK: "xgfx:applet:order:sync:lock", //同步订单时，不允许该项目进行订单同步
    RK_PC_AUTHORITY: "xgfx:pc:authority:account_ids:",

    RK_SETTLE_APPROVAL_LOCK: "xgfx:settle:approval:lock",
    RK_PRELOAD_QUITA: "xgfx:dlkd:preload:quota",

    RK_SILENT_LOGIN_LOCK: "xgfx:silent:login:lock", //静默登录锁

    RK_ORDER_SN_LOCK: "xgfx:order:sn:lock", //获取订单编号

    RK_XINGTU_TOKEN_LOCK: "xgfx:xingtu:token:lock", //刷新星图token
    RK_XINGTU_TASK_COUNT: "xgfx:xingtu:task:count", //星图任务总数

    RK_PAYMENT_ORDER_SN_LOCK: "xgfx:payment:service:order:sn:lock", // 付款获取订单编号
    RK_PAYMENT_SERVICE_ORDER_SN_LOCK: "xgfx:payment:service:order:sn:lock", // 付款获取商单编号

    RK_SYNC_XINGTU_TASK_LOCK: "xgfx:sync:xingtu:task:lock", //同步星图任务
    RK_SYNC_XINGTU_DATA_LOCK: "xgfx:sync:xingtu:data:lock", //同步星图任务数据锁
    RK_SYNC_XINGTU_DATA_TIME: "xgfx:sync:xingtu:data:time", //最近同步星图数据时间
    RK_SYNC_XINGTU_TASK_TIME: "xgfx:sync:xingtu:task:time", //最近同步星图任务时间
    RK_XINGTU_SETTLE_LOCK: "xgfx:xingtu:settle:sync_lock:",
    RK_USER_MESSAGE_CACHE: "xgfx:user:message:cache:", //小果繁星用户消息缓存

    RK_WITHDRAW_TASK_LOCK: 'xgfx:sync:withdraw:task:lock',

    RK_DLKD_TOKEN_LOCK: "xgfx:dlkd:token:lock", //获取多来看点小程序access_token
    RK_DLKD_ORDER_SN_LOCK: "xgfx:dlkd:order:sn:lock", //获取多来看点订单编号
    RK_DLKD_TOKEN: "xgfx:dlkd:token", //多来看点小程序access_token
    RK_DLKD_EQUITY_LOCK: "xgfx:dlkd:equity:lock", //多来看点小程序权益lock
    RK_DLKD_INTEGRAL_LOCK: "xgfx:dlkd:integral:lock", //多来看点积分看点lock
    RK_DLKD_APPLETS: "xgfx:dlkd:applets", //多来看点小程序
    RK_DUOLAI_VIDEO_COUNT: "xgfx:dlkd:video:count:", //多来看点视频计数
    RK_DUOLAI_CANCEL_RULE: "xgfx:dlkd:settle:cancel:rule", // 多来 核销规则
    RK_DUOLAI_CANCEL_COUNT: "xgfx:dlkd:settle:cancel:video_count", // 多来 核销计数
    RK_DUOLAI_CANCEL_COUNTED: "xgfx:dlkd:settle:cancel:video_counted", // 多来 视频是否计数
    RK_DUOLAI_ORDER_POLICY: "xgfx:dlkd:settle:order:policy",
    RK_DUOLAI_AGENT_CHANNEL: "xgfx:dlkd:agent:channel:", //流量渠道channel
    RK_DUOLAI_QUERY_SEARCH_CODE: "xgfx:dlkd:search:code:", //口令码
    RK_DUOLAI_AD_UID: "xgfx:dlkd:ad:uid:", //激励视频ad uid
    RK_DUOLAI_ACCOUNT_HASBUY: "xgfx:dlkd:account:hasbuy:", //检查用户是否购买过该剧集
    RK_DUOLAI_COLLECTION_EQUITY: "xgfx:duolai:collection:equity:", //剧集权益缓存
    RK_DUOLAI_COLLECTION_FAVORITE: "xgfx:duolai:collection:favorite", //剧集收藏缓存
    RK_DUOLAI_VIDEO_RANGE: "xgfx:duolai:video:range", //根据视频ID查询剧集范围

    RK_TABLE_UPDATE_LOCK: "xgfx:table:update:lock:", //数据表更新数据锁

    RK_SCAN_LOGIN: "xgfx:scan:login:", //扫码登录
    RK_ALI_AUTH_ORDER_SN_LOCK: "xgfx:ali_auth:order:sn:lock", //获取阿里实名认证订单编号
    RK_PLATFROM_RATE: "xgfx:applet:platfrom:rate:", //平台费率
    RK_SHUQI_KEYWORD_CREATE: 'xgfx:keyword:shuqi', // 书旗提词
    RK_CREATOR_HOST: 'xgfx:creator:host', //创作者host缓存
    RK_BUTTON_AUTHORITY: "xgfx:button:authority:", //缓存按钮权限

    RK_MAIN_CONTENT: "xgfx:main:content:", //缓存爆款内容
    RK_WITHDRAWAL_METHOD: "xgfx:withdrawal:method", //提现方式
    RK_BUY_RECORD: 'xgfx:buy:record', //购买记录缓存

    RK_CHANNEL_APPKEY: 'xgfx:channel:appkey:', //小果繁星APPKEY 缓存
    RK_DUOLAI_UPLOAD_CACHE: 'xgfx:duolai:upload:cache:', //多来看点文件上传缓存
    RK_CHANNEL_LOCK_CREATION: 'xgfx:channel:creation:', // api lock key
    RK_DUOLAI_COLLECTION_GROUP_CACHE: 'xgfx:duolai:collection:group:cache:', //多来看点合集分组缓存
    RK_DUOLAI_REFRESH_ORDER_LOCK: 'xgfx:duolai:refresh:order:lock', //多来看点刷新用户订单
    RK_DUOLAI_REFRESH_ORDER_COUNT: 'xgfx:duolai:refresh:order:count', //多来看点刷新用户订单计数
    RK_DUOLAI_CDN_SPLIT_COUNT: 'xgfx:duolai:cdn:split:count', //多来看点CDN链接流量分流
    RK_DUOLAI_APPROVE_VERSION: 'xgfx:duolai:approve:version:', //多来看点小程序的审核版本
    RK_DUOLAI_APPLET_INFO: 'xgfx:duolai:applet:info:', //多来看点小程序配置信息
    RK_DUOLAI_DAU_RECORD: 'xgfx:duolai:dau:record:', //多来看点小程序的DAU记录
    RK_DUOLAI_PROLOAD_LOCK: 'xgfx:duolai:proload:lock', //多来看点资源预热锁
    RK_DUOLAI_CDN_CONFIG: 'xgfx:duolai:cdn:config', //多来看点cdn配置
    RK_DUOLAI_SEARCH_CODE: "xgfx:duolai:searchcode:apply", // 多来申请口令
    RK_DUOLAI_VIDEO_HAVE_ORDER: "xgfx:duolai:video:have:orders:", // 多来视频是否存在订单
    RK_DUOLAI_COLLECTION_HAVE_ORDER: "xgfx:duolai:collection:have:orders:", // 多来合集是否存在订单
    RK_DUOLAI_VIDEO_SYNC_MEDIA: "xgfx:duolai:video:sync:media:", // 多来视频同步至媒体内容库
    RK_FROK_NUM_LOCK: 'xgfx:fork:num:lock', //小果繁星子进程开启数量
    RK_DUOLAI_LOGIN_NUM_LOCK: 'xgfx:duolai:login:num:lock', //多来看点静默登录并发数量
    RK_DUOLAI_APPLETS: "xgfx:duolai:applets", // 多来小程序
    RK_DUOLAI_TAG: "xgfx:duolai:tag", // 多来小程序tag
    RK_DUOLAI_MINIO_URL: "xgfx:duolai:minio:url:", // 多来minio url 播放链接缓存
    RK_DUOLAI_LOCAL_SHUNT: "xgfx:duolai:local:shunt", // 多来小程序本地分流开关
    RK_DUOLAI_TIME_PERIOD_SALES_TREND: "xgfx:duolai:chart:time:period",// 多来看点实时数据图表
    RK_DUOLAI_COLLECTION_GMV_RANK: "xgfx:duolai:chart:collection:gmv:rank",// 多来看点实时数据图表
    RK_DUOLAI_TOP_SUMMARY: "xgfx:duolai:chart:top:summary",// 多来看点顶部汇总数据
    RK_DUOLAI_APPLET_GMV_TREND: "xgfx:duolai:applet:gmv:chart",// 多来看点小程序gmv
    RK_DUOLAI_CHANNEL_GMV_TREND: "xgfx:duolai:channel:gmv:chart",// 多来看点渠道gmv
    RK_DUOLAI_DAU_GMV_TREND: "xgfx:duolai:dau:gmv:chart",// 多来看点小程序GMV与访问人数趋势图
    RK_DUOLAI_REFOUND_LOCK: "xgfx:duolai:refound:lock:",// 多来看点订单退款锁
    RK_DUOLAI_LOCAL_WINDOW_COUNT: "xgfx:duolai:local:window:count:",// 多来看点本地分流窗口分片请求
    RK_DUOLAI_ORDERS_GROUPBY_COLLECTION: "xgfx:duolai:orders:groupby:collection",// 多来看点聚合剧集锁
    RK_DUOLAI_ORDERS_GROUPBY_CPARAM: "xgfx:duolai:orders:groupby:cparam",// 多来看点聚合剧集锁

    RK_DUOLAI_SETTLE_POLICY: "xgfx:duolai:settle:policy",// 多来结算政策
    RK_DUOLAI_SOURCE_AD: "xgfx:duolai:source:ad:", //多来看点投流广告
    RK_BANK_IS_WHITELIST: "xgfx:bank:is:whitelist", //是否有银行卡白名单
}
module.exports = KEY;
