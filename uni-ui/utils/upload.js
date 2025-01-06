import OSS from 'ali-oss'
import request from '@/utils/request'
import store from "@/store";
const host = 'https://koc-img.lizhibj.cn/';
import SparkMD5 from "spark-md5";


function uploadCheck(data) {
	return request({
		url: "/api/public/upload_check",
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
function createOssClient() {
	const _bucket = 'koc-img';
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

function ossUpload(uploadConfig) {
	return createOssClient().then(client => {
		const {
			file,
			md5,
			onprogress,
			status
		} = uploadConfig;
		if (status == "abort") throw "abort upload";

		const options = {
			progress: function(p, cpt) {
				uploadConfig.__MKT_UPLOAD_CPT = cpt;
				onprogress?.(p);
			},
			parallel: 4, // 并发数
			partSize: 1024 * 1024, // 分片大小 1MB
			meta: {
				md5: md5,
				name: encodeURIComponent(file.name)
			},
			mime: file.type
		}
		if (uploadConfig.__MKT_UPLOAD_CPT) {
			options.checkpoint = uploadConfig.__MKT_UPLOAD_CPT;
		}
		const newName = renameFile(file.name, md5);

		// 兼容axios的cancelToken
		uploadConfig.cancelSource = {
			cancel: function(reason) {
				if (uploadConfig.__MKT_UPLOAD_CPT) {
					const {
						name: cpt_name,
						uploadId
					} = uploadConfig.__MKT_UPLOAD_CPT;
					client.abortMultipartUpload(cpt_name, uploadId)
				}
			}
		}
		return client.multipartUpload(newName, file, options);
	}).then(ossRes => {
		const {
			name
		} = ossRes;
		return createResponse(host + name, uploadConfig);
	}).catch(err => {
		return handleOssError(err, uploadConfig);
	})
}

function getUuid() {
	var s = [];
	var hexDigits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	for (var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
	}
	s[14] = "4"
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
	s[8] = s[13] = s[18] = s[23] = ""
	let uuid = s.join("")
	return uuid
}

function renameFile(name = '', md5 = '') {
	const ext = name.match(/\.([^\.]+)$/)?. [0];
	if (!ext || ext === name) return md5;
	return 'material/' + md5 + ext;
}

export function getMd5(file) {
	let currentChunk = 2097152;
	return new Promise((resolve, reject) => {
		const spark = new SparkMD5.ArrayBuffer();
		const reader = new FileReader();
		const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
		reader.onload = ({
			target: {
				result
			}
		}) => {
			spark.append(result);
			if (currentChunk >= file.size) {
				reader.removeEventListener("load", reader.onload);
				reader.removeEventListener("error", reader.onerror);
				resolve({
					md5: spark.end(),
					file
				});
			} else {
				const start = currentChunk;
				currentChunk += 2097152;
				const end = Math.min(currentChunk, file.size);
				reader.readAsArrayBuffer(blobSlice.call(file, start, end));
			}
		};
		reader.onerror = function() {
			reader.removeEventListener("load", reader.onload);
			reader.removeEventListener("error", reader.onerror);
			reject("E_READ_FAIL");
		};
		const end = Math.min(currentChunk, file.size);
		reader.readAsArrayBuffer(blobSlice.call(file, 0, end));
	});
}

function createResponse(url, uploadConfig = {}) {
	const {
		file,
		md5
	} = uploadConfig;
	const data = {
		code: 0,
		mimetype: file.type,
		name: file.name,
		size: file.size,
		url,
	};
	if (md5) data.md5 = md5;
	return data
}

function handleOssError(err, uploadConfig) {
	if (err.code == 'CallbackFailed' && err.status == 203) {
		const {
			object
		} = err.params;
		return createResponse(host + object, uploadConfig);
	}

	const wrapperErr = {
		code: 1,
		message: ''
	};
	if (err.code == 'RequestError' || err.isAxiosError) {
		wrapperErr.message = '网络环境异常';
	} else if (err.code == 'ServerError') {
		wrapperErr.message = '服务器异常';
	} else if (err.code == 'ClientError') {
		wrapperErr.message = '错误上传';
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
	return promisefyMd5(uploadConfig.raw).then(md5 => {
		uploadConfig.md5 = md5;
	});
}

/**
 * 检查服务器中是否有相同MD5的文件链接
 * @returns { Promise<string> }
 */
function checkFileExist(uploadConfig) {
	return checkMd5(uploadConfig).then(() => {
		const checkParam = {
			md5s: [uploadConfig.md5]
		};
		return uploadCheck(checkParam)
	}).then((checkRes) => {
		const {
			data
		} = checkRes;
		if (data.code == 0) {
			return data.data[uploadConfig.md5];
		} else {
			throw data;
		}
	})
}

export function aliOssUpload(uploadConfig) {
	return ossUpload(uploadConfig)
}
