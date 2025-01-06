<template>
  <BaseDrawer
    :title="sta.title"
    @submit="submit"
    :visible.sync="showDrawer"
    :destroy-on-close="true"
  >
    <el-card shadow="always" :body-style="{ padding: '20px' }" v-if="sta.model == 'add'">
      <el-form
        ref="form"
        :model="addBankInfo"
        :rules="rules"
        :disabled="sta.disabled"
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
        <!-- <el-form-item label="认证平台" prop="certificate_platform">
          <el-checkbox-group v-model="addBankInfo.certificate_platform">
            <el-checkbox
              :label="item.value"
              v-for="item in CERTIFICATE_PLATFORM"
              :key="item.value"
              name="type"
              >{{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item> -->
      </el-form>
    </el-card>

    <div v-else-if="sta.model == 'show'">
      <el-card
        v-loading="tabLoading"
        v-if="tabLoading"
        :body-style="{ minHeight: '256px' }"
      ></el-card>
      <el-card
        v-loading="tabLoading"
        shadow="always"
        :body-style="{ padding: '20px' }"
        v-for="item in bankData"
        :key="item.id"
      >
        <el-form :disabled="sta.disabled" label-width="100px">
          <el-form-item label="身份证" prop="id_card">
            <el-input v-model="item.id_card" placeholder="请输入身份证" />
          </el-form-item>
          <el-form-item label="开户行" prop="bank_name">
            <el-input v-model="item.bank_name" placeholder="请输入开户行" />
          </el-form-item>
          <el-form-item label="收款人" prop="people_name">
            <el-input v-model="item.people_name" placeholder="请输入真实收款人姓名" />
          </el-form-item>
          <el-form-item label="联系方式" prop="telephone">
            <el-input v-model="item.telephone" placeholder="请输入联系方式" />
          </el-form-item>
          <el-form-item label="银行账号" prop="bank_account">
            <el-input v-model="item.bank_account" placeholder="请输入银行账号" />
          </el-form-item>

          <el-form-item label="开户人标签" prop="owner_type">
            <el-radio-group v-model="addBankInfo.owner_type">
              <el-radio :label="item.value" v-for="item in OWNER_TYPE" :key="item.value"
                >{{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <!-- <el-form-item label="认证平台" prop="certificate_platform">
            <el-checkbox-group v-model="addBankInfo.certificate_platform">
              <el-checkbox
                :label="item.value"
                v-for="item in CERTIFICATE_PLATFORM"
                :key="item.value"
                name="type"
                >{{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item> -->
        </el-form>
      </el-card>
    </div>
  </BaseDrawer>
</template>

<script>
  import { addBankInfo, editBankInfo, getBankInfo } from '@/api/public/bank.js';
  import { encrypt, decrypt } from '@/utils/auth.js';
  import { validatePhone } from '@/utils/tools.js';
  import BaseDrawer from '@/components/BaseDrawer/index';
  import { EventBus } from './event-bus.js';
  import { throttle } from 'lodash';
  let notify = null;
  export default {
    props: {},
    components: { BaseDrawer },
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
        addBankInfo: {
          id: undefined,
          account_id: undefined,
          bank_account: undefined,
          id_card: undefined,
          bank_name: undefined,
          people_name: undefined,
          telephone: undefined,
          certificate_platform: [],
          owner_type: 1,
        },
        sta: { disabled: false, model: 'add', title: '', account_id: '' },
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
        showDrawer: false,
        tabLoading: false,

        bankData: [],
      };
    },
    computed: {},
    mounted() {
      EventBus.$on('open', (data) => {
        this.reset();
        this.showDrawer = true;
        this.sta = Object.assign(this.sta, data);
        if (this.sta.model == 'add') {
          this.addBankInfo.account_id = this.sta.account_id;
        }
        if (this.sta.model == 'show') {
          this.getAllInfo();
        }
      });
    },
    methods: {
      reset() {
        this.sta = {
          disabled: false,
          model: 'add',
          title: '',
        };
        this.addBankInfo = {
          id: undefined,
          account_id: undefined,
          bank_account: undefined,
          id_card: undefined,
          bank_name: undefined,
          people_name: undefined,
          telephone: undefined,
          certificate_platform: [],
          owner_type: 1,
        };
      },
      getAllInfo: throttle(function () {
        this.tabLoading = true;
        getBankInfo({ limit: 99, account_id: this.sta.account_id })
          .then((res) => {
            if (res && res.code == 0) {
              let arr = decrypt(res.data);
              this.bankData = arr.map((item) => {
                item.certificate_platform = JSON.parse(item.certificate_platform) || [];
                return item;
              });
              this.tabLoading = false;
            } else return Promise.reject(res.message);
          })
          .catch((err) => {
            this.tabLoading = false;
            this.notifyError(err);
          });
      }, 1000),
      submit() {
        if (this.sta.model == 'add') {
          this.$refs['form'].validate((valid) => {
            if (valid) {
              let queryFun = addBankInfo;
              if (this.addBankInfo.id) queryFun = editBankInfo;
              queryFun(encrypt(this.addBankInfo))
                .then((res) => {
                  if (res.code == 0) {
                    this.notifyError('操作成功！', '', true);
                    EventBus.$emit('submit');
                    this.showDrawer = false;
                  } else return Promise.reject(res.message);
                })
                .catch((err) => {
                  this.notifyError(err);
                });
            }
          });
        } else if (this.sta.model == 'show') {
          this.showDrawer = false;
        }
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
    },
  };
</script>
<style lang="scss" scoped>
  .el-card + .el-card {
    margin-top: 8px;
  }
</style>
