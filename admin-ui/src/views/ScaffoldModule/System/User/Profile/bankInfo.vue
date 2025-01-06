<template>
  <div class="bank-view">
    <div v-loading="tabLoading" class="bank-sort-view">
      <div style="width: 100%">
        <el-button type="primary" size="mini" @click="addBank">新增</el-button>
        <el-button size="mini" @click="getSortValue">保存</el-button>
        <el-button size="mini" @click="getBankData">刷新</el-button>
      </div>
      <span class="bank-tip">提示：可拖动卡片设置银行卡优先级，完成后点击「保存」按钮进行保存</span>
      <BankSort class="sort-view" v-model="bankData">
        <template slot-scope="{ element, index }">
          <BankContent
            @changeStatus="changeStatus"
            @edit="editData"
            :index="index"
            :data="element"
          ></BankContent>
        </template>
      </BankSort>
    </div>
    <BaseDrawer :title="title" @submit="submit" :visible.sync="showDrawer">
      <el-card shadow="always" :body-style="{ padding: '20px' }">
        <el-form
          class="add-view"
          ref="form"
          :model="addBankInfo"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="身份证" prop="id_card">
            <el-input v-model="addBankInfo.id_card" placeholder="请输入身份证" />
          </el-form-item>
          <el-form-item label="开户行" prop="bank_name">
            <el-input v-model="addBankInfo.bank_name" placeholder="请输入开户行" />
          </el-form-item>
          <el-form-item label="收款人" prop="people_name">
            <el-input v-model="addBankInfo.people_name" placeholder="请输入真实收款人姓名" />
          </el-form-item>
          <el-form-item label="联系方式" prop="telephone">
            <el-input v-model="addBankInfo.telephone" placeholder="请输入联系方式" />
          </el-form-item>
          <el-form-item label="银行账号" prop="bank_account">
            <el-input v-model="addBankInfo.bank_account" placeholder="请输入银行账号" />
          </el-form-item>

          <el-form-item label="开户人标签" prop="owner_type">
            <el-radio-group v-model="addBankInfo.owner_type">
              <el-radio :label="item.value" v-for="item in OWNER_TYPE" :key="item.value"
                >{{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="认证平台" prop="certificate_platform">
            <el-checkbox-group v-model="addBankInfo.certificate_platform">
              <el-checkbox
                :label="item.value"
                v-for="item in CERTIFICATE_PLATFORM"
                :key="item.value"
                name="type"
                >{{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </el-card>
    </BaseDrawer>
  </div>
</template>

<script>
  // import { updateUserPwd } from '@/api/account/personnel/user.js';
  import { getBankInfo, setBankSort, addBankInfo, editBankInfo } from '@/api/public/bank.js';
  import { encrypt, decrypt } from '@/utils/auth.js';
  import { validatePhone } from '@/utils/tools.js';

  let notify = null;

  export default {
    components: {
      BaseDrawer: () => import('@/components/BaseDrawer/index'),
      BankSort: () => import('@/components/BankSort/index'),
      BankContent: () => import('@/components/BankSort/content'),
    },
    props: {
      user: {
        type: Object,
        default: () => {},
      },
    },
    data() {
      return {
        OWNER_TYPE: [
          { label: '本人卡', value: 1 },
          { label: '代收款人卡', value: 2 },
        ],
        CERTIFICATE_PLATFORM: [
          { label: '京灵平台', value: 1 },
          { label: '云账户', value: 2 },
        ],
        title: '添加银行账号',
        // 表单校验
        rules: {
          bank_account: [{ required: true, message: '银行账号不能为空', trigger: 'blur' }],
          id_card: [{ required: true, message: '身份证不能为空', trigger: 'blur' }],
          bank_name: [{ required: true, message: '开户行不能为空', trigger: 'blur' }],
          people_name: [{ required: true, message: '收款人不能为空', trigger: 'blur' }],
          telephone: [
            { required: true, message: '联系方式不能为空', trigger: 'blur' },
            { validator: validatePhone, trigger: 'blur' },
          ],
          owner_type: [{ required: true, message: '请选择开户人标签', trigger: 'change' }],
          certificate_platform: [
            {
              type: 'array',
              required: true,
              message: '请至少选择一个认证平台',
              trigger: 'change',
            },
          ],
        },
        addBankInfo: {
          id: undefined,
          account_id: this.user.accountId,
          bank_account: undefined,
          id_card: undefined,
          bank_name: undefined,
          people_name: undefined,
          telephone: undefined,
          certificate_platform: [],
          owner_type: 1,
        },
        bankData: [],
        showDrawer: false,
        tabLoading: false,
      };
    },
    created() {
      this.getBankData();
    },
    methods: {
      changeStatus(item, status) {
        editBankInfo(encrypt({ id: item.id, status }))
          .then((res) => {
            if (res.code == 0) {
              this.notifyError('操作成功！', '', true);
              this.showDrawer = false;
              this.getBankData();
            } else return Promise.reject(res.message);
          })
          .catch((err) => {
            this.notifyError(err);
          });
      },
      editData(val) {
        this.reset();
        let {
          id,
          account_id,
          bank_account,
          id_card,
          bank_name,
          people_name,
          telephone,
          certificate_platform,
          owner_type,
        } = val || {};

        this.addBankInfo = {
          id,
          account_id,
          bank_account,
          id_card,
          bank_name,
          people_name,
          telephone,
          certificate_platform,
          owner_type,
        };
        this.title = '修改银行账号';
        this.showDrawer = true;
      },
      reset() {
        this.addBankInfo = {
          id: undefined,
          account_id: this.user.accountId,
          bank_account: undefined,
          id_card: undefined,
          bank_name: undefined,
          people_name: undefined,
          telephone: undefined,
          certificate_platform: [],
          owner_type: 1,
        };
      },
      getSortValue(val) {
        // console.log(val);
        let ids = this.bankData.map((i) => i.id);
        setBankSort({ sort: ids, account_id: this.user.accountId })
          .then((res) => {
            if (res && res.code == 0) {
              this.notifyError('设置成功！', '', true);
              this.getBankData();
            } else return Promise.reject(res.message);
          })
          .catch((err) => {
            this.notifyError(err, '操作失败');
          });
      },
      getBankData() {
        // console.log(this.user);
        this.tabLoading = true;
        getBankInfo({ limit: 99, account_id: this.user.accountId })
          .then((res) => {
            this.tabLoading = false;
            if (res && res.code == 0) {
              let arr = decrypt(res.data);
              this.bankData = arr.map((item) => {
                item.certificate_platform = JSON.parse(item.certificate_platform) || [];
                return item;
              });
            } else return Promise.reject(res.message);
          })
          .catch((err) => {
            this.tabLoading = false;
            this.notifyError(err);
          });
      },
      addBank() {
        this.reset();
        this.title = '添加银行账号';
        this.showDrawer = true;
      },
      notifyError(err, title = '数据异常', success = false) {
        let message = String(err.message || err || '未知异常！');
        if (notify) notify.close();
        notify = this.$notify({
          type: success ? 'success' : 'error',
          title,
          message,
        });
      },
      submit() {
        this.$refs['form'].validate((valid) => {
          if (valid) {
            let queryFun = addBankInfo;
            if (this.addBankInfo.id) queryFun = editBankInfo;
            queryFun(encrypt(this.addBankInfo))
              .then((res) => {
                if (res.code == 0) {
                  this.notifyError('操作成功！', '', true);
                  this.showDrawer = false;
                  this.getBankData();
                } else return Promise.reject(res.message);
              })
              .catch((err) => {
                this.notifyError(err);
              });
          }
        });
      },
      close() {
        this.$store.dispatch('tagsView/delView', this.$route);
        this.$router.push({ path: '/' });
      },
    },
  };
</script>
<style lang="scss" scoped>
  .bank-view {
    .bank-sort-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      .bank-tip {
        font-size: 12px;
        font-weight: bolder;
        color: #777;
      }
      .sort-view {
        width: 600px;
        height: 280px;
        overflow-y: scroll;
        margin-top: 10px;
      }
    }
    // .add-view {
    // }
  }
</style>
