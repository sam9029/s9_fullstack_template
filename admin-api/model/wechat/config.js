/**
 * @typedef { Object } TokenConfig
 * @property { string } appid
 * @property { string } app_secret
 * @property { string } site 唯一id
 * @property { priority } priority 创建优先级
 * @property { string } name 公众号名称
 * @property { boolean? } is_office 
 * @property { string? } avatar 小程序头像
 * @property { string } cover_media 封面素材ID
 * @property { string } imageurl 小程序卡片的图片地址
 * @property { 'h5' | 'applet' } type init时附加上类型
 */

/**
 * @typedef { keyof config } CONFIGKEY
 */

// priority越小越高 但不代表比例
// eg: 1:2:3 公倍数6 实际比例 6:3:2
/**@type { TokenConfig[] } } */
const config_h5 = [
  { 
    name: "推书推剧助手03",
    appid: "wx6c8500c5ccc762bc",
    app_secret: "e52e817fb039d857c3fd9f5d50f95282",
    site: 'gh_199f09c598e3',
    priority: 1,
    is_office: true,
    cover_media: "PYcE5j4v_42VLXnMAXH8aaaNedPwhCf4UVBMrv0lAn6dTGZ7xdHoupIPg7R3ojeF",
    imageurl: "http://mmbiz.qpic.cn/sz_mmbiz_png/j7iaajug7vAoibTPeFxf8icprTjDbKJYJRweQToyO0icKic4es9usiccT2XRBbVaZy4GhoaQlCRNwT5tFic2WDsRLU1sQ/0?wx_fmt=png",
  }
]

/**@type { TokenConfig[] } } */
const config_applet = [
  { 
    name: "好剧推荐001",
    appid: "wx5f8c138d67e479b1",
    app_secret: "c0ed155ff082e38052dd4327e0015a47",
    site: 'SUNLIGHT',
    priority: 1,
    avater: "https://mmbiz.qpic.cn/mmbiz_png/yzxVqSaZJueiaxpNXUzC2ibGlETYqT3eleOHsjXeKAqVjXVt2mV4fUspZL48CqDo3UciaMs0nCJwCt3biaB7o9Hq6g/0?wx_fmt=png",
    // avater_media: "3GTBPZXCCiBMTKjobDyet2qrM4fxF0vnvAsxyDeG134oEcif5zPVAHfB32l7rXJr",
    // cover: "https://mmbiz.qpic.cn/mmbiz_png/yzxVqSaZJucguI8gy7N23cQeyrxmyKh2aazPr3huFmHm8HAwoZOlr6OIT1BuBKEQOhBANty4qicPjZfEAYpP8Bw/0?wx_fmt=png",
    cover_media: "3GTBPZXCCiBMTKjobDyet0s3ELnVHj4mO9xMbyJUwRZWJlUenmFDa5SWjiLWiACI",
    imageurl: "https://mmbiz.qpic.cn/mmbiz_jpg/yzxVqSaZJucguI8gy7N23cQeyrxmyKh2VSKpYpurTiaynR2UAeIblndX2w3d3T3snDLovRbWhzTrXdxuv9mzYAg/0?wx_fmt=jpeg",
    // image_media: "3GTBPZXCCiBMTKjobDyet3Ljk3PbrxIWVzcSyLiqDG20bS39hQnW5vSnmVeomjQV",
  }
]



const template_h5 = `<p><img class="rich_pages wxw-img js_insertlocalimg" data-ratio="0.4255555555555556" data-s="300,640"
data-src="{$data-src$}"
data-type="jpeg" data-w="900"
style="text-align: center;"
data-imgqrcoded="1"><br></p>
<p><br /></p>
{$btn-slot$}
<p style="text-align: center;margin-top: 0px;">&nbsp;<span style="text-align: justify;text-indent: 0em;color:#777777;">加入小果繁星，实现视频号变现</span></p>
<p style="text-align: left;margin-top: 0px;">
<span style="text-align: justify;text-indent: 0em;color: rgb(255, 255, 255);background-color: rgb(120, 172, 254);">↓↓↓ 可点击下方「阅读原文」观看精彩后续</span>
</p>`;

const template_h5_btn = `<a href="{$href$}">
<p style="text-align: center;background: rgb(234, 68, 90);height: 48px;border-radius: 2px;color: rgb(255, 255, 255);font-size: 17px;line-height: 48px;margin: 0px 0px 24px;text-indent: 0em;">
&nbsp; {$button$} &nbsp;
<svg style=" padding-top: 9px; overflow: visible; pointer-events: none; max-width: none !important; isolation: isolate; height: 24px; width: 24px; " version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0" y="0" viewbox="0 0 18 18" xml:space="preserve" > <g> <g transform="translate(10 10)"> <g style="pointer-events: visible"> <circle cx="1" opacity="0.7" cy="1" fill="#fff" r="11.7648"> <animate attributename="r" values="10.5;13;10.5" begin="0s" dur="1.2s" repeatcount="indefinite" ></animate> </circle> <circle cx="1" cy="1" fill="#fff" r="4.16"></circle> </g> </g> </g> </svg>
</p>
</a>`

const template_miniprogram = `<mp-miniprogram 
  data-miniprogram-appid="{$mini-appid$}" 
  data-miniprogram-avatar="{$mini-avatar$}" 
  data-miniprogram-path="{$mini-path$}" 
  data-miniprogram-title="{$mini-title$}，点击立即观看" 
  data-miniprogram-imageurl="{$mini-src$}">
</mp-miniprogram>
<p style="text-align: center;margin-top: 0px;"><span style="text-align: justify;text-indent: 0em;color:#777777;">加入小果繁星，实现视频号变现</span></p>
`

const template = {
  h5: template_h5,
  h5_btn: template_h5_btn,
  applet: template_miniprogram
}

module.exports = {
  CONFIG_H5: config_h5,
  CONFIG_APPLET: config_applet,
  TEMPLATE: template
}