<template>
  <component
    :is="dialog_type"
    :title="title + '合作主体'"
    :visible.sync="visible"
    :width="dialog_width"
    :size="dialog_width"
    :append-to-body="true"
    @close="close"
    class="add-wrapper"
  >
    <el-form
      ref="form"
      v-loading="formLoading"
      label-width="120px"
      :rules="rules"
      :model="form"
      :class="[is_drawer ? 'common-margin common-form-style' : '']"
    >
      <el-form-item label="我司合作主体" prop="name">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer common-margin">
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submit">确 定</el-button>
    </div>
  </component>
</template>

<script>
  // 组件
  import BaseDialog from '@/components/BaseDialog/index.vue';

  // 配置
  import { addCollaborative as add } from '@/api/agencyBusiness/public.js';

  export default {
    components: { BaseDialog },
    props: {
      dialog_type: { type: String, default: 'BaseDialog' },
      dialog_width: { type: String, default: '600px' },
    },
    computed: {
      is_drawer() {
        return this.dialog_type == 'BaseDrawer' ? true : false;
      },

      is_edit() {
        return this.title.includes('修改') ? true : false;
      },
    },

    data() {
      return {
        BaseDialog,

        title: '新增',
        visible: false,
        formLoading: false,
        submitLoading: false,

        form: {
          name: '',
        },
        rules: {
          name: [{ required: true, message: '请输入我司合作主体', trigger: 'blur' }],
        },
      };
    },
    methods: {
      open() {
        this.visible = true;
        this.formLoading = true;
        this.$nextTick(() => {
          this.$refs['form']?.clearValidate();
        });
        this.formLoading = false;
      },

      close() {
        this.visible = false;
        this.form = this.$options.data().form;
      },

      submit() {
        this.$refs.form.validate((valid) => {
          if (valid) {
            this.submitLoading = true;
            let params = { ...this.form };
            add(params)
              .then((res) => {
                if (res && res.code == 0) {
                  this.submitLoading = false;
                  this.$notify.success('保存成功！');
                  this.$emit('success');
                  this.close();
                } else {
                  throw res;
                }
              })
              .catch((err) => {
                this.submitLoading = false;
                this.$notify.error(err.message || err || '保存失败！');
              });
          } else {
            return false;
          }
        });
      },
    },
  };
</script>

<style lang="scss" scoped>
  .add-wrapper {
    .common-margin {
      margin: 10px;
    }
    .common-form-style {
      background: #fff;
      padding: 15px 20px 15px 15px;
      border: 1px solid #e6ebf5;
      border-radius: 6px;
    }

    ::v-deep .el-form-item__content {
      .el-input {
        width: 360px;
      }
    }
  }
</style>
