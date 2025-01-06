<template>
  <BaseDialog
    title="发布作品送审"
    width="1050px"
    :visible.sync="$attrs.visible"
    @open="open"
    @close="close"
  >
    <WritingVerify :advertiser_type="advertiser_type" :model="model" ref="formRef"></WritingVerify>
    <span slot="footer">
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="submitMessage">确定</el-button>
    </span>
  </BaseDialog>
</template>


<script>
import { addMessage } from '@/api/public.js';
import { getSubTypeMsgModel } from '../template/modules.js'
import BaseDialog from '@/components/BaseDialog/index.vue';
import WritingVerify from '../template/WritingVerify.vue'

export default {
  props: ['advertiser_type'],
  components: {
    BaseDialog,
    WritingVerify,
  },
  data() {
    return {
      model: getSubTypeMsgModel(102),
      loading: false,
    };
  },
  methods: {
    open() {
      this.model = getSubTypeMsgModel(102);
    },
    close() {
      this.$emit('update:visible', false);
    },
    submitMessage() {
      this.$refs.formRef.validate().then((params) => {
        return this.sendMessage(params);
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