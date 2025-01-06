//用于生成滑动验证码图片，需要
const sharp = require('sharp');
const { setSession } = require('../db/redis')
const front_size = {
    w: 90,
    h: 90
}
const background_size = {
    w: 679,
    h: 382
}

async function makeProspect(x = 30, y = 10, background = 2, front = 1) { //生成验证码前景图
    let front_cover = __dirname + `/moban/${front}.png`
    let back_cover = __dirname + `/moban/${front}.png.png`
    let background_img = __dirname + `/background/${background}.jpg`
    // sharp().boolean()

    let buffer = await sharp(background_img)
        .extract({ left: x, top: y, width: front_size.w, height: front_size.h })
        .ensureAlpha(0.9)
        .png({ compressionLevel: 9 })
        .toBuffer()

    let clip_buffer = await sharp({
        create: {
            width: front_size.w,
            height: background_size.h,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite([{ input: buffer, blend: 'over', left: 0, top: y }])
        .png({ compressionLevel: 9 })
        .toBuffer()

    return String('data:image/png;base64,' + clip_buffer.toString('base64'))
}
async function makeBackground(x = 30, y = 10, background = 2, front = 1) { //生成验证码前景图
    let front_cover = __dirname + `/moban/${front}.png`
    let back_cover = __dirname + `/moban/${front}.png.png`
    let background_img = __dirname + `/background/${background}.jpg`
    // const data = await sharp(front_cover).toBuffer()
    // let nw_data = data.toJSON()
    // nw_data.data = nw_data.data.map(i => 255 - i)
    // console.log(JSON.stringify(nw_data));
    // await sharp(Buffer.from(nw_data)).toFile('back.png')
    // let front_buffer = await sharp({
    //     create: {
    //         width: front_size.w,
    //         height: front_size.h,
    //         channels: 4,
    //         background: { r: 255, g: 255, b: 255, alpha: 0.9 }
    //     }
    // }).png().toBuffer()
    // .flatten({ background: '#FFFFFF' })
    // .ensureAlpha(1).trim()
    // .toBuffer()
    let buffer = await sharp(background_img)
        // .flatten({ background: '#F0A703' })
        // .ensureAlpha(0.5)
        // .negate({ alpha: true })
        // .threshold()
        // 
        // .extract({ left: x, top: y, width: front_size.w, height: front_size.h })
        .composite([
            {
                input: {
                    create: {
                        width: front_size.w,
                        height: front_size.h,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0.9 }
                    }
                }, blend: 'over', left: x, top: y
            }
        ])
        // .flatten({ background: '#FFFFFF' })
        // .webp({ lossless: true, quality: 10, })
        .jpeg({ compressionLevel: 9, quality: 30, palette: true })
        .toBuffer()
    return String('data:image/jpeg;base64,' + buffer.toString('base64'))
    // .toFile('back.jpg');
}
function RandomNumBoth(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
}
async function getSlideCode(res) {
    let x = RandomNumBoth(160, background_size.w - front_size.w - 60)
    let y = RandomNumBoth(30, background_size.h - front_size.h - 30)
    let bg = RandomNumBoth(1, 10)
    // console.log(x, y, bg);
    let [front, background] = await Promise.all([makeProspect(x, y, bg), makeBackground(x, y, bg)])
    if (res) await setSession(x, res)
    return { front, background, yield: y }
    // console.log(front, background);
}
async function svgToPng(svg = '') {
    let buffer = await sharp(Buffer.from(svg)).resize(240, 84).png().toBuffer()
    return String('data:image/png;base64,' + buffer.toString('base64'))
}
module.exports = { getSlideCode, svgToPng }
// async function test(params) {
//     for (let index = 0; index < 10000; index++) {
//         await getSlideCode()
//     }
// }
// test()