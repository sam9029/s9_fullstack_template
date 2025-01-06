<template>
  <div class="combine-datepicker-wrapper mr10">
    <el-select v-model="combineDatePickerItemKey" @change="handleKeyChange">
      <el-option
        v-for="item in combineDatePicker"
        :key="item.model"
        :label="item.label"
        :value="item.model"
      ></el-option>
    </el-select>
    <el-date-picker
      size="small"
      :style="searchItem.style"
      @change="changeSelect(searchItem.change, searchItem.model, $event)"
      v-model="combineDatePickerValue"
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
  </div>
</template>

<script>
  import { defaultPickerOptions } from '@/utils/common/formatDate';

  export default {
    components: {},
    props: {
      combineDatePicker: Array,
      combineDatePickerItemKey: String,
      combineDatePickerValue:Array,
    },
    data() {
        return {
            pickerOptions: defaultPickerOptions(),
        };
    },
    computed: {
      searchItem() {
        let temp = null;
        this.combineDatePicker.forEach((item) => {
          if (item.model === this.combineDatePickerItemKey) {
            temp = {
              style: null,
              change: null,
              clearable: true,
              ...item,
            };
          }
        });
        return temp;
      },
    },
    methods: {
      handleKeyChange(val) {
        this.$emit('update:combineDatePickerItemKey', val);
      },
      changeSelect(event, model, val) {
        this.$emit('update:combineDatePickerValue', val);
        if (event) {
          this.$emit(event, model, val);
        }
      },
    },
    mounted() {},
  };
</script>

<style lang="scss" scoped>
  .combine-datepicker-wrapper {
    // margin-top: -1px;

    .el-select {
      width: 110px;
      ::v-deep {
        .el-input__inner {
          background-color: #e4e9ed;
          border-right: none;
          border-top-right-radius: unset;
          border-bottom-right-radius: unset;
          //   vertical-align: bottom;
        }
      }
    }
    ::v-deep {
      .el-date-editor.el-range-editor {
        width: 240px;
        border-left: none;
        border-top-left-radius: unset;
        border-bottom-left-radius: unset;
        vertical-align: bottom;

        .el-input__inner {
          // margin-top: 1px;
          border-right: none;
        }
      }
    }
  }
</style>
