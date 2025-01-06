<template>
  <div class="send-msg-template">
    <el-form class="left-align-form" label-width="110px" :model="model" :rules="rules" ref="form">
      <el-form-item label="项目名称">
        <span>{{ advertiserName }}</span>
      </el-form-item>
      <el-form-item label="送审时间" prop="verify_time">
        <el-date-picker
          v-model="model.verify_time"
          type="datetime"
          placeholder="请选择送审时间"
          value-format="yyyy-MM-dd HH:mm"
          format="yyyy-MM-dd HH:mm"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="温馨提示" prop="remark">
        <el-input
          type="textarea"
          placeholder="请输入"
          v-model="model.remark"
          :autosize="{ minRows: 2, maxRows: 6 }"
          resize="none"
        >
        </el-input>
      </el-form-item>
    </el-form>

    <MessageCard :subType="subType" :content="content"></MessageCard>    
  </div>
</template>

<script>
import { ADVERTISER_TYPE_MAPPER } from '@/utils/mapper';
import MessageCard from './MessageCard.vue'
import { getSubTypeMsgModel } from './modules.js'

export default {
  props: {
    advertiser_type: [Number, String],
    model: {
      type: Object,
      default: () => getSubTypeMsgModel(102),
    },
  },
  components: {
    MessageCard,
  },
  data() {
    return {
      subType: 102,
      rules: {
        verify_time: { required: true, message: '请选择送审时间', trigger: 'change' },
        remark: { required: true, message: '请填写提示信息', trigger: 'blur' },
      },
    };
  },
  computed: {
    advertiserName() {
      return ADVERTISER_TYPE_MAPPER[this.advertiser_type];
    },
    content() {
      const arr = [
        { label: '项目名称', value: this.advertiserName },
        { label: '送审时间', value: this.model.verify_time },
        { label: '温馨提示', value: this.model.remark, tooltip: true },
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
        advertiser_type: this.advertiser_type,
        type: 1,
        sub_type: this.subType,
        path: '',
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
