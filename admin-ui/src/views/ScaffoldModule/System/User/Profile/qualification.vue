<template>
  <div v-if="user.realname_status == 'W' && !user.id_card_front_photo || isEdit">
    <el-form ref="form" :model="form" :rules="rules" label-width="140px" :disabled="isQualified">
      <el-form-item label="企业名称" prop="name">
        <!-- <el-input
          v-model="form.name"
          placeholder="请输入企业名称"
        /> -->
        <span>{{ name }}</span>
      </el-form-item>
      <el-form-item label="企业管理员" prop="business_manager">
        <el-input v-model.trim="form.business_manager" placeholder="请输入企业管理员" />
      </el-form-item>
      <el-form-item label="社会统一信用代码" prop="business_code">
        <el-input v-model.trim="form.business_code" placeholder="请输入社会统一信用代码" />
      </el-form-item>
      <el-form-item label="法人姓名" prop="corporation_name">
        <el-input v-model.trim="form.corporation_name" placeholder="请输入法人姓名" />
      </el-form-item>
      <el-form-item label="法人身份证号" prop="corporation_id_card_num">
        <el-input v-model.trim="form.corporation_id_card_num" placeholder="请输入法人身份证号" />
      </el-form-item>
      <el-form-item label="营业执照有效期" prop="business_license_date">
        <el-date-picker
          v-model="form.business_license_date"
          type="date"
          :picker-options="pickerOptions"
          value-format="yyyy-MM-dd"
          placeholder="请选择营业执照有效期"
        >
        </el-date-picker>
      </el-form-item>
      <!-- <el-form-item label="营业执照编号" prop="business_license_num">
        <el-input
          v-model="form.business_license_num"
          placeholder="请输入营业执照编号"
        />
      </el-form-item> -->
      <div>
        <el-form-item label="营业执照" prop="business_license_photo">
          <UploadFile
            ref="UploadLicense"
            :file_list.sync="form.business_license_photo"
            align="left"
            accept=".pdf,.jpg,.jpeg,.png"
            :limit="1"
            :show_file_infos="false"
          >
            <template #tip> 支持：jpg、png、jpeg、pdf格式</template>
          </UploadFile>
        </el-form-item>
      </div>
      <div class="id_card_box">
        <div style="flex: 1;">
          <el-form-item label="法人身份证正面" prop="id_card_front_photo">
            <UploadFile
              ref="UploadLicense"
              :file_list.sync="form.id_card_front_photo"
              align="left"
              accept=".pdf,.jpg,.jpeg,.png"
              :limit="1"
              :show_file_infos="false"
            >
            <template #tip>
                 <span>支持：jpg、png、jpeg格式</span>
                 <div><i class="el-icon-warning color-warning"></i>请上传法人手持身份证正面的彩色图片！</div>
              </template>
            </UploadFile>
          </el-form-item>
        </div>
        <div style="flex: 1;">
          <el-form-item label="法人身份证反面" prop="id_card_back_photo">
            <UploadFile
              ref="UploadLicense"
              :file_list.sync="form.id_card_back_photo"
              align="left"
              accept=".pdf,.jpg,.jpeg,.png"
              :limit="1"
              :show_file_infos="false"
            >
              <template #tip>
                 <span>支持：jpg、png、jpeg格式</span>
                 <div><i class="el-icon-warning color-warning"></i>请上传法人手持身份证反面的彩色图片！</div>
              </template>
            </UploadFile>
          </el-form-item>
        </div>
      </div>
      <el-form-item>
        <el-button type="primary" size="small" @click="submit">保存</el-button>
        <el-button type="danger" size="small" @click="close">关闭</el-button>
      </el-form-item>
    </el-form>
  </div>
  <div v-else>
    <el-descriptions 
      class="business_descriptions" 
      :column="3" 
      size="medium" 
      direction="vertical" 
      border
      :contentStyle="{'width':'30%'}"
    >
      <el-descriptions-item label="当前审核状态">
        <BaseStatus
          v-bind="$attrs"
          :status="user.realname_status"
          :mapper="CREATOR_VERIFY_STATUS_BY_REAL_STATUS_MAPPER"
          :icon-class="realStatusClass"
          placeholder="--"
          :reason="user.realname_status == 'F' ? user.verify_suggest : ''"
        ></BaseStatus>
      </el-descriptions-item>
      <el-descriptions-item label="企业名称">{{ user.userName }}</el-descriptions-item>
      <el-descriptions-item label="社会统一信用代码">{{ user.business_code }}</el-descriptions-item>
      <el-descriptions-item label="营业执照有效期">{{ user.business_license_date }}</el-descriptions-item>
      <el-descriptions-item label="法人姓名">{{ user.corporation_name }}</el-descriptions-item>
      <el-descriptions-item label="法人身份证号">{{ user.corporation_id_card_num }}</el-descriptions-item>
      <el-descriptions-item label="营业执照">
        <div class="image__preview">
          <FilePreview :file_data="fileData(user.business_license_photo)" />
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="法人身份证正反面">
        <div class="image__preview">
          <div>
            <FilePreview :file_data="fileData(user.id_card_front_photo)" />
          </div>
          <div class="ml10">
            <FilePreview :file_data="fileData(user.id_card_back_photo)" />
          </div>
        </div>
      </el-descriptions-item>
    </el-descriptions>
    <div class="mt10 mb10">
      <el-button type="primary" size="small" @click="isEdit = true">编辑</el-button>
      <el-button type="danger" size="small" @click="close">关闭</el-button>
    </div>
  </div>
</template>

<script>
import { qualificationUpload } from '@/api/account/personnel/user.js';
import UploadFile from '@/components/Upload/v3UploadFile/uploadFile.vue';
import { getInfo } from '@/api/login';
import FilePreview from '@/components/Upload/v3UploadFile/FilePreview.vue';
import { CREATOR_VERIFY_STATUS_BY_REAL_STATUS_MAPPER } from '@/utils/mapper.js';
import BaseStatus from '@/components/BaseCopy/status';

export default {
  props: {
    user: {
      type: Object,
    },
  },
  components: {
    FilePreview,
    UploadFile,
    BaseStatus,
  },
  data() {
    let validateBusinessCode = (rule, value, callback) => {
      // 匹配新版和老版统一社会信用代码
      const regExp = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
      if (!regExp.test(value)) {
        callback(new Error('统一社会信用代码格式不正确'));
      } else {
        callback();
      }
    };
    let validateIdCard = (rule, value, callback) => {
      const regExp = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      if (!regExp.test(value)) {
        callback(new Error('身份证号码格式错误'));
      } else {
        callback();
      }
    };
    return {
      user: null,
      name: null,
      form: {
        // 企业ID
        account_id: null,
        // 统一社会信用代码
        business_code: null,
        // 企业名称
        // name: null,
        // 营业执照
        business_license_photo: null,
        // 营业执照编号
        // business_license_num: null,
        // 法人姓名
        corporation_name: null,
        // 法人身份证号
        corporation_id_card_num: null,
        // 法人身份证正面
        id_card_front_photo: null,
        // 法人身份证反面
        id_card_back_photo: null,
        // 企业管理员
        business_manager: null,
        // 营业执照有效期
        business_license_date: null,
      },
      // 表单校验
      rules: {
        business_code: [
          { required: true, message: '社会统一信用代码不能为空', trigger: 'blur' },
          { required: true, validator: validateBusinessCode, trigger: 'blur' },
        ],
        // name: [
        //   { required: true, message: '企业名称不能为空', trigger: 'blur' },
        //   { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
        // ],
        business_license_photo: [{ required: true, message: '营业执照不能为空', trigger: 'blur' }],
        id_card_front_photo: [
          { required: true, message: '法人身份证正面不能为空', trigger: 'blur' },
        ],
        id_card_back_photo: [
          { required: true, message: '法人身份证反面不能为空', trigger: 'blur' },
        ],
        // business_license_num: [
        //   { required: true, message: '营业执照编号不能为空', trigger: 'blur' },
        // ],
        business_manager: [{ required: true, message: '企业管理员不能为空', trigger: 'blur' }],
        corporation_name: [{ required: true, message: '法人姓名不能为空', trigger: 'blur' }],
        corporation_id_card_num: [
          { required: true, message: '法人身份证号不能为空', trigger: 'blur' },
          { required: true, validator: validateIdCard, trigger: 'blur' },
        ],
        business_license_date: [
          { required: true, message: '营业执照有效期不能为空', trigger: 'blur' },
        ],
      },
      pickerOptions: {
        // disabledDate(time) {
        //   return time.getTime() < Date.now();
        // },
      },
      isQualified: false,
      isEdit: false,
      CREATOR_VERIFY_STATUS_BY_REAL_STATUS_MAPPER,
    };
  },
  watch: {
    user: {
      handler(val) {
        // console.log(val);
        // this.form = {
        //   business_code: val.business_code,
        //   name: val.name,
        //   business_license_photo: val.business_license_photo,
        // };
      },
      // immediate: true,
    },
  },
  mounted() {
    this.getUser();
  },
  methods: {
    submit() {
      let oss_keys = {};
      if (this.form.id_card_back_photo.length)
        oss_keys.id_card_back_photo = this.form.id_card_back_photo[0]?.oss_key;
      if (this.form.id_card_front_photo.length)
        oss_keys.id_card_front_photo = this.form.id_card_front_photo[0]?.oss_key;
      if (this.form.business_license_photo.length)
        oss_keys.business_license_photo = this.form.business_license_photo[0]?.oss_key;
      this.$refs['form'].validate((valid) => {
        if (valid) {
          let data = {
            ...this.form,
            ...oss_keys,
          };
          qualificationUpload(data)
            .then((data) => {
              if (data.code == 0) {
                // this.isQualified = true;
                this.isEdit = false;
                this.$notify.success('保存成功');
                this.getUser();
              }
            })
            .catch((err) => {
              this.$notify.error(err.message || err || '保存失败');
            });
        }
      });
    },
    close() {
      this.$store.dispatch('tagsView/delView', this.$route);
      this.$router.push({ path: '/' });
    },

    getUser() {
      getInfo()
        .then(({ user }) => {
          this.user = user;
          this.form.account_id = this.user.accountId;
          this.name = this.user.userName;
          this.form.business_code = this.user.business_code;
          let license_photo = this.user.business_license_photo;
          let front_photo = this.user.id_card_front_photo;
          let back_photo = this.user.id_card_back_photo;

          // 获取文件类型
          let license_type = license_photo ? new URL(license_photo).pathname.split('.')[1] : null;
          let back_type = back_photo ? new URL(back_photo).pathname.split('.')[1] : null;
          let front_type = front_photo ? new URL(front_photo).pathname.split('.')[1] : null;

          // 获取oss_key
          let license_key = license_photo
            ? license_photo
                .substring(
                  license_photo.indexOf(
                    '/',
                    license_photo.indexOf('/', license_photo.indexOf('/') + 1) + 1,
                  ),
                )
                .split('?')[0]
            : null;
          let front_key = back_photo
            ? front_photo
                .substring(
                  front_photo.indexOf(
                    '/',
                    front_photo.indexOf('/', front_photo.indexOf('/') + 1) + 1,
                  ),
                )
                .split('?')[0]
            : null;
          let back_key = front_photo
            ? back_photo
                .substring(
                  back_photo.indexOf('/', back_photo.indexOf('/', back_photo.indexOf('/') + 1) + 1),
                )
                .split('?')[0]
            : null;

          this.form.business_license_photo = license_photo
            ? [
                {
                  preview_url: license_photo,
                  progress: 100,
                  file_type: license_type,
                  oss_key: license_key,
                },
              ]
            : null;
          this.form.business_license_date = this.user.business_license_date;
          this.form.id_card_back_photo = back_photo
            ? [{ preview_url: back_photo, progress: 100, file_type: back_type, oss_key: front_key }]
            : null;
          this.form.id_card_front_photo = front_photo
            ? [
                {
                  preview_url: front_photo,
                  progress: 100,
                  file_type: front_type,
                  oss_key: back_key,
                },
              ]
            : null;
          this.form.business_manager = this.user.business_manager;
          this.form.corporation_name = this.user.corporation_name;
          this.form.corporation_id_card_num = this.user.corporation_id_card_num;
          this.isQualified = this.user.realname_status == 'T';
        })
        .catch((error) => {
          console.log(error);
          // reject(error);
        });
    },
    // 编辑预览资源信息
    fileData(url) {
      let type =url ? new URL(url).pathname.split('.')[1] : null;
      let data = {
        preview_url: url, 
        file_type: type,
      }
      return data
    },
    realStatusClass(status) {
      switch (status) {
        case 'T':
          return 'text-success';
        case 'F':
          return 'text-danger';
        case 'W':
          return 'text-warning';
      }
    },
  },
};
</script>

<style scoped lang="scss">
.id_card_box {
  display: flex;
  flex-wrap: wrap;
}
// 企业资质查看详情样式
.business_descriptions {
  width: 100%;
}

.image__preview {
  display: flex;
  justify-content: center;
  // flex-shrink: 0;
}

::v-deep {
  .el-date-editor {
    width: 100%;
  }
}
</style>
  