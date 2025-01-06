import request from './request';


let registered = false;
export function screenShotMonitor() {
  if (registered) return;
  // if (!isWxMiniProgram()) return;
 
  uni.onUserCaptureScreen(userCaptureScreenCallback);
  registered = true;
}

// function isWxMiniProgram() {
//   try {
//     return !!wx;
//   } catch {
//     return false;
//   }
// }

function userCaptureScreenCallback(res) {
  return request({
		url: '/login/screenshot',
		method: 'get',
	})
}
