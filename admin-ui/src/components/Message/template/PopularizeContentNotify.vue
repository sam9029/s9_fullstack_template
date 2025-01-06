<template>
  <div class="send-msg-template">
    <el-form class="left-align-form" label-width="110px" :model="model" :rules="rules" ref="form">
      <el-form-item label="通知标题" prop="content">
        <el-input
          type="text"
          placeholder="请输入通知标题"
          v-model="model.content"
        >
        </el-input>
      </el-form-item>
      <el-form-item label="内容详情" prop="remark">
        <el-input
          type="textarea"
          placeholder="请输入内容详情"
          v-model="model.remark"
          :autosize="{ minRows: 2, maxRows: 6 }"
          resize="none"
        >
        </el-input>
      </el-form-item>

      <el-form-item label="创建时间" prop="create_time">
        <el-date-picker
          v-model="model.create_time"
          type="datetime"
          placeholder="请选择创建时间"
          value-format="yyyy-MM-dd HH:mm"
          format="yyyy-MM-dd HH:mm"
        >
        </el-date-picker>
      </el-form-item>
    </el-form>

    <MessageCard :subType="subType" :content="content"></MessageCard>
  </div>
</template>

<script>
import MessageCard from './MessageCard.vue'
import { getSubTypeMsgModel } from './modules.js'

export default {
  props: {
    model: {
      type: Object,
      default: () => getSubTypeMsgModel(505),
    },
  },
  components: {
    MessageCard,
  },
  data() {
    return {
      subType: 505,
      rules: {
        content: { required: true, message: '请填写通知标题', trigger: 'blur' },
        create_time: { required: true, message: '请选择创建时间', trigger: 'change' },
        remark: { required: true, message: '请填写内容详情', trigger: 'blur' },
      },
    };
  },
  computed: {
    content() {
      const arr = [
        { label: '通知标题', value: this.model.content },
        { label: '内容详情', value: this.model.remark, tooltip: true },
        { label: '创建时间', value: this.model.create_time },
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
      const type = ~~(this.subType / 100);
      const params = {
        type,
        sub_type: this.subType,
        path: 'open_details',
        receiver_user_ids: [4],
        message: {
          ...this.model,
        },
      };
      return params;
    },
  },
};
</script>
