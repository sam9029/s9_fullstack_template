<template>
  <component
    :is="dialog_type"
    :title="title"
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
      label-width="100px"
      :rules="rules"
      :model="form"
      :class="[is_drawer ? 'common-margin common-form-style' : '']"
    >
      <el-form-item label="项目产品" prop="project_name">
        <el-input v-model="form.project_name"></el-input>
      </el-form-item>

      <el-form-item label="业务类型" prop="business_type" class="has-add-contian">
        <el-select v-model.number="form.business_type">
          <el-option
            v-for="item in business_type_opts"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
        <el-button class="ml5" type="primary">新增</el-button>
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
import BaseDrawer from '@/components/BaseDrawer/index.vue';

// 配置

// API
// import { add, def } from '@/api/';

export default {
  components: {
    BaseDialog,
    BaseDrawer,
  },

  props: {
    dialog_type: {
      type: String,
      // default: 'BaseDialog', // 'BaseDialog' || 'BaseDrawer'
      default: 'BaseDrawer', // 'BaseDialog' || 'BaseDrawer'
    },
    dialog_width: {
      type: String,
      default: '900px', // '900px'
    },
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
      BaseDrawer,

      title: '新增',
      visible: false,
      formLoading: false,
      submitLoading: false,

      business_type_opts: [{ label: '测试', value: 'test' }],
      promotion_method_opts: [{ label: '测试', value: 'test' }],

      form: {
        // 项目产品
        project_name: '',
        // 业务类型
        business_type: '',
      },
      rules: {
        project_name: [{ required: true, message: '请输入项目产品', trigger: 'blur' }],
        business_type: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
      },
    };
  },
  methods: {
    open(row) {
      this.visible = true;
      this.formLoading = true;
      if (row && row.id) {
        this.title = '修改';
        this.$set(this.form, 'id', row.id); // 修改则有ID，新增则无
        this.queryDef(row.id);
      }
      this.$nextTick(() => {
        this.$refs['form']?.clearValidate();
      });
      this.formLoading = false;
    },

    close() {
      this.visible = false;
      this.form = this.$options.data().form;
      this.title = '新增';
    },

    submit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.submitLoading = true;
          let params = { ...this.form };
          if (!add) throw new Error('未配置API-新增数据函数');
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

    async queryDef(id) {
      try {
        this.formLoading = true;
        if (!def) throw new Error('未配置API-查询详情数据函数');
        let res = await def({ id });
        if (res.code == 0) {
          Object.keys(this.form).forEach((key) => {
            this.form[key] = res.data[key];
          });
        }
        this.formLoading = false;
      } catch (err) {
        this.$notify.error(err || '获取数据详情失败!');
      }
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
