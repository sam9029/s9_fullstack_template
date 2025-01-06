<template>
  <div class="create-wrapper flex">
    <div class="left-wrapper create-wrapper-item">
      <el-form
        :label-width="labelWidth + 'px'"
        ref="innerForm"
        :model="innerForm"
        :rules="innerRules"
      >
        <el-form-item label="项目产品" prop="advertiser_type">
          <el-select v-model="innerForm.advertiser_type" clearable @change="advertiserTypeChange">
            <el-option
              v-for="item in adversiterOptions"
              :key="item.value"
              v-bind="item"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="业务类型" prop="business_type">
          <el-select v-model="innerForm.business_type" clearable @change="businessTypeChange">
            <el-option v-for="item in businessOptions" :key="item.value" v-bind="item"></el-option>
          </el-select>
        </el-form-item> -->
        <el-form-item label="任务名称" prop="task_name">
          <el-select
            v-model="innerForm.task_name"
            clearable
            filterable
            remote
            :remote-method="getTaskList"
          >
            <el-option v-for="item in taskNameOpts" :key="item.value" v-bind="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="真实推广人数" prop="real_promotion_num">
          <el-input v-model.number="innerForm.real_promotion_num" type="number" disabled>
          </el-input>
        </el-form-item>
        <el-form-item label="真实历史收益" prop="real_historical_income">
          <el-input v-model.number="innerForm.real_historical_income" type="number" disabled>
          </el-input>
        </el-form-item>
        <el-form-item label="展示类型" prop="display_type">
          <el-select v-model="innerForm.display_type" clearable @change="displayTypeChange">
            <el-option v-for="item in displayTypeOpts" :key="item.value" v-bind="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="展示推广人数" prop="display_promotion_num">
          <el-input v-model.number="innerForm.display_promotion_num" type="number"> </el-input>
        </el-form-item>
        <el-form-item label="展示历史收益" prop="display_historical_income">
          <el-input v-model.number="innerForm.display_historical_income" type="number"> </el-input>
        </el-form-item>
      </el-form>
    </div>
    <div class="right-wrapper create-wrapper-item">
      <!-- 预览 -->
      <MessagePreviewCard :subType="messageType" :content="previewContent" />
    </div>
  </div>
</template>

<script>
  // 工具
  import moment from 'moment';
  import { SETTLE_MAPPER, SETTLEMENTCOLUMNS } from './config.js';
  import { advertiserCategroyList } from '@/api/business/public.js';
  import { getContent } from '@/api/public.js';
  import BaseTable from '@/components/BaseTable/index.vue';
  import MessagePreviewCard from './MessageCard.vue';

  export default {
    components: {
      BaseTable,
      MessagePreviewCard,
    },
    props: {
      adversiterOptions: {
        type: Array,
        default: () => [],
      },
      labelWidth: [String, Number],
      messageType: null,
    },
    data() {
      return {
        SETTLE_MAPPER,
        SETTLEMENTCOLUMNS,
        displayTypeOpts: [
          { label: '编辑数据', value: 1 },
          { label: '真实数据', value: 2 },
        ],
        taskNameOpts: [],
        businessOptions: [],
        innerForm: {
          advertiser_type: null,
          task_name: null,
          // business_type: null,
          real_promotion_num: 0,
          real_historical_income: 0,
          display_type: 1,
          display_promotion_num: 0,
          display_historical_income: 0,
        },
        innerRules: {
          advertiser_type: [{ required: true, message: '请选择项目产品', trigger: 'change' }],
          // business_type: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
          task_name: [{ required: true, message: '请选择任务名称', trigger: 'change' }],
          real_promotion_num: [{ required: true, message: '请选择真实推广人数', trigger: 'blur' }],
          real_historical_income: [
            { required: true, message: '请选择真实历史收益', trigger: 'blur' },
          ],
          display_type: [{ required: true, message: '请选择展示类型', trigger: 'change' }],
          display_promotion_num: [
            { required: true, message: '请选择展示推广人数', trigger: 'blur' },
          ],
          display_historical_income: [
            { required: true, message: '请选择展示历史收益', trigger: 'blur' },
          ],
        },
        // 爆款任务推荐
        previewMapper: {
          advertiser_type: '推广项目',
          task_name: '任务名称',
          // business_type: '业务类型',
          // real_promotion_num: '真实推广人数',
          // real_historical_income: '真实历史收益',
          // display_type: '展示类型',
          display_promotion_num: '推广人数',
          display_historical_income: '历史收益',
        },
        previewContent: [],
      };
    },
    computed: {
      curTask() {
        return this.taskchange();
      },
    },
    watch: {
      innerForm: {
        handler(n, o) {
          let temp = [];
          Object.keys(n).forEach((key) => {
            // 筛选展示 字段 （没有就跳出本次循环）
            if (!this.previewMapper[key]) return;
            let tempItem = {
              label: this.previewMapper[key],
              prop: key,
              value: null,
            };
            // // 没有值就 -- 跳出本次循环 - 并赋值 null
            // if (!n[key]) return tempItem.value = '';

            if (key == 'advertiser_type') {
              tempItem.value = this.adversiterOptions.filter((it) => it.value == n[key])[0]?.label;
            } else if (key == 'task_name') {
              if (this.curTask?.label) tempItem.value = this.curTask.label;
              else tempItem.value = '';
            } else if (key == 'display_promotion_num') {
              if (n[key] || n[key] == 0) tempItem.value = n[key] + '人';
              else tempItem.value = '';
            } else if (key == 'display_historical_income') {
              if (n[key] || n[key] == 0) tempItem.value = n[key] + '元';
              else tempItem.value = '';
            } else {
              tempItem.value = n[key];
            }

            temp.push(tempItem);
          });
          this.previewContent = temp;
        },
        deep: true,
        immediate: true,
      },
    },
    methods: {
      //#region 数据处理
      /**
       * 动态 组件 下 渲染的form 表单 的验证函数---同时 满足验证的时候 返回所有的 form字段数据
       * @return {Boolean}
       */
      handleInnerFormValid(_innerParams) {
        let flag = true;

        this.$refs.innerForm.validate((valid) => {
          // 验证失败
          if (!valid) {
            flag = false;
          }
        });

        return flag;
      },
      /**
       * 返回当前的 innrform 字段
       * @return {Object}
       *
       */
      getInnerFormParams() {
        if (this.handleInnerFormValid()) {
          return {
            message: this.innerForm,
            show_message: this.previewContent,
          };
        } else {
          return null;
        }
      },
      /**
       * 父组件调用 设置编辑数据回显
       * @param {*} _data
       */
      setEditData(_data) {
        this.innerForm = _data.message;
        this.previewContent = _data.show_message;
        this.getTaskList(null, _data.message.advertiser_type);
      },

      // API
      // 获取业务类型下拉
      async getBusinessSelect() {
        try {
          const res = await advertiserCategroyList();
          if (res && res.code === 0) {
            this.businessOptions = res.data || [];
          }
        } catch (error) {
          this.$notify.error(error || '获取业务类型下拉失败');
        }
      },
      // 获取任务-及获取内容管理的数据
      getTaskList(val, _ad_type) {
        let params = {
          advertiser_type: null,
          is_income: true,
        };

        // if (this.innerForm.business_type) params.business_type = this.innerForm.business_type;
        if (val) params.keyword = val;
        if (_ad_type) params.advertiser_type = _ad_type;

        getContent(params)
          .then((res) => {
            if (res.code === 0) {
              const opts = res.data.map((v) => {
                // return { label: v.name, value: v.id, ...v };
                return { label: v.name, value: v.relation_id, ...v };
              });
              this.taskNameOpts = opts;
            } else {
              this.$notify.error('获取项目产品失败!' + res.message);
            }
          })
          .catch((err) => {
            this.$notify.error('获取项目产品失败!' + err);
          })
          .finally(() => {});
      },
      businessTypeChange(val) {
        this.getTaskList();
      },
      // 项目改变--真实收益/推广 动态获取
      advertiserTypeChange(val) {
        // 清空选择，则不请求
        if (!val) {
          return this.taskNameOpts = [];
        } 
        this.getTaskList(null, val);
      },
      // 任务改变
      taskchange() {
        let curItem = this.taskNameOpts.filter((it) => this.innerForm.task_name == it.value);

        if (curItem.length > 0) {
          this.innerForm.real_promotion_num = curItem[0].join_people_num || 0;
          this.innerForm.real_historical_income = curItem[0].total_income || 0;
          this.innerForm.display_promotion_num = curItem[0].join_people_num || 0;
          this.innerForm.display_historical_income = curItem[0].total_income || 0;
        } else {
          this.innerForm.real_promotion_num = 0;
          this.innerForm.real_historical_income = 0;
          this.innerForm.display_promotion_num = 0;
          this.innerForm.display_historical_income = 0;
        }

        return curItem[0];
      },
      displayTypeChange() {
        // 1 编辑 2 真实
        if (this.innerForm.display_type == 2) {
          this.innerForm.display_promotion_num = this.innerForm.real_promotion_num;
          this.innerForm.display_historical_income = this.innerForm.real_historical_income;
        } else {
          return;
        }
      },
    },
    created() {
      this.getBusinessSelect();
      // this.getTaskList();
    },
  };
</script>

<style lang="scss" scoped>
  .create-wrapper {
    // display: flex;
    justify-content: space-between;

    .create-wrapper-item {
      flex: 1 auto;
    }
    .left-wrapper {
      padding-top: 55px;
    }
    .right-wrapper {
      max-width: 555px !important;
    }
  }

  .editor-wrapper {
    border: 1px solid #ccc;
  }
  .editor-toolbar {
    border-bottom: 1px solid #ccc;
  }
  .editor-editor {
    height: 300px;
    overflow-y: hidden;
  }

  .baseTable-List,
  .editor-wrapper {
    width: 500px;
  }
</style>
