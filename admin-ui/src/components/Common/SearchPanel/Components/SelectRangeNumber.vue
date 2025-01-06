<template>
  <el-select
    size="small"
    :multiple="!!searchItem.multiple"
    :is-multiple="!!searchItem.multiple"
    :filterable="true"
    :collapse-tags="!!searchItem.multiple"
    v-model="baseValue"
    v-on="$listeners"
    v-bind="$attrs"
    :placeholder="placeholder"
    :clearable="true"
    v-el-select-loadmore="loadMore"
    :filter-method="searchItem.filterMethod || defaultRangeNumberFilter"
    @visible-change="visibleChange"
  >
    <el-option
      v-for="subItem in filterRangeOptions"
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
  </el-select>
</template>

<script>
  export default {
    props: {
      value: {},
      searchItem: Object,
    },
    data() {
      return {
        filterOps: null,
      };
    },
    computed: {
      baseValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        },
      },
      placeholder() {
        if (this.searchItem.placeholder) return this.searchItem.placeholder;
        if (this.searchItem.label) {
          return '请选择' + this.searchItem.label.substring(0, this.searchItem.label.length - 1);
        }
        return '请选择';
      },
      filterRangeOptions() {
        const options = this.filterOps || this.searchItem.options;
        const withShowOptions = this.showSelectOptions(options);
        return withShowOptions.slice(0, this.searchItem.rangeNumber);
      },
    },
    methods: {
      loadMore() {
        // n是默认初始展示的条数会在渲染的时候就可以获取,具体可以打log查看
        // elementui下拉超过7条才会出滚动条,如果初始不出滚动条无法触发loadMore方法
        // 每次滚动到底部可以新增条数  可自定义
        this.searchItem.rangeNumber += 5;
      },
      defaultRangeNumberFilter(key) {
        if (key) {
          this.filterOps = this.searchItem.options.filter((v) => v.label?.includes(key));
        } else {
          this.filterOps = this.searchItem.options.slice();
        }
        this.searchItem.rangeNumber = 20;
      },
      visibleChange(dropdownShow) {
        if (!dropdownShow) {
          this.defaultRangeNumberFilter();
        }
      },
      showSelectOptions(options = []) {
        if (!Array.isArray(options) && process.env.NODE_ENV === 'development') {
          console.error(
            `select-range-number type error: ${this.searchItem.label} options is not Array!`,
          );
        }
        if (this.value) {
          if (Array.isArray(this.value) && !this.value.length) return options;

          let arr = this.value;
          if (!Array.isArray(arr)) arr = [arr];

          const withShowOptions = [];
          for (let i = 0; i < options.length; i++) {
            if (arr.includes(options[i].value)) {
              withShowOptions.unshift(options[i]);
            } else {
              withShowOptions.push(options[i]);
            }
          }
          return withShowOptions;
        }
        return options;
      },
    },
  };
</script>
