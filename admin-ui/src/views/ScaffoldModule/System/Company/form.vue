<template>
  <el-form ref="form" :model="form" :rules="rules" label-width="80px">
    <el-row :gutter="12">
      <el-col :span="12">
        <el-form-item label="公司简称" prop="name">
          <el-input v-model="form.name" placeholder="请输入公司名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="公司全称" prop="company">
          <el-input v-model="form.company" placeholder="请输入公司全称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item v-if="!form.id" label="超管密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入超管密码" />
          <label class="tip-from">
            <i class="el-icon-warning"></i>
            默认超管账户为公司全称，建议设置复杂密码
          </label>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">开启</el-radio>
            <el-radio :label="2">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col>
        <el-form-item label="权限管理" class="otherClass">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="PC端" name="1">
              <h1>菜单权限</h1>
              <el-form-item>
                <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')"
                  >展开/折叠</el-checkbox
                >
                <el-checkbox
                  v-model="menuNodeAll"
                  @change="handleCheckedTreeNodeAll($event, 'menu')"
                  >全选/全不选</el-checkbox
                >
                <el-checkbox
                  v-model="form.menuCheckStrictly"
                  @change="handleCheckedTreeConnect($event, 'menu')"
                  >父子联动</el-checkbox
                >
                <el-tree
                  class="tree-border"
                  :data="menuOptions"
                  show-checkbox
                  ref="menu"
                  node-key="id"
                  style="height: 197px; overflow: scroll"
                  :check-strictly="!form.menuCheckStrictly"
                  empty-text="加载中，请稍后"
                  :props="defaultProps"
                  @check="menuChecks"
                ></el-tree>
              </el-form-item>
            </el-tab-pane>
            <el-tab-pane label="小程序" name="2">
              <h1>菜单权限</h1>
              <el-form-item>
                <el-checkbox
                  v-model="appletMenuExpand"
                  @change="handleCheckedTreeExpand($event, 'appletMenu')"
                  >展开/折叠</el-checkbox
                >
                <el-checkbox
                  v-model="appletMenuNodeAll"
                  @change="handleCheckedTreeNodeAll($event, 'appletMenu')"
                  >全选/全不选</el-checkbox
                >
                <el-checkbox
                  v-model="appletMenuCheckStrictly"
                  @change="handleCheckedTreeConnect($event, 'appletMenu')"
                  >父子联动</el-checkbox
                >
                <el-tree
                  :check-strictly="!appletMenuCheckStrictly"
                  :data="appletMenuOptions"
                  :props="defaultProps"
                  @check="appletMenuChecks"
                  class="tree-border"
                  empty-text="加载中，请稍后"
                  node-key="id"
                  ref="appletMenu"
                  show-checkbox
                  style="height: 197px; overflow: scroll"
                ></el-tree>
              </el-form-item>
            </el-tab-pane>
          </el-tabs>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="Logo类型" prop="logoMode">
          <el-radio-group @change="logoModeChange" v-model="form.logoMode">
            <el-radio label="both">图片+文字</el-radio>
            <el-radio label="image">图片</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Logo" prop="logo">
          <el-upload
            class="avatar-uploader"
            action
            :http-request="uploadLogo"
            :show-file-list="false"
            :before-upload="beforeUpload"
          >
            <img v-if="form.logo" :src="form.logo" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item v-if="form.logoMode == 'both'" label="名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入"></el-input>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="主题颜色" prop="theme">
          <el-color-picker
            v-model="form.theme"
            :predefine="[
              '#409EFF',
              '#1890ff',
              '#304156',
              '#212121',
              '#11a983',
              '#13c2c2',
              '#6959CD',
              '#f5222d',
            ]"
            class="theme-picker"
            popper-class="theme-picker-dropdown"
          />
        </el-form-item>
      </el-col>

      <el-col>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script>
  import { promiseFileMd5 } from '@/utils/common/tools.js';
  import { streamUpload } from '@/api/public.js';

  export default {
    model: {
      prop: 'value',
      event: 'input',
    },
    props: {
      value: {
        type: Object,
        default: () => {},
      },
      menuOptions: {
        type: Array,
        default: () => [],
      },
      postTreeData: {
        type: Array,
        default: () => [],
      },
      appletMenuOptions: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        form: {
          id: undefined,
          name: undefined,
          company: undefined,
          status: 1,
          auth_router: [],
          menuCheckStrictly: true,
          remark: undefined,
          password: undefined,
          theme: '#1890ff',
          logo: '',
          logoMode: 'image',
          title: '',
        },
        rules: {
          name: [{ required: true, message: '公司名称不能为空', trigger: 'blur' }],
          company: [{ required: true, message: '公司全称不能为空', trigger: 'blur' }],
          password: [{ required: true, message: '超管密码不能为空', trigger: 'blur' }],
        },

        menuExpand: false,
        menuNodeAll: false,
        defaultProps: {
          children: 'children',
          label: 'label',
        },

        activeTab: '1',
        appletMenuCheckStrictly: true,
        appletMenuExpand: false,
        appletMenuNodeAll: false,
      };
    },
    methods: {
      menuChecks(data, result) {},
      appletMenuChecks(data, result) {},

      // 树权限（展开/折叠）
      handleCheckedTreeExpand(value, type) {
        if (type == 'menu') {
          let treeList = this.menuOptions;
          for (let i = 0; i < treeList.length; i++) {
            this.$refs.menu.store.nodesMap[treeList[i].id].expanded = value;
          }
        } else if (type == 'dept') {
          // let treeList = this.deptOptions;
          // for (let i = 0; i < treeList.length; i++) {
          //   this.$refs.dept.store.nodesMap[treeList[i].id].expanded = value;
          // }
        } else if (type == 'appletMenu') {
          let treeList = this.appletMenuOptions;
          for (let i = 0; i < treeList.length; i++) {
            this.$refs.appletMenu.store.nodesMap[treeList[i].id].expanded = value;
          }
        }
      },
      // 树权限（全选/全不选）
      handleCheckedTreeNodeAll(value, type) {
        if (type == 'menu') {
          this.$refs.menu.setCheckedNodes(value ? this.menuOptions : []);
        } else if (type == 'dept') {
          this.$refs.dept.setCheckedNodes(value ? this.deptOptions : []);
        } else if (type == 'appletMenu') {
          this.$refs.appletMenu.setCheckedNodes(value ? this.appletMenuOptions : []);
        }
      },
      // 树权限（父子联动）
      handleCheckedTreeConnect(value, type) {
        if (type == 'menu') {
          this.form.menuCheckStrictly = value ? true : false;
        } else if (type == 'dept') {
          this.form.deptCheckStrictly = value ? true : false;
        } else if (type == 'appletMenu') {
          this.appletMenuCheckStrictly = value ? true : false;
        }
      },

      logoModeChange() {
        this.form.logo = '';
      },
      beforeUpload(file) {
        const _this = this;
        const logoMode = this.form.logoMode;
        return new Promise((resolve, reject) => {
          const blobUrl = URL.createObjectURL(file);
          const image = new Image();
          image.onload = function () {
            const width = image.width,
              height = image.height;
            const scale = width / height;
            console.log(scale);
            if (logoMode == 'image') {
              if (scale >= 2 && scale <= 4) {
                resolve();
              } else {
                _this.$notify.error('请选择宽高比在2:1至4:1之间的图片！');
                reject();
              }
            } else {
              if (scale == 1) {
                resolve();
              } else {
                _this.$notify.error('请选择宽高比为1:1的图片！');
                reject();
              }
            }
          };
          image.src = blobUrl;
        });
      },
      uploadLogo(options) {
        const { file } = options;
        promiseFileMd5(file)
          .then((md5) => {
            const params = { name: file.name, md5: md5 };
            return streamUpload(file, params);
          })
          .then((res) => {
            this.logoSuccess(res.data);
          })
          .catch(console.log);
      },
      logoSuccess(res) {
        const { url } = res;
        if (!url) {
          return this.$notify.error('上传失败!');
        }
        this.form.logo = url;
      },
      loadingChange(val) {
        console.log(val);
      },
    },
    created() {
      this.form = this.value;
    },
    watch: {
      form: {
        handler(val) {
          this.$emit('input', val);
        },
        deep: true,
      },
      value: {
        handler(val) {
          this.form = val;
        },
        deep: true,
      },
    },
  };
</script>

<style lang="scss" scoped>
  .otherClass {
    ::v-deep .el-form-item__label {
      height: 40px !important;
      line-height: 40px !important;
    }
  }
</style>
