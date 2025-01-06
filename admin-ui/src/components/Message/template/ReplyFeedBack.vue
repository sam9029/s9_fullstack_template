<template>
  <div class="send-msg-template">
    <el-form class="left-align-form" label-width="110px" :model="model" :rules="rules" ref="form">
      <el-form-item label="反馈时间">
        <span>{{ model.feedback_time }}</span>
      </el-form-item>
      <el-form-item label="反馈主题">
        <span>{{ model.title }}</span>
      </el-form-item>
      <el-form-item label="回复内容" prop="content">
        <el-input
          class="input-width"
          type="textarea"
          placeholder="请输入"
          v-model="model.content"
          :autosize="{ minRows: 2, maxRows: 6 }"
          resize="none"
        >
        </el-input>
      </el-form-item>
      <el-form-item label="回复时间">
        <span>{{ model.reply_time }}</span>
      </el-form-item>
    </el-form>

    <MessageCard subType="subType" :content="content"></MessageCard>
  </div>
</template>


<script>
import MessageCard from './MessageCard.vue';

export default {
  props: ['model'],
  components: {
    MessageCard,
  },
  data() {
    return {
      subType: 605,
      rules: {
        content: { required: true, message: '请填写回复内容', trigger: 'blur' },
      },
    };
  },
  computed: {
    content() {
      const arr = [
        { label: '反馈时间', value: this.model.feedback_time },
        { label: '反馈主题', value: this.model.title, tooltip: true },
        { label: '温馨提示', value: this.model.content, tooltip: true },
        { label: '回复时间', value: this.model.reply_time },
      ];
      return arr;
    },
  },
  methods: {
    validate() {
      return this.$refs.form.validate().then(() => {
        const params = this.getMsgParams();
        return params;
      });
    },
    getMsgParams() {
      const params = {
        type: 6,
        sub_type: this.subType,
        path: '',
        // receiver_user_ids: [],
        message: {
          ...this.model,
        },
      };
      return params;
    },
  },
};
</script>