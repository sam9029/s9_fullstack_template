<template>
  <BaseDialog width="600px" :title="title" :visible.sync="visible">
    <el-form class="left-align-form" ref="formRef" :rules="rules" :model="form" label-width="120px">
      <el-form-item label="项目封面" prop="icon">
        <Avatar :disabled="sign == 3" v-model="form.icon"></Avatar>
      </el-form-item>
      <el-form-item label="项目产品：" prop="name">
        <el-input
          class="form-input-width"
          v-model="form.name"
          placeholder="请输入项目产品"
          :disabled="sign == 3"
        ></el-input>
      </el-form-item>
      <el-form-item label="公司全称：" prop="company">
        <el-input
          class="form-input-width"
          v-model="form.company"
          placeholder="请输入公司全称"
          :disabled="sign == 3"
        ></el-input>
      </el-form-item>

      <el-form-item label="商务：" prop="koc_account_id">
        <UserSelect
          class="form-input-width"
          v-model="form.koc_account_id"
          :params="params"
        ></UserSelect>
      </el-form-item>

      <template v-if="sign != 3">
        <el-form-item label="行业：">
          <el-cascader
            class="form-input-width"
            v-model="form.industry_id"
            :options="industryOptions"
            :props="cascaderProps"
          ></el-cascader>
        </el-form-item>

        <el-form-item label="推广类目：" prop="promoted_content" v-if="sign == 1">
          <AddTag class="form-input-width" v-model="form.promoted_content" name="类目"></AddTag>
        </el-form-item>
      </template>

      <el-form-item label="起始日期：" prop="start_date">
        <el-date-picker
          class="form-input-width"
          v-model="form.start_date"
          type="date"
          placeholder="请选择"
          value-format="yyyy-MM-dd"
          :disabled="sign == 2"
        ></el-date-picker>
      </el-form-item>
    </el-form>

    <template slot="footer">
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="submit"> 确 定 </el-button>
    </template>
  </BaseDialog>
</template>

<script>
  import {
    advertiserAdd,
    advertiserSave,
    getDetails,
  } from '@/api/account/advertiser/advertiser.js';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import UserSelect from '@/components/Common/SearchPanel/Components/UserSelect';
  import Avatar from '@/components/Avatar/index.vue';
  import { SIGN_TYPE } from './data';

  export default {
    components: {
      BaseDialog,
      UserSelect,
      Avatar,
      AddTag: () => import('./AddTag.vue'),
    },
    props: {
      industryOptions: Array,
    },
    data() {
      return {
        cascaderProps: { value: 'category_id', label: 'name', emitPath: false },
        visible: false,
        id: null,
        sign: SIGN_TYPE.NEW_AD, // 1-新增项目产品 2-编辑项目产品 3-新增商务
        form: {
          name: '',
          company: '',
          koc_account_id: null,
          start_date: null,
          icon: '',
          industry_id: null,
          promoted_content: [],
        },
        loading: false,
        rules: {
          name: [{ required: true, message: '请输入项目产品', trigger: 'blur' }],
          company: [{ required: true, message: '请输入客户全称', trigger: 'blur' }],
          koc_account_id: [{ required: true, message: '请选择商务', trigger: 'change' }],
          start_date: [{ required: true, message: '请选择起始日期', trigger: 'change' }],
          icon: [{ required: true, message: '请设置项目封面', trigger: 'change' }],
        },
        params: { koc_role: 3 },
      };
    },
    computed: {
      title() {
        switch (this.sign) {
          case SIGN_TYPE.NEW_AD:
            return '新增项目产品';
          case SIGN_TYPE.EDIT_AD:
            return '编辑项目产品';
          case SIGN_TYPE.NEW_SALER:
            return '新增商务';
          default:
            return '';
        }
      },
    },
    methods: {
      open(sign, row) {
        if (row) {
          getDetails({ id: row.id, interface_id: 2131 }).then((res) => {
            if (res.code == 0) {
              const keys = [
                'name',
                'company',
                'icon',
                'industry_id',
                'koc_account_id',
                'start_date',
              ];
              keys.forEach((k) => {
                this.form[k] = res.data[k];
              });
            }
          });
          this.id = row.id;
        } else {
          this.resetForm();
        }
        this.sign = sign;
        this.visible = true;
      },
      close() {
        this.resetForm();
        this.id = null;
        this.sign = SIGN_TYPE.NEW_AD;
        this.visible = false;
        this.$refs.formRef.clearValidate();
      },
      resetForm() {
        this.form = {
          name: '',
          company: '',
          koc_account_id: null,
          start_date: null,
          icon: '',
          industry_id: null,
          promoted_content: [],
        };
      },
      submit() {
        this.$refs.formRef.validate((valid) => {
          if (valid) {
            const params = { ...this.form };
            if (this.sign == SIGN_TYPE.EDIT_AD) {
              delete params.koc_account_id;
              delete params.start_date;
            }
            let func = advertiserAdd;
            if (this.id) {
              // 编辑项目和增商务都用save接口
              params.id = this.id;
              func = advertiserSave;
            }
            if (this.sign != 1) delete params.promoted_content;
            this.loading = true;
            func(params)
              .then((data) => {
                this.loading = false;
                this.$notify.success('保存成功！');
                this.$emit('refresh', this.sign, this.id);
                this.close();
              })
              .catch((err) => {
                this.loading = false;
                this.$notify.error(err.message || err);
              });
          }
        });
      },
    },
  };
</script>

<style lang="scss" scoped>
  .form-input-width {
    width: 400px;
  }
</style>
