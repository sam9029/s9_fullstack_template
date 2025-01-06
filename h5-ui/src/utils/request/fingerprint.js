import FingerprintJS from '@fingerprintjs/fingerprintjs';
import request from '@/utils/request';
const fpPromise = FingerprintJS.load();

export async function getFingerPrint() {
  const fp = await fpPromise;
  return new Promise((resolve, reject) => {
    fp.get().then(res => {
        const { confidence, visitorId } = res
        resolve({ finger_print: visitorId || undefined, score: confidence?.score })
      }).catch(error => {
        reject(error)
      })
  })
}
export function sendFingerPrint(data) {
  return request({
    url: '/manage/marking/user/fingerprint',
    method: 'post',
    data,
  }).catch((err) => {
    console.log(err);
  });
}
