<template>
  <div>
    <div
      :class="[disabled ? 'cover-head' : 'cover-info-head']"
      :style="{ '--height': `${height}px` }"
      @click="editCropper()"
    >
      <el-image
        fit="contain"
        :src="value"
        class="image-slot"
        :style="{ '--height': `${height}px`, '--width': `${width}px`, 'border-radius': '3px' }"
      >
        <div slot="error">
          <i class="el-icon-picture-outline picture-icon"></i>
        </div>
      </el-image>
    </div>
    <el-dialog
      :title="title"
      :visible.sync="open"
      :width="fixed ? '1000px' : '500px'"
      append-to-body
      @opened="modalOpened"
      @close="closeDialog()"
    >
      <el-row :gutter="6">
        <el-col :xs="24" :md="fixed ? 12 : 24" class="col-height">
          <div class="image__preview">
            <el-image style="width: 100%; height: 100%; border-radius: 3px;" fit="contain" :src="options.img">
              <div slot="error" class="image-slot error-image">
              <i class="el-icon-picture-outline"></i>
            </div>
            </el-image>
          </div>
        </el-col>
        <el-col :xs="24" :md="12" class="col-height col-preview" v-if="fixed">
          <div :style="previews.div">
            <img :src="previews.url" :style="previews.img" />
          </div>
        </el-col>
      </el-row>
      <br />
      <el-row class="flex">
        <el-col :span="5">
          <el-upload
            action="#"
            :http-request="requestUpload"
            :show-file-list="false"
            :before-upload="beforeUpload"
          >
            <el-button size="small">
              选择
              <i class="el-icon-upload el-icon--right"></i>
            </el-button>
          </el-upload>
        </el-col>
        <el-col  :span="3">
          <el-button type="primary" size="small" @click="uploadImg()">提 交</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
  // import { VueCropper } from 'vue-cropper';
  import { streamUpload } from '@/api/public.js';
  import { promiseFileMd5 } from '@/utils/common/tools.js';

  export default {
    // components: { VueCropper },
    props: {
      value: {
        type: String,
        default: '',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      title: {
        type: String,
        default: '修改',
      },
      pathInfo: {
        type: String,
        default: '',
      },
      autoCropWidth: {
        type: Number,
        default: 0,
      },
      autoCropHeight: {
        type: Number,
        default: 0,
      },
      fixedNumber: {
        type: Array,
        default: [9, 16],
      },
      fixed: {
        type: Boolean,
        default: true,
      },
    },
    watch: {
      value(newValue, oldValue) {
        this.options.img = newValue;
      },
    },
    data() {
      return {
        // 是否显示弹出层
        open: false,
        // 是否显示cropper
        visible: false,
        // 弹出层标题
        // title: '修改头像',
        name: '',
        options: {
          img: '', //裁剪图片的地址
          autoCrop: true, // 是否默认生成截图框
          fixed: true, // 固定截图框大小 不允许改变
          full: true, // 是否输出原图比例的截图
        },
        previews: {},
        file: null,
      };
    },
    computed: {
      height() {
        return this.fixedNumber[1] >= this.fixedNumber[0] ? 160 : 80;
      },
      width() {
        return (this.height / this.fixedNumber[1]) * this.fixedNumber[0];
      },
    },
    methods: {
      // 编辑头像
      editCropper() {
        if (this.disabled) return;
        this.previews = {};
        this.options.img = this.value;
        this.open = true;
        this.name = '';
      },
      // 打开弹出层结束时的回调
      modalOpened() {
        this.visible = true;
      },
      // 覆盖默认的上传行为
      requestUpload() {},
      // 向左旋转
      // rotateLeft() {
      //   this.$refs.cropper.rotateLeft();
      // },
      // 向右旋转
      // rotateRight() {
      //   this.$refs.cropper.rotateRight();
      // },
      // 图片缩放
      // changeScale(num) {
      //   num = num || 1;
      //   this.$refs.cropper.changeScale(num);
      // },
      // 上传预处理
      beforeUpload(file) {
        this.file = file;
        if (file.type.indexOf('image/') == -1) {
          this.$notify.error('文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。');
        } else {
          this.name = file.name;
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            this.options.img = reader.result;
          };
        }
      },
      // 上传图片
      uploadImg() {
        // this.$refs.cropper.getCropBlob((data) => {
        //   console.log(`this.options---:`,this.options)
        //   console.log(`data---:`,data)
          promiseFileMd5(this.file)
            .then((md5) => {
              return streamUpload(this.file, {
                md5,
                name: this.name || `${md5}.jpg`,
                path_info: this.pathInfo,
              });
            })
            .then((res) => {
              if (res && res.code == 0) {
                this.open = false;
                // this.options.img = res.data.url;
                this.$emit('input', res.data.url);
                this.$notify.success('修改成功！');
                this.visible = false;
              } else {
                this.$notify.error('修改失败！');
              }
            });
        // });
      },
      // 实时预览
      realTime(val) {
        const _this = this;
        this.$refs.cropper.getCropBlob((data) => {
          this.blobToDataURI(data, function (res) {
            let height = _this.fixedNumber[1] >= _this.fixedNumber[0] ? 320 : 160;
            let width = (height / _this.fixedNumber[1]) * _this.fixedNumber[0];
            val.div = {
              height: `${height}px`,
              width: `${width}px`,
              overflow: 'hidden',
            };
            val.img = {
              height: `${height}px`,
              width: `${width}px`,
            };
            val.url = res;
            _this.previews = val;
          });
        });
      },
      blobToDataURI(blob, callback) {
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = function (e) {
          callback(e.target.result);
        };
      },
      // 关闭窗口
      closeDialog() {
        this.options.img = this.value;
        this.visible = false;
      },
    },
  };
</script>
<style scoped lang="scss">
  .cover-info-head {
    position: relative;
    display: inline-block;
    height: var(--height);
    overflow: hidden;
  }
  .cover-head {
    position: relative;
    display: inline-block;
    height: var(--height);
    overflow: hidden;
  }
  .cover-info-head:hover:after {
    content: '+';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    color: #eee;
    background: rgba(0, 0, 0, 0.5);
    font-size: 48px;
    font-style: normal;
    border-radius: 5px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    cursor: pointer;
    line-height: var(--height);
    text-align: center;
  }
  .image-slot {
    height: var(--height);
    width: var(--width);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #c0c4cc;
  }
  .picture-icon {
    font-size: 36px;
    color: #fff;
  }
  .col-height {
    height: 350px;
  }
  .col-preview {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .image__preview{
    width: 100%;
    height: 100%;
    border-radius: 3px;
    background-color: #cbcccf;
    align-items: center;
    justify-content: center;
  }
  ::v-deep .image__preview .el-image{
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
