export { compressImg };

/**
 *
 * @param {*} file 图片文件
 * @param {*} quality 压缩比 （ 0.2 —— 0.5 为最佳实践压缩比）;
 * @param {*} trigger_size 须小于 10*1024;触发压缩的图片文件大小（单位kB_二进制）;
 * @returns {Object}
 *
 * @example
 * async () => {
 *  let res = await compressImg( origin_file , 0.52 , 2 * 1024)
 *  return res
 * }
 */
function compressImg(file, quality = null, trigger_size = 1 * 1024) {
  const optimum_compression_ratio = 0.52; // 默认压缩比
  const file_origin_kb_size = (file.size / 1024).toFixed(2); // 查看图片原始大小（kb）

  // 判断环境是否支持canvas
  if (!isCanvasSupported()) {    
    if (Object.prototype.toString.call(file) == '[object Array]') {
      return Promise.resolve(file);
    } else {
      return Promise.resolve({ file: file });
    }
  }

  if (!quality) {
    quality = optimum_compression_ratio;
  }

  // 如果是 file 为数组返回 Promise 数组
  if (file[0]) {
    return Promise.all(Array.from(file).map((e) => this.compressImg(e, quality)));
  }
  // 如果是 file 为对象进行压缩
  else {
    return new Promise((resolve) => {
      // 是否触发压缩--不满足直接返回原文件
      if (file_origin_kb_size < trigger_size) {
        resolve({ file: file });
      }
      // 满足压缩条件
      else {
        // 创建 FileReader
        const reader = new FileReader();
        // 双重解构拿到源文件的 base64 编码链接
        reader.onload = ({ target: { result: src } }) => {
          // 创建 img 元素
          const image = new Image();
          image.onload = async () => {
            const canvas = document.createElement('canvas'); // 创建 canvas 元素
            const context = canvas.getContext('2d');

            var targetWidth = image.width;
            var targetHeight = image.height;
            var originWidth = image.width;
            var originHeight = image.height;

            if (1 * 1024 <= file_origin_kb_size && file_origin_kb_size <= 10 * 1024) {
              var maxWidth = 1600;
              var maxHeight = 1600;
              targetWidth = originWidth;
              targetHeight = originHeight;
              // 图片尺寸超过的限制
              if (originWidth > maxWidth || originHeight > maxHeight) {
                if (originWidth / originHeight > maxWidth / maxHeight) {
                  // 更宽，按照宽度限定尺寸
                  targetWidth = maxWidth;
                  targetHeight = Math.round(maxWidth * (originHeight / originWidth));
                } else {
                  targetHeight = maxHeight;
                  targetWidth = Math.round(maxHeight * (originWidth / originHeight));
                }
              }
            }
            if (10 * 1024 <= file_origin_kb_size && file_origin_kb_size <= 20 * 1024) {
              maxWidth = 1400;
              maxHeight = 1400;
              targetWidth = originWidth;
              targetHeight = originHeight;
              // 图片尺寸超过的限制
              if (originWidth > maxWidth || originHeight > maxHeight) {
                if (originWidth / originHeight > maxWidth / maxHeight) {
                  // 更宽，按照宽度限定尺寸
                  targetWidth = maxWidth;
                  targetHeight = Math.round(maxWidth * (originHeight / originWidth));
                } else {
                  targetHeight = maxHeight;
                  targetWidth = Math.round(maxHeight * (originWidth / originHeight));
                }
              }
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            context.clearRect(0, 0, targetWidth, targetHeight);
            context.drawImage(image, 0, 0, targetWidth, targetHeight); // 绘制 canvas

            const canvasURL = canvas.toDataURL('image/jpeg', quality);
            const buffer = atob(canvasURL.split(',')[1]);
            let length = buffer.length;
            const bufferArray = new Uint8Array(new ArrayBuffer(length));
            while (length--) {
              bufferArray[length] = buffer.charCodeAt(length);
            }
            const miniFile = new File([bufferArray], file.name, {
              type: 'image/jpeg',
            });

            let res_file = {
              file: miniFile,
              origin: file,
              beforeSrc: src,
              afterSrc: canvasURL,
              beforeKB: Number((file.size / 1024).toFixed(2)),
              afterKB: Number((miniFile.size / 1024).toFixed(2)),
              quality: quality,
            };
            // // dev-log >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            // console.log('[Dev_Log][res_file]_>>>',res_file)
            resolve(res_file);
          };
          image.src = src;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * 判断环境是否支持 canvas 画布
 * @returns {Boolean}
 */
function isCanvasSupported() {
  // 创建一个 canvas 元素
  const canvas = document.createElement('canvas');
  // 检查浏览器是否支持 getContext 方法
  if (canvas.getContext && canvas.getContext('2d')) {
    return true;
  } else {
    return false;
  }
}

/**
 * 复制 File 对象
 * @param {*} originalFile
 * @returns {File}
 */
function cloneFile(originalFile) {
  // 创建一个新的 Blob 对象，使用原始文件的内容
  const newBlob = new Blob([originalFile], { type: originalFile.type });

  // 创建一个新的 File 对象，使用原始文件的名称和新创建的 Blob 对象
  const clonedFile = new File([newBlob], originalFile.name, { type: originalFile.type });

  return clonedFile;
}
