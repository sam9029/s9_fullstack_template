<template>
  <BaseDialog
    title="意见反馈"
    width="1050px"
    :visible.sync="visible"
    @close="close"
  >
    <ReplyFeedBack :model="model" ref="formRef"></ReplyFeedBack>
    <span slot="footer">
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="submitMessage">确定</el-button>
    </span>
  </BaseDialog>
</template>


<script>
import { addMessage } from '@/api/public.js';
import moment from 'moment';
import BaseDialog from '@/components/BaseDialog/index.vue';
import ReplyFeedBack from '../template/ReplyFeedBack.vue'

function defaultModel(row) {
  const now = moment().format('YYYY-MM-DD HH:mm');
  return {
    feedback_time: row.create_time,
    title: row.describe,
    content: '',
    reply_time: now,
  };
}


export default {
  components: {
    BaseDialog,
    ReplyFeedBack,
  },
  data() {
    return {
      visible: false,
      feedback: null,
      model: {},
      loading: false,
    };
  },
  methods: {
    open(row) {
      this.feedback = row;
      this.model = defaultModel(row);
      this.visible = true;
    },
    close() {
      this.feedback = null;
      this.visible = false;
    },
    submitMessage() {
      this.$refs.formRef.validate().then((params) => {
        const attchParams = {
          ...params,
          receiver_user_ids: [this.feedback.create_user_id]
        }
        return this.sendMessage(attchParams);
      });
    },
    sendMessage(params) {
      this.loading = true;
      addMessage(params)
        .then((res) => {
          if (res.code == 0) {
            this.loading = false;
            this.$notify.success('发送成功！');
            this.close();
          }
        })
        .catch((err) => {
          this.loading = false;
          this.$notify.error(err.message || err);
        });
    },
  },
};
</script>