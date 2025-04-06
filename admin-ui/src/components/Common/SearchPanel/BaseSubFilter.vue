<template>
  <div class="sub-filter-component">
    <el-input
      :style="searchItem.style"
      size="small"
      class="el-input-padding-15"
      v-if="searchItem.genre == 'input'"
      v-model="subValue"
      :placeholder="searchItem.placeholder"
      @keyup.enter.native="onSubmit(searchItem.model)"
    >
      <i
        slot="prefix"
        class="el-input__icon el-icon-search"
        @click="onSubmit(searchItem.model)"
      ></i>
    </el-input>

    <div
      v-if="searchItem.genre == 'select-range'"
      :style="searchItem.style"
      class="item-select-range"
    >
      <div class="select-range">
        <div class="left-box">
          <span class="mr10 base-font">大于</span>
          <template v-if="searchItem.minAndMax && searchItem.minAndMax.length">
            <el-input-number
              :min="searchItem.minAndMax[0]"
              :max="searchItem.minAndMax[1]"
              v-model.number="subValue[0]"
              placeholder="请输入最大值"
            ></el-input-number>
          </template>
          <template v-else>
            <el-input-number
              v-model.number="subValue[0]"
              placeholder="请输入最大值"
            ></el-input-number>
          </template>
          <div class="triangle" :class="{ show: rangeSelectValid }"></div>
        </div>
        <div class="right-box">
          <span class="mr10 ml10 base-font">小于</span>
          <template v-if="searchItem.minAndMax && searchItem.minAndMax.length">
            <el-input-number
              :min="searchItem.minAndMax[0]"
              :max="searchItem.minAndMax[1]"
              v-model.number="subValue[1]"
              placeholder="请输入最大值"
            ></el-input-number>
          </template>
          <template v-else>
            <el-input-number
              v-model.number="subValue[1]"
              placeholder="请输入最大值"
            ></el-input-number>
          </template>
        </div>
      </div>
    </div>

    <el-select
      v-if="searchItem.genre == 'select'"
      size="small"
      :style="searchItem.style"
      :is-multiple="!!searchItem.multiple"
      :multiple="!!searchItem.multiple"
      :filterable="true"
      :collapse-tags="!!searchItem.multiple"
      @click.native="clickSelect(searchItem.click, searchItem.model)"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
      v-model="subValue"
      :placeholder="
        searchItem.placeholder
          ? searchItem.placeholder
          : '请选择' + searchItem.label.substring(0, searchItem.label.length - 1)
      "
      :clearable="'clearable' in searchItem ? searchItem.clearable : true"
    >
      <template v-if="Object.prototype.toString.call(searchItem.options) == '[object Array]'">
        <el-option
          v-for="subItem in searchItem.options"
          :key="subItem.value"
          :label="subItem.label"
          :value="subItem.value"
        >
          <div v-if="searchItem.show_value || searchItem.tip_key" class="option-show-id">
            <span>{{ subItem.label }}</span>
            <span class="tip-value">{{
              searchItem.tip_key ? subItem[searchItem.tip_key] : subItem.value
            }}</span>
          </div>
        </el-option>
      </template>
      <template v-else>
        <el-option
          v-for="(subItem, key) in searchItem.options"
          :key="key"
          :label="subItem"
          :value="key"
        >
          <div v-if="searchItem.show_value" class="option-show-id">
            <span>{{ subItem }}</span>
            <span class="tip-value">{{ key }}</span>
          </div>
        </el-option>
      </template>
    </el-select>
    <!-- remoteEvent是一个函数 自带参数query指向搜索的值 -->
    <el-select
      size="small"
      :style="searchItem.style"
      v-model="subValue"
      :multiple="!!searchItem.multiple"
      :is-multiple="!!searchItem.multiple"
      :collapse-tags="!!searchItem.multiple"
      v-if="searchItem.genre == 'selectRemoteSearch'"
      :clearable="searchItem.clearable || searchItem.clearable === undefined"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
      filterable
      remote
      reserve-keyword
      :placeholder="
        searchItem.placeholder
          ? searchItem.placeholder
          : '请搜索' + searchItem.label.substring(0, searchItem.label.length - 1)
      "
      :remote-method="searchItem.remoteEvent"
    >
      <el-option
        v-for="subItem in searchItem.options"
        :key="subItem.value"
        :disabled="subItem.disabled"
        :label="subItem.label"
        :value="subItem.value"
      >
        <div v-if="searchItem.show_value || searchItem.tip_key" class="option-show-id">
          <span>{{ subItem.label }}</span>
          <span class="tip-value">{{
            searchItem.tip_key ? subItem[searchItem.tip_key] : subItem.value
          }}</span>
        </div>
      </el-option>
    </el-select>

    <!-- select 下拉过多优化 -->
    <SelectRangeNumber
      v-if="searchItem.genre == 'select-rangeNumber'"
      v-model="subValue"
      :style="searchItem.style"
      :searchItem="searchItem"
      @click.native="clickSelect(searchItem.click, searchItem.model)"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
    ></SelectRangeNumber>

    <!-- 用户下拉 -->
    <UserRemoteSelect
      v-if="searchItem.genre == 'select-user'"
      ref="userSelectRef"
      v-model="subValue"
      v-bind="searchItem"
      :style="searchItem.style"
      :tipKey="searchItem.tipKey"
      :params="searchItem.params"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
    ></UserRemoteSelect>

    <el-cascader
      :style="searchItem.style"
      v-if="searchItem.genre == 'cascader'"
      v-model="subValue"
      :placeholder="
        searchItem.placeholder
          ? searchItem.placeholder
          : '请选择' + searchItem.label.substring(0, searchItem.label.length - 1)
      "
      @change="changeSelect(searchItem.change, searchItem.model[searchItem.model], $event)"
      :size="'small'"
      :props="searchItem.setProps || cascderProps"
      :options="searchItem.options"
      :clearable="'clearable' in searchItem ? searchItem.clearable : true"
      :show-all-levels="'showAllLevels' in searchItem ? searchItem.showAllLevels : true"
      filterable
    >
    </el-cascader>

    <!-- 账户级联选择器 -->
    <AccountCascader
      v-if="searchItem.genre == 'userCascader'"
      v-model="subValue"
      :style="searchItem.style"
      :placeholder="
        searchItem.placeholder
          ? searchItem.placeholder
          : '请选择' + searchItem.label.substring(0, searchItem.label.length - 1)
      "
      :setProps="searchItem.setProps"
      :options="searchItem.options"
      @expand-change="expand"
      collapse-tags
      filterable
      clearable
    ></AccountCascader>

    <el-date-picker
      size="small"
      :style="searchItem.style"
      v-if="searchItem.genre == 'dateYear'"
      v-model="subValue"
      type="year"
      value-format="yyyy"
      placeholder="请选择年份"
      style="width: 150px"
    ></el-date-picker>

    <el-date-picker
      size="small"
      :style="searchItem.style"
      v-if="searchItem.genre == 'daterange'"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
      v-model="subValue"
      value-format="yyyy-MM-dd"
      type="daterange"
      align="bottom"
      unlink-panels
      :clearable="!!searchItem.clearable"
      range-separator="-"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      :picker-options="searchItem.pickerOptions || pickerOptions"
    ></el-date-picker>

    <el-date-picker
      size="small"
      :style="searchItem.style"
      v-if="searchItem.genre == 'datetimerange'"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
      v-model="subValue"
      value-format="yyyy-MM-dd HH:mm:ss"
      type="datetimerange"
      align="bottom"
      unlink-panels
      :clearable="!!searchItem.clearable"
      range-separator="-"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      :picker-options="searchItem.pickerOptions || timePickerOptions"
    ></el-date-picker>

    <el-date-picker
      v-if="searchItem.genre == 'day'"
      size="small"
      :style="searchItem.style"
      :clearable="!!searchItem.clearable"
      v-model="subValue"
      value-format="yyyy-MM-dd"
      type="date"
      placeholder="选择日期"
      @change="changeSelect(!!searchItem.change ? searchItem.change : '', searchItem.model, $event)"
    ></el-date-picker>

    <el-date-picker
      v-if="searchItem.genre == 'month'"
      size="small"
      :style="searchItem.style"
      v-model="subValue"
      align="bottom"
      unlink-panels
      :clearable="!!searchItem.clearable"
      value-format="yyyy-MM"
      type="month"
      placeholder="选择月份"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
    ></el-date-picker>

    <quarter-picker
      v-if="searchItem.genre == 'quarter'"
      :subValue="subValue"
      :quarterType="searchItem.quarterType"
      @change="changeQuarter"
    ></quarter-picker>
  </div>
</template>

<script>
  import { defaultPickerOptions, defaultTimePickerOptions } from '@/utils/common/formatDate';

  export default {
    props: {
      value: {},
      searchItem: {
        type: Object,
      },
    },
    components: {
      // elSelectRange: () => import('@/components/Common/elSelectRange'),
      SelectRangeNumber: () => import('./Components/SelectRangeNumber.vue'),
      AccountCascader: () => import('./Components/AccountCascader.vue'),
      UserRemoteSelect: () => import('./Components/UserSelect.vue'),
      QuarterPicker: () => import('@/components/QuarterPicker/index.vue'),
    },
    data() {
      return {
        // subValue: null,
        normalProps: {
          checkStrictly: true,
          expandTrigger: 'hover',
        },
        cascderProps: {
          label: 'name',
          value: 'category_id',
        },
        pickerOptions: defaultPickerOptions(),
        timePickerOptions: defaultTimePickerOptions(),
        rangeSelectValid: false,
      };
    },
    mounted() {
      // this.subValue = this.value;
    },
    computed: {
      subValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        },
      },
    },
    watch: {
      subValue: {
        handler(newVal) {
          if (this.searchItem.genre == 'select-range') {
            this.vaildRange(newVal);
          }
        },
      },
    },
    methods: {
      onSubmit(itemKey) {
        this.$emit('onSubmit', itemKey);
      },
      clickSelect(event, model) {
        if (event) {
          this.$emit(event, model);
        }
      },
      changeSelect(event, model, val) {
        if (event) {
          this.$emit(event, model, val);
        }
      },
      handleRemote(event, model, val) {
        if (event) {
          this.$emit(event, model, val);
        }
      },
      // 区间校验
      vaildRange(params) {
        if (params[0] || params[1]) {
          this.$notify.closeAll();
          if (params[0] >= params[1]) {
            this.$notify.error('区间最小值不能大于等于最大值');
            this.rangeSelectValid = true;
          } else {
            this.rangeSelectValid = false;
          }
        }
        this.$emit('rangeValid', this.rangeSelectValid);
      },

      // 季度选择
      changeQuarter(val) {
        this.$emit('quarter', val);
      },

      resetSelect() {
        this.$refs.userSelectRef?.queryUserOpts(null);
      },
    },
  };
</script>

<style lang="scss" scoped>
  .sub-filter-component {
    display: inline-block;
    width: 215px;
    > :first-child {
      width: 100%;
    }
    .el-icon-search {
      cursor: pointer;
    }
  }
  // ::v-deep .el-range-editor--small .el-range-input {
  //   font-size: 12px;
  // }
</style>

<style lang="scss">
  .option-show-id {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    .tip-value {
      padding-left: 15px;
      font-size: 12px;
      color: #8492a6;
    }
  }

  .select-range {
    display: flex;
    align-items: center;
    .left-box {
      margin-left: 8px;
      position: relative;
      .triangle {
        position: absolute;
        top: -10px;
        left: 60%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #ed5565;
        content: '';
        opacity: 0;
        transition: opacity 0.3s;
      }
      .triangle.show {
        opacity: 1;
      }
    }
    // margin-right: 8px;
    // margin-bottom: 8px;
    // background-color: #e4e9ed;
    // border-radius: 4px;
    // .select-range-label {
    //   display: flex;
    //   align-items: center;
    //   justify-content: flex-start;
    //   margin: 0 8px;
    //   color: #606266;
    //   font-size: 13px;
    // }
    .base-font {
      // color: #606266;
      font-size: 13px;
    }
  }
</style>
