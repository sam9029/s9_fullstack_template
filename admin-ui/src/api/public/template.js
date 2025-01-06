import request from '@/utils/request';
import { Message } from 'element-ui';

export function getTemplate(params) {
  request({
    // url: `/api/public/download_template/get`,
    url: `https://api-test.lizhibj.cn/api/public/download_template/get`,
    method: 'get',
    responseType: 'blob',
    params,
  })
    .then(async (res) => {
      let fileInfo = res.headers['content-disposition'];
      if (!fileInfo) {
        let reader = new FileReader();
        reader.readAsText(res.data, 'utf-8');
        let data = null;
        let promise = new Promise((resolve) => {
          reader.onload = function () {
            try {
              data = JSON.parse(reader.result);
            } catch (error) {
              data = null;
            }
            resolve();
          };
        });
        await promise;
        if (data && data.code) return Message.error(data.message);
        return Message.error('文件下载异常');
      }
      let file_name = fileInfo.split('filename=').pop();
      file_name = decodeURI(file_name);
      const $link = document.createElement('a');
      $link.download = file_name;
      $link.href = URL.createObjectURL(res.data);
      $link.click();
      Message.success('文件下载成功');
    })
    .catch(() => {
      Message.error('文件下载异常');
    });
}
