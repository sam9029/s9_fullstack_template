<template>
  <div>
    <BaseDialog
      :visible.sync="open_dia"
      ref="CustomColumnPanel"
      title="请选择封面"
      width="600px"
      :okLoading="okLoading"
      @visible-change="visibleChange"
    >
      <div
        class="content-image-box"
        v-loading="loading"
        element-loading-text="视频截取中"
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.8)"
      >
        <el-radio-group v-model="checked" :max="1">
          <el-radio v-for="{ url, label } in image_list" :label="label" :key="label">
            <img :src="url" class="image" />
            <div class="lable-cover">{{ label }}</div>
          </el-radio>
        </el-radio-group>
      </div>
    </BaseDialog>
    <canvas id="canvas" width="640" height="480" style="display: none"></canvas>
  </div>
</template>
<script>
import BaseDialog from '@/components/BaseDialog/index.vue';
import { promiseWithTimeout } from '@/utils/tools.js';
export default {
  components: { BaseDialog },
  data() {
    return {
      open_dia: false,
      duration: 0,
      checked: '',
      image_list: [],
      loading: false,
      okLoading: false,
    };
  },
  methods: {
    async visibleChange(val, type) {
      this.open_dia = val;
      //   console.log(val, type, this.checked);
      if (type == 'ok') {
        if (this.checked) {
          let item = this.image_list.find((i) => i.label == this.checked);
          if (!item) return;
          this.okLoading = true;
          
          item.file = await this.compressImage(item.url).finally(() => {
            this.okLoading = false;
          });
          // dataURLToBlob(item.url);
          // if (item.file?.size > 500 * 1024)
          if (item.file) this.$emit('submit', item);
          else return this.$notify.error('封面处理失败！');
        }
        this.open_dia = false;
      }
    },
    async compressImage(dataURL, times = 0) {
      return await new Promise((resolve, reject) => {
        try {
          let blobFile = this.dataURLToBlob(dataURL);
          if (blobFile?.size <= 500 * 1024) return resolve(blobFile);
          if (times >= 3) return resolve(blobFile);
          times++;
          let img = new Image();
          img.src = dataURL;

          img.onload = () => {
            // 创建 Canvas 元素
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            // 设置目标宽高（可根据需要调整）
            let maxWidth = 1080; // 最大宽度
            let maxHeight = 1080; // 最大高度
            let width = img.width;
            let height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 按比例缩放
            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            // 绘制图片到 Canvas
            ctx.drawImage(img, 0, 0, width, height);
            // 获取压缩后的 Data URL
            let compressedDataURL = canvas.toDataURL('image/jpeg', 0.8);
            img.onload = null;
            img = null;
            return resolve(this.compressImage(compressedDataURL, times)); // 递归调用
            // 转换为 Blob 检查大小
            // let compressedBlob = this.dataURLToBlob(compressedDataURL);
            // // 清除 Image 实例
            // if (compressedBlob.size <= 500 * 1024) return resolve(compressedBlob);
            // console.warn('Compressed image still exceeds 500KB. Recompressing...');
            // return resolve(this.compressImage(compressedDataURL)); // 递归调用
          };

          img.onerror = () => {
            reject('图片渲染异常！');
          };
        } catch (error) {
          reject(error?.message || error || '图片压缩失败！');
        }
      });
    },
    dataURLToBlob(dataUrl) {
      const [header, data] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)[1];
      const binary = atob(data);
      const array = [];

      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }

      return new Blob([new Uint8Array(array)], { type: mime });
    },
    open(video_info, file) {
      if(!file) return this.$notify.warning('请先选择视频文件')
      this.open_dia = true;
      this.loading = true;
      this.checked = '';
      this.image_list = [];
      this.init(file, video_info)
        .then((res) => {
          return this.getImage(res);
        })
        .then((imglist) => {
          this.image_list = imglist;
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    async getImage({ times = [], video }) {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      let back = [];
      for (let index = 0; index < times.length; index++) {
        const time = times[index];
        let p = new Promise((resolve, reject) => {
          video.currentTime = time; // 这里设置要截取的时间点（秒）
          video.addEventListener('seeked', () => {
            try {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve({ url: imageUrl, label: `第${time.toFixed(1)}秒` });
            } catch (error) {
              reject(error);
            }
          });
        });
        back.push(await promiseWithTimeout(p, 5));
      }
      return back;
    },
    randomTime(time) {
      if (time <= 1) return [];
      if (time == 1) return [1];
      let skip = (time - 1) / 8;
      let back = [1];
      for (let index = 1; index <= 7; index++) {
        const element = 1 + index * skip;
        back.push(element);
      }
      back.push(time);
      return back;
    },
    async init(file, video_info) {
      return await new Promise((resolve, reject) => {
        try {
          const video = document.createElement('video');
          if (video_info?.blobUrl) video.src = video_info?.blobUrl;
          else video.src = URL.createObjectURL(file);
          video.load();
          video.addEventListener('loadedmetadata', () => {
            this.duration = Math.floor(video.duration);
            const canvas = document.getElementById('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            resolve({ times: this.randomTime(this.duration), video });
          });
          video.addEventListener('error', (err) => {
            reject(err);
          });
        } catch (error) {
          reject(error);
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.content-image-box {
  min-height: 30vh;
  .el-radio-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  ::v-deep .el-radio {
    margin: 0px;
    .el-radio__label {
      padding: 0;
      height: 100%;
      width: 100%;
      display: block;
      background-color: rgba($color: #000000, $alpha: 0.4);
      border-radius: 5px;
      overflow: hidden;
      text-align: center;
    }
    .el-radio__input {
      position: absolute;
      top: 6px;
      right: 6px;
    }
  }
  .lable-cover {
    position: absolute;
    left: 0;
    bottom: 0;
    right: 0;
    height: 18px;
    background-color: rgba($color: #000000, $alpha: 0.3);
    color: #ffffff;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
  .image {
    max-width: 180px;
    max-height: 180px;
    display: inline-block;
  }
}
</style>