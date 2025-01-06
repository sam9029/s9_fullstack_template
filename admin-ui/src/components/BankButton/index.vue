<template>
  <div>
    <el-popover placement="top" trigger="click" v-if="show">
      <div v-loading="checkLoading">
        <div class="ttat">
          <div class="bank-content-view" v-for="item in bankData" :key="item.id">
            <el-image :src="item.icon" style="width: 40px; margin-right: 16px">
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
            <div style="font-size: 14px">
              <div class="tag">
                开户名:{{ people_name(item) }}
                <el-tag :text="verify_info(item).text" size="mini" :type="verify_info(item).type">
                  {{ verify_info(item).text }}
                </el-tag>
              </div>
              <div style="padding-top: 2px">{{ card_info(item) }}</div>
              <!-- <div style="padding-top: 2px">
                <el-tag
                  v-for="(tag, index) in tags(item)"
                  :key="index"
                  size="mini"
                  type="primary"
                >
                  {{ tag }}
                </el-tag>
              </div> -->
            </div>
            <!-- <el-image
              class="bank-img"
              :src="item.bank_image"
              fit="contain"
            ></el-image>
            <div class="info_contont">
              <div>
                <span class="bank_name" v-if="item.bank_name.length < 10">
                  {{ item.bank_name }}
                </span>
                <el-tooltip placement="top-start" v-else>
                  <div slot="content">{{ item.bank_name }}</div>
                  <span class="bank_name">
                    {{ item.bank_name }}
                  </span>
                </el-tooltip>
                <span class="people_name"> {{ item.people_name }}</span>
              </div>
              <div>
                {{ getCardNumber(item.bank_account) }}
                ({{ item.card_type_name }})
              </div>
            </div> -->
          </div>
        </div>

        <div class="more">
          <el-button @click="more" size="mini" round>更多</el-button>
          <!-- <el-button type="primary" @click="addBank" size="mini" round>
            去添加
          </el-button> -->
        </div>
      </div>
      <el-button
        :disabled="disabled"
        @click="check"
        round
        size="mini"
        slot="reference"
        type="primary"
      >
        查看
      </el-button>
    </el-popover>
    <!-- <el-button
      v-else
      :disabled="disabled"
      @click="addBank"
      round
      size="mini"
      type="primary"
    >
      去添加
    </el-button> -->
  </div>
</template>

<script>
  import { getBankInfo } from '@/api/public/bank.js';
  import { decrypt } from '@/utils/auth.js';
  import { EventBus } from './event-bus.js';
  let notify = null;
  const BANK_VERIFY_MAPPER = {
    1: '等待审核',
    2: '审核通过',
    3: '审核拒绝',
  };
  const BANK_CERTIFICATE_MAPPER = {
    1: '京灵平台',
    2: '云账户',
  };
  export default {
    props: {
      show: {
        type: Boolean,
        default: true, // show add
      },
      disabled: {
        type: Boolean,
        default: false, // 按钮禁用
      },
      account_id: {
        type: Number,
        // default: 10007058,
        default: 10000001,
      },
    },
    components: {
      BaseDrawer: () => import('@/components/BaseDrawer/index'),
    },
    data() {
      return {
        bankVisible: false,
        bankData: [],

        checkLoading: false,

        addBankInfo: {
          id: undefined,
          account_id: this.account_id,
          bank_account: undefined,
          id_card: undefined,
          bank_name: undefined,
          people_name: undefined,
          telephone: undefined,
        },
      };
    },
    mounted() {
      EventBus.$on('submit', (data) => {
        this.$emit('callback');
      });
    },
    methods: {
      tags(item) {
        let data;
        if (typeof item.certificate_platform == 'string') {
          data = JSON.parse(item.certificate_platform || '[]');
        } else {
          data = item.certificate_platform || [];
        }
        return data.map((i) => BANK_CERTIFICATE_MAPPER[i] || '未知类型');
      },
      card_info(item) {
        let bank_short_name = item.bank_short_name || '暂无数据';
        if (!item.bank_account) return `${bank_short_name}（0000）`;
        let length = item.bank_account.length;

        return `${bank_short_name}（${item.bank_account.substr(length - 4, 4)}）`;
      },
      people_name(item) {
        if (!item.people_name) return '--';
        let length = item.people_name.length;
        let str = item.people_name.substr(0, 1);
        if (length <= 2) return str + '*';
        return `${str}*${item.people_name.substr(length - 1, 1)}`;
      },
      verify_info(item) {
        let data = {};
        switch (Number(item.verify_status)) {
          case 1:
            data = {
              text: BANK_VERIFY_MAPPER[1],
              type: 'info',
              icon: 'info-circle',
            };
            break;
          case 2:
            data = {
              text: BANK_VERIFY_MAPPER[2],
              type: 'success',
              icon: 'checkmark-circle',
            };
            break;
          case 3:
            data = {
              text: BANK_VERIFY_MAPPER[3],
              type: 'error',
              icon: 'close-circle',
            };
            break;
          default:
            data = {
              text: '暂无信息',
              type: 'info',
              icon: 'info-circle',
            };
            break;
        }
        return data;
      },
      check() {
        this.checkLoading = true;
        getBankInfo({ limit: 1, account_id: this.account_id })
          .then((res) => {
            this.checkLoading = false;
            if (res && res.code == 0) {
              this.bankData = decrypt(res.data);
            } else return Promise.reject(res.message);
          })
          .catch((err) => {
            this.checkLoading = false;
            this.notifyError(err);
          });
      },
      more() {
        EventBus.$emit('open', {
          model: 'show',
          disabled: true,
          account_id: this.account_id,
          title: '银行卡信息',
        });
      },

      addBank() {
        EventBus.$emit('open', {
          model: 'add',
          title: '添加银行卡',
          account_id: this.account_id,
        });
      },

      getCardNumber(account) {
        let acc = String(account);
        return acc.substr(0, 4) + '****' + acc.substr(account.length - 4, 4);
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
  .bank-content-view {
    display: flex;
    align-items: center;
    justify-content: space-around;
    border: 1px solid #ffc0cb;
    border-radius: 10px;
    padding: 4px 8px 4px;
    min-height: 57px;
  }
  .ttat {
    min-height: 57px;
  }
  .bank-content-view + .bank-content-view {
    margin-top: 8px;
  }
  .bank-img {
    height: 46px;
  }
  .info_contont {
    display: inline-block;
    min-width: 156px;
  }
  .bank_name {
    display: inline-block;
    // flex: auto;
    min-width: 64px;
    color: #000000d9;
    font-size: 16px;
    font-weight: bolder;
    overflow: hidden;
    max-width: 156px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .people_name {
    display: inline-block;
    font-weight: bolder;
    margin-left: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .more {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
  ::v-deep .el-empty {
    padding: 0;
  }
  ::v-deep .el-empty__description {
    margin-top: 0;
  }
  .el-link + .el-link {
    margin-left: 4px;
  }
</style>
