<template>
  <BaseDrawer
    :visible.sync="visible"
    title="版权校正"
    @submit="onSubmit"
    @close="onClose"
    size="50%"
  >
    <el-card v-loading="loading" shadow="never">
      <el-form ref="formRef" :model="model" :rules="rules" label-width="120px">
        <el-form-item label="剧集名称">
          <el-input v-model.trim="showName" placeholder="请输入剧集名称" disabled></el-input>
        </el-form-item>
        <el-form-item label="内容类型" prop="content_type">
          <el-select v-model="model.content_type" placeholder="请选择版权内容类型">
            <el-option
              v-for="item in copyright_content_opts"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="版权来源" prop="origin">
          <el-radio-group v-model="model.origin" @change="handleOriginChange">
            <el-radio v-for="item in copyright_origin_opts" :key="item.value" :label="item.value">{{
              item.label
            }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="is_origin_two" label="授权方" prop="origin_type">
          <el-radio-group v-model="model.origin_type" @change="handleOriginTypeChange">
            <el-radio
              v-for="item in authorizer_opts_no_author"
              :key="item.value"
              :label="item.value"
              >{{ item.label }}</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="is_origin_two && model.origin_type != 'other'"
          label="版权系统编码"
          prop="uid"
        >
          <el-input
            v-model.trim="model.uid"
            placeholder="请输入该版权的系统编码"
            @input="handleSystemIdChange"
          ></el-input>
        </el-form-item>

        <el-form-item label="版权名称">
          <el-select
            v-if="is_origin_two_and_other"
            v-model="model.copyright_id"
            placeholder="请选择版权名称"
            filterable
            remote
            :remote-method="remoteCopyright"
            @change="changeCopyrightId"
          >
            <el-option
              v-for="item in copyright_name_opts"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-else
            v-model.trim="model.name"
            :disabled="is_disable_name_and_author"
            placeholder="请输入版权名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="作者笔名" :prop="is_origin_two ? '' : 'author'">
          <el-input
            v-model.trim="model.author"
            :disabled="is_disable_name_and_author || is_origin_two_and_other"
            placeholder="请输入作者笔名"
          ></el-input>
        </el-form-item>
        <el-form-item label="版权来源证明" :prop="is_origin_two_and_other ? '' : 'file'">
          <UploadFile
            ref="UploadFileRef"
            :file_list.sync="model.file"
            align="left"
            accept=".pdf,.jpg,.jpeg,.png"
            :disabled="is_origin_two_and_other"
            :show_upload="is_origin_two_and_other ? false : true"
          >
            <template #tip>
              {{ `${model.file.length ? '支持：jpg、png、jpeg、pdf格式' : '暂无文件'}` }}</template
            >
          </UploadFile>
        </el-form-item>
        <el-form-item label="版权终止日期" :prop="is_origin_two_and_other ? '' : 'end_date'">
          <el-date-picker
            type="date"
            format="yyyy 年 MM 月 dd 日"
            value-format="yyyy-MM-dd"
            v-model="model.end_date"
            :picker-options="pickerOptions"
            :disabled="end_date_disabled"
            placeholder="请选择授权终止日期"
          >
          </el-date-picker>
        </el-form-item>
      </el-form>
    </el-card>

    <BaseDialog :visible.sync="dialogVisible" :showClose="false" width="400px">
      <template #title>
        <div class="dialog-title">
          <span class="title">温馨提示</span>
          <el-button type="text" @click="beforeSubmit('default')">关闭弹窗</el-button>
        </div>
      </template>
      <p>{{
        `1、如果您对《${
          showName || '--'
        }》校正的版权信息确认无误，请您点击“继续提交”按钮，提交后系统将校正信息推送给承制方确认；`
      }}</p>
      <p style="margin-top: 10px"
        >2、如果您对该剧集待校正的版权校正信息不完全确定，也可以点击“保存”按钮，如需再次编辑或者提交操作，请前往版权校正记录查看；</p
      >

      <template slot="footer">
        <el-button @click="beforeSubmit('save')">保 存</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="beforeSubmit('continue')"
          >继续提交</el-button
        >
      </template>
    </BaseDialog>
  </BaseDrawer>
</template>

<script>
  import { add as editReq } from '@/api/copyrightCenter/management/index.js'
  import { def as authorizeDef } from '@/api/creatorPlatform/authorize/copyrightManagement/index.js';
  import { def as manageDef } from '@/api/copyrightCenter/management/index.js';
  import { getCopyright, authorizeFileList } from '@/api/public.js';
  import { contentTypeList } from '@/api/copyrightCenter/management/index.js';
  import { mapperToOptions, objectToMapper, removeObjectEmpty } from '@/utils/tools';
  import { AUTHORIZER_TYPE_MAPPER, COPYRIGHT_ORIGIN_MAPPER } from '@/utils/mappers/copyright';
  import UploadFile from '@/components/Upload/v3UploadFile/uploadFile.vue';
  import BaseDrawer from '@/components/BaseDrawer/index.vue';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  export default {
    name: 'authValidateDrawer',
    components: {
      BaseDrawer,
      UploadFile,
      BaseDialog,
    },
    data() {
      return {
        loading: false,
        dialogLoading: false,
        visible: false,
        dialogVisible: false,
        currentRow: {},
        showName: '',
        collection_id: null,
        model: {
          copyright_id: null,
          content_type: null,
          origin: 2,
          origin_type: 'txg',
          uid: null,
          name: null,
          author: null,
          file: [],
          end_date: null,
        },
        rules: {
          content_type: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
          origin: [{ required: true, message: '请选择版权来源', trigger: 'change' }],
          origin_type: [{ required: true, message: '请选择授权人', trigger: 'change' }],
          name: [{ required: true, message: '请输入版权名称', trigger: 'blur' }],
          copyright_id: [{ required: true, message: '请输入版权ID', trigger: 'blur' }],
          author: [{ required: true, message: '请输入作者笔名', trigger: 'change' }],
          uid: [{ required: true, message: '请输入版权系统编码', trigger: 'blur' }],
          file: [{ required: true, message: '请选择版权来源证明', trigger: ['blur', 'change'] }],
          end_date: [{ required: true, message: '请选择授权终止日期', trigger: 'change' }],
        },

        copyright_name_opts: [],
        copyright_content_opts: [],
        copyright_content_mapper: {},
        copyright_origin_opts: mapperToOptions(COPYRIGHT_ORIGIN_MAPPER),
        authorizer_opts_no_author: mapperToOptions({
          txg: '重庆推小果传媒科技有限公司',
          other: '其他转授权方',
        }),
        COPYRIGHT_ORIGIN_MAPPER,
        AUTHORIZER_TYPE_MAPPER,
      };
    },
    computed: {
      createUser() {
        return this.$store.getters.userInfo.userName;
      },

      is_origin_one() {
        return this.model.origin == 1;
      },

      is_origin_two() {
        return this.model.origin == 2;
      },

      // 被授权-其他转授权方
      is_origin_two_and_other() {
        return this.model.origin == 2 && this.model.origin_type == 'other';
      },

      // 版权名称 && 作者笔名 仅剧集创建版权时 && '被授权' && '推小果'
      is_disable_name_and_author() {
        if (this.is_origin_two && this.model.origin_type == 'txg') {
          return true;
        } else {
          return false;
        }
      },

      pickerOptions() {
        return {
          disabledDate: (time) => {
            return time.getTime() < new Date(this.currentRow.copyright_end_date).getTime();
          },
        };
      },

      // 版权终止日期disabled判断
      end_date_disabled() {
        return this.currentRow.verify_status > 2 || this.is_other_origin;
      },

      is_other_origin() {
        return this.model.origin_type == 'other';
      },
    },
    methods: {
      open(row) {
        this.visible = true;
        this.currentRow = row;
        this.collection_id = row.id;
        this.queryContentType();
        this.queryDef();
        this.showName = row.showName;
      },

      queryDef() {
        this.loading = true;
        let func = this.$route.name == 'accountDrama' ? authorizeDef : manageDef;
        func({ id: this.currentRow.copyright_id })
          .then((res) => {
            if (res.code == 0) {
              this.currentRow = res.data;
              Object.keys(this.model).forEach((el) => {
                this.model[el] = res.data[el];
              });
            }
          })
          .catch((error) => {
            this.$notify.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
      },

      queryContentType() {
        contentTypeList()
          .then((res) => {
            if (res && res.code === 0) {
              this.copyright_content_opts = res.data.map((it) => {
                return { label: it?.label || it?.name, value: it?.value || it?.id };
              });
              this.copyright_content_mapper = objectToMapper(this.copyright_content_opts);
            } else {
              throw res;
            }
          })
          .catch((err) => {
            this.$notify.error(err?.message || err || '获取版权内容类型数据失败');
          });
      },

      handleOriginChange(val) {
        let unResetField = ['content_type', 'name', 'author', 'uid', 'file'];
        let originForm = this.$options.data().model;
        Object.keys(this.model).forEach((key) => {
          if (unResetField.includes(key) && key !== 'id') {
            this.model[key] = originForm[key];
          }
        });
        if (val == 1) {
          this.model.author = this.createUser;
        }
        this.$refs.UploadFileRef?.clearData();
        this.model.origin = val;
      },

      handleSystemIdChange: _.debounce(function name(val) {
        this.model['name'] = null;
        this.model['author'] = null;
        if (val) {
          this.queryCopyrightOnlyForSystemId();
        }
        this.$nextTick(() => {
          this.$refs.formRef?.clearValidate();
        });
      }, 300),

      queryCopyrightOnlyForSystemId(params = { authorize_type: 1, uid: this.model.uid }) {
        this.queryCopyright(params);
      },

      remoteCopyright(keyword) {
        this.queryCopyright({ authorize_type: 3, keyword });
      },

      queryCopyright(params = {}) {
        getCopyright(params).then((res) => {
          if (res.code == 0) {
            if (res.data.length > 0) {
              this.copyright_name_opts = res.data.map((el) => {
                return {
                  end_date: el.end_date,
                  author: el.author,
                  file: JSON.parse(el.file) || [],
                  label: el.label,
                  value: el.value,
                };
              });
              let item = res.data[0];
              this.model['name'] = item['label'];
              this.model['author'] = item['author'];
              this.$set(this.model, 'account_id', item['account_id']);
              this.$set(this.currentRow, 'copyright_end_date', item['end_date']);
            }
          }
        });
      },

      handleOriginTypeChange(val) {
        this.model.name = null;
        this.model.copyright_id = null;
        this.model.file = [];
        if (val != 'txg') {
          this.model.uid = null;
          this.model.author = null;
          delete this.model.account_id;
        }
        if (val == 'other' && this.model.origin == 2) {
          this.remoteCopyright();
        }
      },

      onSubmit() {
        this.$refs.formRef.validate((valid) => {
          if (valid) {
            this.dialogVisible = true;
          }
        });
      },

      onClose() {
        this.visible = false;
        this.model = this.$options.data().model;
        this.currentRow = {};
        this.showName = null;
      },

      beforeSubmit(type = '') {
        let params = {
          ...this.model,
          authorize_type: 2,
        };
        switch (type) {
          case 'default':
            this.dialogVisible = false;
            break;
          case 'continue':
            params.verify_status = 2;
            this.submitDialog(params, '提交');
            break;
          case 'save':
            params.verify_status = 1;
            this.submitDialog(params, '保存');
            break;
        }
      },

      submitDialog(data, str = '') {
        let params = data;
        params.collection_id = this.collection_id;
        if (this.is_origin_two_and_other) {
          delete params.label;
          delete params.name;
          delete params.value;
        }
        editReq({ ...removeObjectEmpty(params) })
          .then((res) => {
            if (res.code == 0) {
              this.$notify.success(`${str}成功`);
            }
          })
          .catch((error) => {
            console.error(error);
            this.$notify.error(error || `${str}失败`);
          })
          .finally(() => {
            this.currentRow = {};
            this.dialogVisible = false;
            this.visible = false;
            this.$emit('refresh');
          });
      },

      changeCopyrightId(id) {
        const target = this.copyright_name_opts.find((item) => item.value === id);
        Object.assign(this.model, target);
      },
    },
  };
</script>

<style lang="scss" scoped>
  .dialog-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-weight: bold;
    }
  }
  ::v-deep .el-form-item__content {
    .el-input,
    .el-textarea {
      width: 360px;
    }
  }
</style>
