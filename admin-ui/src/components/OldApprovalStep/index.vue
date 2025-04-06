<template>
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
</template>

<script>
  import { getApprovalLog } from '@/api/public.js';

  const verifyOperate = {
    2: '提交审核',
    3: '审核通过',
    4: '审核拒绝',
    5: '召回',
    6: '政策过期',
  };
  export default {
    props: ['process', 'process_info', 'step', 'id'],
    data() {
      return {
        fetchLogs: [],
      };
    },
    computed: {
      list() {
        if (this.process && this.process_info) {
          return this.formatProcessLog(this.process, this.process_info, this.step);
        }
        return this.fetchLogs;
      },
    },
    watch: {
      id: {
        handler(val) {
          if (val) return this.fetchApprovalLog();
          this.fetchLogs = [];
        },
        immediate: true,
      },
    },
    methods: {
      formatProcessLog(process = [], logs = [], step = 0) {
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
        if (step == null) {
          arr.push({ name: createUser, desc: '待提交' });
          step = 0;
        }
        process.forEach((v, i) => {
          const { name, role_name } = v;
          if (i >= step) {
            arr.push({ name, role_name, desc: '待审核' });
          }
        });
        return arr;
      },
      fetchApprovalLog() {
        getApprovalLog({ id: this.id })
          .then((data) => {
            const { approval_process, approval_process_info } = data.data;
            this.fetchLogs = this.formatProcessLog(approval_process, approval_process_info);
          })
          .catch((err) => {
            this.fetchLogs = [];
          });
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
