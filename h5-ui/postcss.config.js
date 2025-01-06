module.exports = {
    plugins: {
        autoprefixer: {
            overrideBrowserslist: [
                "Android 4.1",
                "iOS 7.1",
                "Chrome > 31",
                "ff > 31",
                "ie >= 8",
                "last 10 versions", // 所有主流浏览器最近10版本用
            ],
            grid: false,
        },
        'postcss-pxtorem': {
            rootValue: 37.5,//css像素1:1还原
            // rootValue: 75,//750px的设计稿就要除以2 来写px单位
            propList: ['*'],
            unitPrecision: 5
        }
    }
}