import Axios from 'axios';
import request from '@/utils/request';
import { Message } from 'element-ui';
import {
  promiseFileMd5,
  generatePreviewLink,
  generateVideoScreenshot,
} from '@/utils/common/tools.js';

/*
 * * * * * * * * * * * * * * * * * * * * * *
 * 注意事项
 * 除了两点：
 * - 预上传接口地址不同
 * - 真实上传接口会返回参数 upload_id 和 upload_url
 * 其他与 （src/utils/common/uploadV3.js） 保持一致
 * * * * * * * * * * * * * * * * * * * * * *
 */

/**
 * uploadV3 预上传接口
 * @param {*} params
 * @returns {Object} 返回文件的指定上传接口
 * data:{ url:'https://xxxxx/xxxxx' }
 */
export function preGetFileUploadApi(params) {
  return request({
    url: `/public/duolai_upload_id`,
    method: 'get',
    params,
  });
}

/** 开发环境回调函数 */
export function callbackApi(data) {
  return request({
    url: `/public/callback/duolai_upload`,
    method: 'post',
    data,
  });
}

/** 睡眠执行  */
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// UN列举所有 常见 mime 类型来做晒选

// 预上传API可上传类型 & 请求头类型
const CONTENT_TYPE_MAPPER = {
  mp4: 'video/mp4',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  mov: 'video/quicktime',
  bmp: 'image/bmp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  mp3: 'audio/mpeg',
};

// 翻转 CONTENT_TYPE_MAPPER 键值对
function handleRreverseMapper(_mapper) {
  if (JSON.stringify(_mapper) == '{}') return {};
  let MIDDLE_MAPPER = {};
  Object.keys(_mapper).forEach((key) => {
    let tempKey = _mapper[key];
    MIDDLE_MAPPER[tempKey] = key;
  });
  return MIDDLE_MAPPER;
}

/**
 * Oss上传参数
 * @typedef {Object} _uploadConfig
 * @property { String } folder 文件上传的文件夹位置
 * @property { String } bucket 文件上传的二级域名
 * @property { String } mime_type (可选，会将传入的file类型设为默认) 文件类型 （仅简洁模式 'mp4' or 'jpg' or ... ）
 * @property { String } file_name (可选，默认不传)
 */

/**
 * 文件上传
 * @description （使用前先看）模式为 1.先调用`预上传接口`获取文件的`指定上传链接接口`、2.通过返回的`指定上传链接接口`上传文件
 * @param { _uploadConfig } _uploadConfig
 * @param { File } _file
 * @param { Function } _callback 回调上传进度
 * @param { Object } _acceptType 可接受文件类型（键值对），指定上传链接接口headers['Content-Type']使用
 * @returns { void }
 * 
 * @example 
 * uploadV3(
    {
      folder: 'public',
      bucket: 'duolai-img',
      // mime_type: 'mp4' // 默认不使用
      // file_name: '' // 默认不使用
    },
    file.file, 
    this.onUploadProgress, // 回调传入
   );
 */
export async function uploadV3ForUploadId(
  _uploadConfig = {},
  _file,
  _callback,
  _acceptType = { ...CONTENT_TYPE_MAPPER },
) {
  if (!_file.type) {
    Message.error('上传文件缺失type(mime_type)参数');
    return Promise.reject({ code: 1 });
  }

  // 解析文件类型后缀
  let ACCEPT_FILE_TYPE_MAPPER = handleRreverseMapper(_acceptType);
  let file_type = _file.type.split('/')[1];
  if (ACCEPT_FILE_TYPE_MAPPER[_file.type]) {
    file_type = ACCEPT_FILE_TYPE_MAPPER[_file.type];
  } else {
    Message.warning('不支持上传该文件类型，请检查上传文件类型！');
  }

  // 预上传接口参数配置
  const params = {
    // folder: _uploadConfig['folder'] || 'public',
    // bucket: _uploadConfig['bucket'] || 'duolai-img',
    mine_type: _uploadConfig['mime_type'] || file_type,
  };
  // _uploadConfig.file_name && (params.file_name = _uploadConfig.file_name);

  // 处理本地开发 环境上传时的文件路径
  // if (process && process?.env && process.env?.NODE_ENV == 'development') {
  //   params.folder = 'dev';
  // }

  return await new Promise(async (resolve, reject) => {
    try {
      // 获取文件的指定上传链接
      let pre_res = await preGetFileUploadApi(params);
      if (pre_res.code == 0) {
        // 取文件上传API接口
        const file_upload_api = pre_res.data.upload_url;
        const file_upload_id = pre_res.data.upload_id;
        // const file_upload_uid = pre_res.data.upload_uid;

        // 获取 文件的上传的 ossAccessKeyId
        const url_info = new URL(file_upload_api);
        const ossKey = url_info.pathname; // searchParams.get('OSSAccessKeyId');

        // 组成 文件返回信息
        const BACK_INFOS = {
          file_name: _file.name,
          file_uid: _file.uid,
          file_type: file_type,
          file_origin_type: _file.type,
          file_api_url: file_upload_api,
          file_upload_id, // 预上传接口返回的视频信息
          // file_upload_uid, // 预上传接口返回的视频信息
          oss_key: ossKey,
          local_preview_url: generatePreviewLink(_file), // 外部使用的预览链接
        };

        // 直接使用未封装的Axios，（不使用requset，因为有自定义headers, ali云检验严格, 导致失效）
        Axios({
          url: file_upload_api,
          method: 'put',
          data: _file,
          headers: {
            'Content-Type': _acceptType[file_type] || 'application/octet-stream',
          },
          onUploadProgress: function (progress) {
            let cur_progress = Math.round((progress.loaded / progress.total) * 100);
            _callback &&
              // 返回文件上传接口及其他信息
              _callback({
                ...BACK_INFOS,
                progress: cur_progress, // 上传进度 （100 即为 成功上传）
              });
          },
        })
          .then(async (real_res) => {
            // Message.success('文件上传成功！');
            /**开发环境自动回调 */
            if (process && process?.env && process.env?.NODE_ENV == 'development') {
              await sleep(1000);
              callbackApi({
                upload_id: pre_res.data.upload_id,
                upload_uid: pre_res.data.upload_uid,
              })
                .then(() => {
                  resolve({
                    ...BACK_INFOS,
                    progress: 100, // 上传进度 （100 即为 成功上传）
                  });
                })
                .catch((err) => {
                  reject(err.response.data); // 捕获错误，有点特殊
                });
            } else {
              resolve({
                ...BACK_INFOS,
                progress: 100, // 上传进度 （100 即为 成功上传）
              });
            }
          })
          .catch((err) => {
            Message.error(err || err.message || '文件上传失败！');
            reject(err); // 捕获错误
          });
      } else {
        reject(pre_res); // 捕获 preGetFileUploadApi 的错误
      }
    } catch (error) {
      Message.error(error || error.message || '获取文件上传接口失败！');
      reject(error); // 捕获错误
    }
  });
}
