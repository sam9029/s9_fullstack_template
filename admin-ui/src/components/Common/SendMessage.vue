<template>
  <div class="box">
    <el-card class="card" shadow="never">
      <div slot="header">
        <div class="header">
          <div class="icon">
            <el-avatar :size="40" :src="titleIcon"></el-avatar>
          </div>
          <div class="title text">
            {{ MESSAGE_SUB_TYPE_MAPPER[templateType] }}
          </div>
        </div>
      </div>
      <div class="content">
        <div
          class="content_list"
          :style="item.type != 'textarea' ? 'align-items: center' : ''"
          v-for="(item, index) in MESSAGE_TEMPLATE[templateType]"
          :key="index"
        >
          <div class="label text">
            {{ item.label }}
          </div>
          <el-tooltip effect="dark" placement="top">
            <div style="max-width: 300px" slot="content">
              {{ form[item.model] }}
            </div>
            <div class="value">
              {{ form[item.model] }}
            </div>
          </el-tooltip>
        </div>
      </div>
      <el-divider></el-divider>
      <div class="detail">
        <div class="text">查看详情</div>
        <div>
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </el-card>

    <el-form ref="form" class="form" :model="form" label-position="left" label-width="100px">
      <el-form-item v-if="showTitle" label="标题">
        <el-select v-model="templateType" :disabled="disabled" placeholder="请选择">
          <el-option
            v-for="(item, key) in MESSAGE_SUB_TYPE_MAPPER"
            :key="key"
            :label="item"
            :value="parseInt(key)"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-for="(item, index) in MESSAGE_TEMPLATE[templateType]"
        :key="index"
        :label="item.label"
        :prop="item.model"
        :rules="[
          {
            required: true,
            message: `请输入${item.label}`,
            trigger: 'blur',
          },
        ]"
      >
        <div>
          <div v-if="item.type == 'text'">
            {{ form[item.model] }}
          </div>
          <div v-else-if="item.type == 'input'">
            <el-input :placeholder="`请输入${item.label}`" v-model="form[item.model]"> </el-input>
          </div>
          <div v-else-if="item.type == 'textarea'">
            <el-input
              type="textarea"
              :placeholder="`请输入${item.label}`"
              v-model="form[item.model]"
              :autosize="{ minRows: 2, maxRows: 6 }"
              resize="none"
            >
            </el-input>
          </div>
          <div v-else-if="item.type == 'DateTimePicker'">
            <el-date-picker
              v-model="form[item.model]"
              type="datetime"
              :placeholder="`请选择${item.label}`"
              :value-format="item.valueFormat"
              :format="item.format"
            >
            </el-date-picker>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
  import { MESSAGE_TYPE_MAPPER, MESSAGE_SUB_TYPE_MAPPER, MESSAGE_TEMPLATE } from '@/utils/mapper';
  import BaseDialog from '@/components/BaseDialog';
  import { cloneDeep } from 'lodash';

  export default {
    props: {
      advertiserType: {
        type: Number,
        default: null,
      },
      titleIcon: {
        type: String,
        default: 'https://koc-img.lizhibj.cn/manage/ltui.jpg',
      },
      //显示标题
      showTitle: {
        type: Boolean,
        default: false,
      },
      //消息类型
      messageType: {
        type: Number,
        default: null,
      },
      //消息模板类型
      templateType: {
        type: [Number, String],
        default: null,
      },
      //消息模板
      template: {
        type: Array,
        default: [],
      },
      //接收人1 表示系统内所有博主接收 2 所有投顾接收 3、管理员及商务接收，accoun_id
      receiver_user_ids: {
        type: Array,
        default: [1],
      },
      //小程序跳转地址
      path: {
        type: String,
        default: '',
      },
    },
    components: {
      BaseDialog,
    },
    data() {
      return {
        disabled: false,
        MESSAGE_TYPE_MAPPER,
        MESSAGE_TEMPLATE,
        MESSAGE_SUB_TYPE_MAPPER,
        form: {},
        formCopy: {},
      };
    },
    watch: {
      template: {
        deep: true,
        immediate: true,
        handler(val) {
          let obj = {};
          val.forEach((t) => {
            obj[t.model] = t.value;
          });
          this.form = cloneDeep(obj);
        },
      },
    },
    computed: {},
    mounted() {
      if (this.templateType) this.disabled = true;
    },
    methods: {
      validate() {
        this.formCopy.advertiser_type = this.advertiserType;
        this.formCopy.type = this.messageType;
        this.formCopy.sub_type = this.templateType;
        this.formCopy.path = this.path;
        this.formCopy.receiver_user_ids = this.receiver_user_ids;
        let obj = {};
        for (let i in this.form) {
          obj[i] = this.form[i];
        }
        this.formCopy.message = obj;
        return this.$refs.form.validate();
      },
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep .el-card__body {
    padding: 0;
  }
  ::v-deep .el-divider--horizontal {
    margin: 0;
  }
  .box {
    display: flex;
    justify-content: space-around;
    .card {
      width: 40%;

      .header {
        display: flex;
        align-items: center;

        .icon {
          margin-left: 10px;
        }
        .title {
          margin-left: 20px;
        }
      }

      .content {
        padding: 20px;
        min-height: 250px;
        .content_list {
          display: flex;
          margin: 5px 0;

          .label {
            width: 30%;
          }

          .value {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box !important;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical !important;
            word-break: break-all;
          }
        }
      }

      .detail {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
      }

      .text {
        color: #999;
        font-size: 14px;
      }
    }

    .form {
      width: 50%;
    }
  }
</style>
