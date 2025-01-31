/*
 * @Author: NI CAI
 * @Date: 2020-04-01 13:33:00
 * @LastEditTime :
 * @LastEditors  :
 * @Description:
 */
// 视频图片需求类
function fakeClick(obj) {
  var ev = document.createEvent('MouseEvents');
  ev.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null,
  );
  obj.dispatchEvent(ev);
}

function exportTxt(name, data) {
  var urlObject = window.URL || window.webkitURL || window;
  var export_blob = new Blob([data]);
  var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  save_link.href = urlObject.createObjectURL(export_blob);
  save_link.download = name;
  fakeClick(save_link);
}

export { exportTxt };
