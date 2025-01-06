<template>
  <el-card class="mb10 max-width-view" :body-style="{ padding: '2px 10px' }">
    <div class="bank-content-view">
      <div class="bank-content-switch">
        <el-switch
          v-model="data.status"
          :active-value="1"
          :inactive-value="2"
          @change="changeStatus"
          class="mr10"
        >
        </el-switch>
        <label>{{ index }}</label>
      </div>
      <div style="padding: 12px; display: flex; flex-direction: row; align-items: center">
        <el-image :src="data.icon" style="width: 40px; margin-right: 16px">
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
          </div>
        </el-image>
        <div style="font-size: 14px">
          <div class="tag">
            开户名:{{ people_name }}
            <el-tag :text="verify_info.text" size="mini" :type="verify_info.type">
              {{ verify_info.text }}
            </el-tag>
          </div>
          <div style="padding-top: 2px">{{ card_info }}</div>
          <div style="padding-top: 2px">
            <el-tag v-for="(tag, index) in tags" :key="index" size="mini" type="primary">
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
      <div class="bank-content-action">
        <!-- <DescButton
          icon="el-icon-delete"
          circle
          plain
          type="danger"
          desc="删除"
          size="mini"
          @click="changeStatus(3)"
        /> -->
        <DescButton
          icon="el-icon-edit"
          circle
          plain
          desc="编辑"
          size="mini"
          @click="$emit('edit', data)"
        />
      </div>
    </div>
  </el-card>
</template>

<script>
  import { STATUS_MAPPER } from '@/utils/mapper';

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
      data: {
        type: Object,
        default: () => {},
      },
      index: {
        type: Number,
        default: 1,
      },
    },
    computed: {
      tags() {
        let data;
        if (typeof this.data.certificate_platform == 'string') {
          data = JSON.parse(this.data.certificate_platform || '[]');
        } else {
          data = this.data.certificate_platform || [];
        }
        return data.map((i) => BANK_CERTIFICATE_MAPPER[i] || '未知类型');
      },
      card_info() {
        let bank_short_name = this.data.bank_short_name || '暂无数据';
        if (!this.data.bank_account) return `${bank_short_name}（0000）`;
        let length = this.data.bank_account.length;

        return `${bank_short_name}（${this.data.bank_account.substr(length - 4, 4)}）`;
      },
      people_name() {
        if (!this.data.people_name) return '--';
        let length = this.data.people_name.length;
        let str = this.data.people_name.substr(0, 1);
        if (length <= 2) return str + '*';
        return `${str}*${this.data.people_name.substr(length - 1, 1)}`;
      },
      verify_info() {
        let data = {};
        switch (Number(this.data.verify_status)) {
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
    },
    methods: {
      changeStatus(val) {
        this.$confirm(`确认${STATUS_MAPPER[val]}该银行账户, 是否继续?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            this.$emit('changeStatus', this.data, val);
          })
          .catch(() => {
            if (val == 1) this.data.status = 2;
            if (val == 2) this.data.status = 1;
          });
      },
    },
  };
</script>

<style lang="scss" scoped>
  .max-width-view {
    width: 100%;
    max-width: 600px;
    cursor: move;
    //   &:hover{
    //   box-shadow: 0 2px 12px 0 var(--theme-light4)
    //   }
  }
  .bank-content-view {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    .bank-content-info {
      display: flex;
      justify-content: center;
      flex-direction: column;
      // align-items: center;
      color: #777;
      .bank-img {
        height: 46px;
      }
      > span {
        font-size: 14px;
        font-weight: bolder;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 170px;
      }
      > label {
        display: inline-block;
        font-size: 16px;
        font-weight: bolder;
        height: 46px;
        line-height: 46px;
      }
    }
    .bank-content-switch {
      display: flex;
      justify-content: center;
      flex-direction: row;
      align-items: center;
      color: #777;

      > label {
        display: inline-block;
        font-size: 16px;
        font-weight: bolder;
      }
    }
  }

  .el-tag + .el-tag {
    margin-left: 8px;
  }
  .tag {
    .el-tag:first-child {
      margin-left: 16px;
    }
  }
</style>
