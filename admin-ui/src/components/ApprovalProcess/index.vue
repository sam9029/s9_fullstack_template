<template>
  <div>
    <span>{{ current_verify_name }}</span>
    <el-popover placement="top" width="400" trigger="hover">
      <div style="max-height: 300px; overflow: auto">
        <el-steps direction="vertical" :active="1">
          <template v-for="(item, index) of list">
            <el-step
              v-if="item.verify_status"
              :key="'step_' + index"
              :status="stepStatus(item.verify_status)"
            >
              <div slot="title">
                <span class="step-user">{{ item.name }}</span>
                <span class="step-time">{{ item.create_time }}</span>
              </div>
              <div slot="description">
                <div v-if="item.operate_name">
                  <span class="step-operate">实际操作者</span>
                  <span class="step-remark">{{ item.operate_name }}</span>
                </div>
                <span class="step-operate">{{ item.operate }}</span>
                <span class="step-remark">{{ item.verify_suggest }}</span>
                <div class="step-space"></div>
              </div>
            </el-step>
            <!-- wait -->
            <el-step v-else :title="item.name" :key="'wait_' + index" status="wait">
              <div slot="description">
                <span class="step-operate">{{ item.desc }}</span>
                <div class="step-space"></div>
              </div>
            </el-step>
          </template>
        </el-steps>
      </div>
      <svg-icon slot="reference" iconName="shenpiliuchengguanli"></svg-icon>
    </el-popover>
  </div>
</template>

<script>
  const verifyOperate = {
    1: '待提交',
    2: '提交审核',
    3: '审核通过',
    4: '审核拒绝',
    5: '召回',
    6: '政策过期',
  };

  export default {
    props: {
      row_data: {
        type: Object,
        default: () => ({
          process: null,
          process_info: null,
          current_step: null,
        }),
      },
    },

    computed: {
      approval_process() {
        let temp = this.row_data['approval_process'];
        if (!temp) return [];
        if (typeof temp == 'string') temp = JSON.parse(temp);
        if (temp instanceof Array) return temp;
      },

      approval_process_info() {
        let temp = this.row_data['approval_process_info'];
        if (!temp) return [];
        if (typeof temp == 'string') temp = JSON.parse(temp);
        if (temp instanceof Array) return temp;
      },

      current_step() {
        return this.row_data['current_step'] || null;
      },

      current_verify_name() {
        return this.formatApprovalName(this.row_data);
      },

      list() {
        if (this.approval_process && this.approval_process_info) {
          return this.formatProcessLog(
            this.approval_process,
            this.approval_process_info,
            this.current_step,
          );
        }
        return [];
      },
    },

    data() {
      return {};
    },

    methods: {
      formatProcessLog(process = [], logs = [], step) {
        const arr = [];
        let createUser = '';
        logs.forEach((v) => {
          const { verify_status, create_time, verify_suggest = '' } = v;
          let operate_name = '';
          // 提交 召回 取user_id name
          if (verify_status == 2 || verify_status == 5) {
            createUser = v.user_name;
            operate_name = v.user_name;
          } else {
            operate_name = v.name;
          }
          const item = {
            verify_status,
            create_time,
            verify_suggest,
            name: operate_name,
            operate: verifyOperate[verify_status],
          };
          if (item.name != v.user_name) {
            item.operate_name = v.user_name;
          }
          arr.push(item);
        });

        if ([1, 4, 5].includes(this.row_data.verify_status)) {
          arr.push({ name: createUser, desc: '待提交' });
        }

        process.forEach((v, i) => {
          const { name, role_name } = v;
          if (i >= step) {
            arr.push({ name, role_name, desc: '待审核' });
          }
        });
        return arr;
      },

      formatApprovalName(item) {
        let status = item.verify_status;
        switch (status) {
          case 3:
            return '已完成';
          case 1:
          case 4:
          case 5:
            return '待提交';
          case 6:
            return '已过期';
          default:
            return this.approval_process[item.current_step]?.name;
        }
      },

      stepStatus(status) {
        switch (status) {
          case 3:
            return 'success';
          case 4:
            return 'error';
          case 5:
            return 'warning';
          default:
            return 'finish';
        }
      },
    },

    mounted() {},
  };
</script>

<style lang="scss" scoped>
  .step-user {
    display: inline-block;
    width: 90px;
  }
  .step-time {
    font-size: 12px;
  }
  .step-operate {
    display: inline-block;
    width: 90px;
  }
  .step-space {
    height: 15px;
  }
</style>
<style lang="scss">
  .el-form-item__content {
    > .el-steps.el-steps--vertical {
      .el-step__icon {
        display: flex;
      }
    }
  }
  .el-step__head.is-warning {
    color: #e6a23c;
    border-color: #e6a23c;
  }
  .el-step__title.is-warning {
    color: #e6a23c;
  }
  .el-step__description.is-warning {
    color: #e6a23c;
  }
</style>
