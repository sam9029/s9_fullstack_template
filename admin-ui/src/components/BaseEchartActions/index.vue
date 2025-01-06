<template>
  <el-card
    shadow="never"
    class="base-echart-card"
    :style="{
      height: customStyle.height,
    }"
    v-loading="loading"
  >
    <div class="base-echart-card-header">
      <div class="echart-card-header--top">
        <span class="echart-card-header--title">{{ title }}</span>
        <div class="echart-card-header--center">
          <slot name="header-center"></slot>
        </div>
      </div>
      <div class="echart-card-header--bottom">
        <div v-if="customFilter" class="echart-custom-header--custom-filter">
          <slot name="custom-filter"></slot>
        </div>
        <div v-else class="bottom-actions">
          <div class="filter-item" v-for="(item, index) in filters" :key="item.prop">
            <!-- 日期选择 -->
            <template v-if="item.type === 'day'">
              <el-date-picker
                size="mini"
                style="width: 150px"
                type="date"
                v-model="item.value"
                value-format="yyyy-MM-dd"
                :clearable="!!item.clearable"
                :placeholder="item.placeholder || '选择日期'"
                :picker-options="item.pickerOptions || pickerOptions"
              >
              </el-date-picker>
            </template>

            <el-select
              v-else-if="item.type == 'dateRange'"
              size="mini"
              v-model="item.model"
              :clearable="item.clearable"
              :placeholder="item.placeholder || '时间范围'"
              @change="changeDateRange($event, item)"
            >
              <el-option
                v-for="el in commonDateOpts"
                :key="el.value"
                :label="el.label"
                :value="el.value"
              ></el-option>
            </el-select>

            <el-input
              v-else-if="item.type == 'input'"
              size="mini"
              v-model="item.value"
              :clearable="item.clearable"
              :placeholder="item.placeholder || '输入内容'"
              style="max-width: 120px"
            ></el-input>

            <!-- 选择 -->
            <template v-else>
              <el-select
                v-if="item.show === false ? false : true"
                size="mini"
                v-model="item.value"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :filterable="item.filterable"
                :remote="item.remote"
                :remote-method="(val) => $emit(item.remoteMethod, val)"
              >
                <el-option
                  v-for="el in item.options"
                  :key="el.value"
                  :label="el.label"
                  :value="el.value"
                ></el-option>
              </el-select>
            </template>
          </div>
          <div v-if="filters.length">
            <el-button type="text" size="mini" @click="search">搜索</el-button>
            <el-button type="text" size="mini" @click="reset">重置</el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="base-echart-card-body">
      <slot name="echart-body"></slot>
    </div>
  </el-card>
</template>

<script>
  // filters: [
  // {
  //   prop: 'select_1',
  //   placeholder: '选择1',
  //   value: null,
  //   options: [
  //     {
  //       label: 1,
  //       value: 1
  //     },
  //     {
  //       label: 2,
  //       value: 2
  //     },
  //     {
  //       label: 3,
  //       value: 3
  //     },
  //   ]
  // }
  import { defaultPickerOptions } from '@/utils/common/formatDate';
  import { mapperToOptions } from '@/utils/tools.js';
  import moment from 'moment';
  import { COMMON_DATE_MAPPER } from '@/views/copyrightCenter/operationAnalysis/comp/mapper.js';
  export default {
    name: 'base-echart-actions',
    props: {
      title: {
        type: String,
        default: '',
      },
      customTitle: {
        type: Boolean,
        default: false,
      },
      customFilter: {
        type: Boolean,
        default: false,
      },
      customFilter: {
        type: Boolean,
        default: false,
      },
      loading: {
        type: Boolean,
        default: false,
      },
      filters: {
        type: Array,
        default: () => [],
      },
      customStyle: {
        type: Object,
        default: () => {
          return {
            height: '455px',
          };
        },
      },
    },
    data() {
      return {
        commonDateOpts: mapperToOptions(COMMON_DATE_MAPPER),
        pickerOptions: {
          disabledDate(time) {
            return time.getTime() > Date.now();
          },
        },
        dateRangePickerOptions: {
          ...defaultPickerOptions(),
          disabledDate(date) {
            return date.getTime() > Date.now();
          },
        },
      };
    },
    methods: {
      search() {
        this.$emit('search');
      },

      reset() {
        this.$emit('reset');
      },

      changeDateRange(value, item) {
        let time = [];
        switch (value) {
          case 'PAST_7':
            time = [
              moment().subtract(6, 'days').format('YYYY-MM-DD'),
              moment().format('YYYY-MM-DD'),
            ];
            break;
          case 'NOW':
            time = [moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];
            break;
          case 'YESTERDAY':
            time = [
              moment().subtract(1, 'days').format('YYYY-MM-DD'),
              moment().subtract(1, 'days').format('YYYY-MM-DD'),
            ];
            break;
          case 'PAST_30':
            time = [
              moment().subtract(29, 'days').format('YYYY-MM-DD'),
              moment().format('YYYY-MM-DD'),
            ];
            break;
          case 'CURR_WEEK':
            // 本周
            time = [
              moment().startOf('week').format('YYYY-MM-DD'),
              moment().format('YYYY-MM-DD'), // 截止时间改为当天
            ];
            break;
          case 'LAST_WEEK':
            // 上周
            time = [
              moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DD'),
              moment().subtract(1, 'week').endOf('week').format('YYYY-MM-DD'),
            ];
            break;
          case 'CURR_MONTH':
            // 本月
            time = [
              moment().startOf('month').format('YYYY-MM-DD'),
              moment().format('YYYY-MM-DD'), // 截止时间改为当天
            ];
            break;
          case 'LAST_MONTH':
            // 上月
            time = [
              moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
              moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
            ];
            break;
        }
        this.$set(item, 'value', time);
      },
    },
  };
</script>

<style lang="scss" scoped>
  .base-echart-card-header {
    display: grid;
    grid-gap: 10px;
    align-items: center;
    .echart-card-header--top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .echart-card-header--title {
      font-weight: bold;
    }
    .bottom-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    ::v-deep .el-button--mini {
      height: 29px !important;
    }
    ::v-deep .el-form .el-form-item {
      margin-bottom: 0 !important;
    }
  }
  .base-echart-card-body {
    margin-top: 10px;
  }
</style>
