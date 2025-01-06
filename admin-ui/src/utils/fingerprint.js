import FingerprintJS from '@fingerprintjs/fingerprintjs'
import request from '@/utils/request';
const fpPromise = FingerprintJS.load()
// Initialize an agent at application startup.
export async function getFingerPrint() {
    //{ apiKey: 'NZ9e8gOEZa9p5YI3U8iE' }
    const fp = await fpPromise
    let data  = await fp.get()
    // console.log(data);
    return { fingerprint: data?.visitorId, score: data?.confidence?.score }
}
export function sendFingerPrint(data) {
    return request({
        url: '/manage/marking/user/fingerprint',
        method: 'post',
        data,
    }).catch(err => { console.log(err); });
}