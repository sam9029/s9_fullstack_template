<template>
  <BaseDrawer :title="`${drawerTitle}消息`" size="1300px" :visible.sync="visible" @close="drawerClose">
    <el-card class="message-card" v-loading="loading">
      <el-form
        :label-width="labelWidth + 'px'"
        ref="form"
        :model="form"
        :rules="rules"
        class="out-form"
      >
        <!-- 消息类型选择 -->
        <el-form-item label="消息类型" prop="message_type">
          <el-select v-model="form.message_type" @change="messageTpyeChange">
            <el-option
              v-for="messageTpye in messageTpyeOptions"
              :key="messageTpye.value"
              v-bind="messageTpye"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 动态 form -->
      <components
        ref="dynamicFormComponent"
        :is="msgComponent"
        :labelWidth="labelWidth"
        :messageType="form.message_type"
        :adversiterOptions="adversiterOptions"
      ></components>
    </el-card>

    <template slot="footer">
      <div class="footer-wrapper" v-loading="loading">
        <el-button @click="drawerClose">取 消</el-button>
        <el-button type="primary" :loading="operateLoading" @click="submitMessage()"
          >保存</el-button
        >
        <el-button type="primary" :loading="operateLoading" @click="submitMessage('send')"
          >发送</el-button
        >
      </div>
    </template>
  </BaseDrawer>
</template>

<script>
  import { adverDownList } from '@/api/account/advertiser/advertiser.js';
  import { add as addMessage, def } from '@/api/system/messageManagement.js';
  import BaseDrawer from '@/components/BaseDrawer/index.vue';
  import { mapperToOptions } from '@/utils/tools';
  import { MESSAGE_TYPE_MAPPER, ADVERTISER_TYPE_MAPPER } from '@/utils/mapper';

  export default {
    components: {
      BaseDrawer,
      NewProjectOnlineForm: () => import('./comps/NewProjectOnlineForm.vue'),
      IncentivePoliticalForm: () => import('./comps/IncentivePoliticalForm.vue'),
      HotTaskReommendForm: () => import('./comps/HotTaskReommendForm.vue'),
      PolicyChangeForm: () => import('./comps/PolicyChangeForm.vue'),
    },
    data() {
      return {
        messageTpyeOptions: mapperToOptions(MESSAGE_TYPE_MAPPER),
        visible: false,
        loading: false,
        drawerTitle: '新增',
        labelWidth: '120',
        // 左侧
        adversiterOptions: [],
        form: {
          id: null,
          message_type: 401,
        },
        rules: {
          message_type: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
        },
        // 右侧
      };
    },
    computed: {
      msgComponent() {
        switch (this.form.message_type) {
          case 401:
            return 'NewProjectOnlineForm';
          case 402:
            return 'IncentivePoliticalForm';
          case 403:
            return 'HotTaskReommendForm';
          case 404:
            return 'PolicyChangeForm';
        }
      },
    },
    methods: {
      open(row) {
        this.visible = true;
        this.form.message_type = this.messageTpyeOptions[0].value;
        if (row && row.id) {
          this.drawerTitle = '修改';
          this.form.id = row.id;          
          this.getDef(row.id);
        }
        this.$nextTick(() => {
          this.$refs.form.clearValidate();
        });
      },
      drawerClose() {
        this.reset();
        this.visible = false;
      },
      reset() {
        this.drawerTitle = '新增';
        this.form = {
          id: null,
          message_type: 401,
        };
      },
      //#endregion

      //#region API
      //#region API获取数据
      async getAdversiterList() {
        try {
          const res = await adverDownList();
          if (res && res.code === 0) {
            this.adversiterOptions = res.data || [];
          }
        } catch (error) {
          this.$notify.error(error || '获取项目产品下拉失败');
        }
      },

      getDef(id) {
        this.loading = true;
        def({ id: id })
          .then((res) => {
            if (!res.code) {
              this.form.message_type = res.data.message_type;
              // 等待 动态组件 注册后 回显
              setTimeout(() => {
                this.$refs.dynamicFormComponent.setEditData(res.data);
              });
            }
          })
          .catch((err) => this.message.error(err))
          .finally(() => {
            this.loading = false;
          });
      },

      submitMessage(_type) {
        let flag = true;

        // 判断消息类型
        this.$refs.form.validate((valid) => {
          if (!valid) {
            flag = false;
          }
        });

        // 通过之后 判断 动态form组件 的innerform验证并拿回innerform params
        let resInnerParam = this.$refs.dynamicFormComponent.getInnerFormParams();
        if (flag) {
          if (!resInnerParam) return;
        }

        let params = {
          // 消息一级类型1审核2财务3提醒4官方
          type: 4,
          ...this.form,
        };
        params['message_title'] = MESSAGE_TYPE_MAPPER[this.form.message_type];
        params['message'] = resInnerParam.message;
        params['show_message'] = resInnerParam.show_message;

        if (this.drawerTitle == '新增') delete params.id;

        this.operateLoading = true;
        addMessage(params)
          .then((res) => {
            if (!res.code) {
              this.$notify.success(`${this.drawerTitle}成功!`);
              this.$emit('success');
              this.drawerClose();

              // 若为直接发送
              if (_type == 'send') {
                this.$emit('handleMessageStatus', [res.data], 2);
              }
            }
          })
          .catch((err) => this.$notify.error(err))
          .finally((res) => {
            this.operateLoading = false;
          });
      },
      //#endregion
    },
    created() {
      this.getAdversiterList();
    },
  };
</script>

<style lang="scss" scoped>
  .message-card {
    position: relative;
    min-height: 85px;
    .out-form {
      position: absolute;
    }
    margin: 10px;
  }
  .footer-wrapper {
    padding: 10px;
  }

  ::v-deep {
    .el-input {
      width: 350px;
    }
  }
</style>
