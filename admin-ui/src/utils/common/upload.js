import OSS from 'ali-oss'
import request from '@/utils/request'
// import store from "@/store";
import { promiseFileMd5, uuid } from '@/utils/common/tools.js'
import { MATERIAL_TYPE_ENUM } from '@/utils/mapper';


function uploadCheck(data) {
  return request({
    url: "/manage/material/check",
    method: "post",
    data,
    timeout: 120000
  })
}

function uploadStsAccess(params) {
  return request({
    url: "/public/upload_access",
    method: "get",
    params,
    timeout: 3000
  })
}

function getSTSToken() {
  return uploadStsAccess().then((data) => {
    if (data.code == 0) {
      return {
        accessKeyId: data.data.AccessKeyId,
        accessKeySecret: data.data.AccessKeySecret,
        stsToken: data.data.SecurityToken,
      }
    } else {
      throw new Error('token获取失败，请刷新后重试！');
    }
  })
}

let client = null;

/**
 * @returns { Promise<OSS> }
 */
function createOssClient(_bucket = 'koc-material') {
  // const _bucket = store.state.user.bucket;
  // const _bucket = 'koc-material';
  if (client) {
    client.useBucket(_bucket);
    return Promise.resolve(client);
  }
  return getSTSToken().then(data => {
    client = new OSS({
      region: "oss-cn-beijing",
      accessKeyId: data.accessKeyId,
      accessKeySecret: data.accessKeySecret,
      stsToken: data.stsToken,
      bucket: _bucket,
      timeout: '300s',
      secure: true,
      refreshSTSTokenInterval: 840000, //ms
      refreshSTSToken: getSTSToken,
    })
    return client;
  })
}

/**
 * @param { OssUploadConfig } uploadConfig 
 * @returns 
 */
function ossUpload(uploadConfig) {
  return createOssClient(uploadConfig.bucket).then(client => {
    const { raw: file, dir, md5, onprogress, status } = uploadConfig;
    if (status == "abort") throw "abort upload";

    const options = {
      progress: function (p, cpt) {
        uploadConfig.__MKT_UPLOAD_CPT = cpt;
        onprogress?.(p);
      },
      parallel: 4, // 并发数
      partSize: 1024 * 1024, // 分片大小 1MB
      meta: { md5: md5, name: encodeURIComponent(file.name) },
      mime: file.type,
      // callback: {
      //   url: 'https://api-test.lizhibj.cn/oss_upload_callback',
      //   body: 'bucket=${bucket}&object=${object}&md5=${x:md5}',
      //   contentType: 'application/x-www-form-urlencoded',
      //   customValue: { md5: md5 }
      // }
    }
    if (uploadConfig.__MKT_UPLOAD_CPT) {
      options.checkpoint = uploadConfig.__MKT_UPLOAD_CPT;
    }

    // 兼容axios的cancelToken
    uploadConfig.cancelSource = {
      cancel: function (reason) {
        if (uploadConfig.__MKT_UPLOAD_CPT) {
          const { name: cpt_name, uploadId } = uploadConfig.__MKT_UPLOAD_CPT;
          client.abortMultipartUpload(cpt_name, uploadId)
        }
      }
    }
    const newName = renameFile(file.name, dir);
    return client.multipartUpload(newName, file, options);
  }).then(ossRes => {
    const { name } = ossRes;
    return createResponse(name, uploadConfig);
  }).catch(err => {
    return handleOssError(err, uploadConfig);
  })
}

function renameFile(name = '', dir = 'koc_task_materials') {
  if (process.env.NODE_ENV == 'development') dir = 'koc_task_dev'
  const uid = uuid();
  const ext = name.match(/\.([^\.]+)$/)?.[0];
  if(dir) dir = dir + '/'
  if (!ext || ext === name) return dir + uid;
  return dir + uid + ext;
}

function createResponse(name, uploadConfig = {}) {
  // const host = store.state.user.bucket_host;
  let bucket = uploadConfig.bucket || "koc-material"
  const host = `https://${bucket}.lizhibj.cn/`;
  const url = host + name;
  const { raw, md5 } = uploadConfig;
  const data = {
    code: 0,
    mimetype: raw.type,
    name: raw.name,
    size: raw.size,
    bucket,
    original_oss_key: name,
    url,
  };
  if (md5) data.md5 = md5;
  return data
}

function handleOssError(err, uploadConfig) {
  if (err.code == 'CallbackFailed' && err.status == 203) {
    const { object } = err.params;
    return createResponse(object, uploadConfig);
  }

  const wrapperErr = { code: 1, message: '' };
  if (err.code == 'RequestError' || err.isAxiosError) {
    wrapperErr.message = '网络环境异常';
  } else if (err.code == 'ServerError') {
    wrapperErr.message = '服务器异常';
  } else if (err.code == 'ClientError') {
    wrapperErr.message = '客户端异常';
  } else {
    wrapperErr.message = err.message || '';
  }
  throw wrapperErr;
}

/**
 * 检查config中是否有md5
 * @returns { Promise<void> }
 */
function checkMd5(uploadConfig) {
  if (uploadConfig.md5) return Promise.resolve();
  return promiseFileMd5(uploadConfig.raw).then(md5 => {
    uploadConfig.md5 = md5;
  });
}

/**
 * 检查服务器中是否有相同MD5的文件链接
 * @param { OssUploadConfig } uploadConfig 
 * @returns { Promise<string> }
 */
function checkFileExist(uploadConfig) {
  if (uploadConfig.skipCheck) {
    return Promise.resolve(null);
  }
  return checkMd5(uploadConfig).then(() => {
    const checkParam = { md5: uploadConfig.md5 };
    return uploadCheck(checkParam)
  }).then((data) => {
    if (data.data) {
      return data.data.oss_key;
    } else {
      return null;
    }
  })
}

/**
 * Oss上传参数
 * @typedef {Object} OssUploadConfig
 * @property { File } raw 上传的文件
 * @property { string } name 
 * @property { string } [bucket]
 * @property { string } [md5] 
 * @property { 'uploading' | 'success' | 'fail' | 'abort' } [status] 
 * @property { Function } [onprogress] 
 * @property { string } [dir] 
 * @property { boolean } [allowRepeat] default false
 * @property { boolean } [skipCheck] default false
 */

/**
 * @param { OssUploadConfig } uploadConfig 
 * @returns 
 */
export function aliOssUpload(uploadConfig) {
  if (!uploadConfig.bucket) uploadConfig.bucket = "koc-img" //默认公共文件夹
  return checkFileExist(uploadConfig).then((oss_key) => {
    if (oss_key) {
      if (!uploadConfig.allowRepeat) {
        return {
          code: 1,
          message: '文件已存在，请不要重复上传！'
        }
      } else {
        return createResponse(oss_key, uploadConfig);
      }
    } else {
      return ossUpload(uploadConfig);
    }
  })
}


export function videoStats(file) {
  return new Promise((resolve, reject) => {
    const media = document.createElement('video');
    const blobUrl = URL.createObjectURL(file);
    media.onloadedmetadata = function (event) {
      // URL.revokeObjectURL(blobUrl);
      const width = media.videoWidth,
        height = media.videoHeight;
      const stats = {
        width,
        height,
        size: file.size,
        duration: parseInt(media.duration),
        type: MATERIAL_TYPE_ENUM.VIDEO,
        blobUrl: blobUrl,
      };
      resolve(stats);
    };
    media.onerror = function () {
      reject('获取文件信息失败！')
    }
    media.src = blobUrl;
    media.load();
  });
}

function imageStats(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const blobUrl = URL.createObjectURL(file);
    image.onload = function () {
      // URL.revokeObjectURL(blobUrl);
      const width = image.width,
        height = image.height;
      const stats = {
        width,
        height,
        size: file.size,
        type: MATERIAL_TYPE_ENUM.IMAGE,
        blobUrl: blobUrl,
      };
      resolve(stats);
    };
    image.onerror = function () {
      reject('获取文件信息失败！')
    }
    image.src = blobUrl;
  });
}

function audioStats(file) {
  return new Promise((resolve, reject) => {
    const media = document.createElement('audio');
    const blobUrl = URL.createObjectURL(file);
    media.onloadedmetadata = function (event) {
      // URL.revokeObjectURL(blobUrl);
      const stats = {
        size: file.size,
        duration: parseInt(media.duration),
        type: MATERIAL_TYPE_ENUM.AUDIO,
        blobUrl: blobUrl,
      };
      resolve(stats);
    };
    media.onerror = function () {
      reject('获取文件信息失败！')
    }
    media.src = blobUrl;
    media.load();
  });
}

function defaultStats(file) {
  return Promise.resolve({
    size: file.size,
  })
}

export const utils = {
  defaultStats,
  videoStats,
  imageStats,
  audioStats,
}