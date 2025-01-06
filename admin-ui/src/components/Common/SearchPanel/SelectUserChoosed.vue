<template>
  <el-select
    size="small"
    v-model="select"
    v-on="$listeners"
    clearable
    filterable
    remote
    reserve-keyword
    :remote-method="queryUserOpts"
    @change="onChange"
    @clear="reset"
    v-loading="loading"
  >
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
    </el-option>
  </el-select>
</template>

<script>
  import { userSelect } from '@/api/business/public';
  export default {
    props: {
      value: {},
      searchItem: {
        type: Object,
      },
    },
    components: {},
    data() {
      return {
        options: [],
        localData: {},
        loading: false,
      };
    },
    computed: {
      select: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        },
      },
    },
    methods: {
      /**
       * @description: 获取本地存储的数据
       * @return {*}
       */
      getLocalData() {
        this.loading = true; // 设置加载状态为 true
        if (sessionStorage.getItem(`selectUserParams_${this.searchItem.model}`)) {
          // 从 sessionStorage 中获取用户参数数据并解析
          this.localData = JSON.parse(
            sessionStorage.getItem(`selectUserParams_${this.searchItem.model}`),
          );
        } else {
          this.localData = {}; // 如果没有数据，初始化为空对象
        }
        if (sessionStorage.getItem(`selectUserOption_${this.searchItem.model}`)) {
          // 从 sessionStorage 中获取用户选项数据并解析
          this.options = JSON.parse(
            sessionStorage.getItem(`selectUserOption_${this.searchItem.model}`),
          );
        } else {
          this.options = []; // 如果没有数据，初始化为空数组
        }
        this.loading = false; // 设置加载状态为 false
      },
      /**
       * @description: 查询用户选项
       * @param {*} keyword 查询关键词
       * @return {*}
       */
      queryUserOpts(keyword = null) {
        let params = this.localData; // 获取本地数据作为参数
        if (keyword) params.keyword = keyword; // 如果有关键词，添加到参数中
        userSelect(params).then((res) => {
          // 将返回的数据映射为选项数组
          this.options = res.data.map((v) => ({
            value: v.value || v.id,
            label: v.label || v.name,
          }));
        });
      },
      /**
       * @description: 重置选择和选项
       * @return {*}
       */
      reset() {
        this.select = null; // 重置选择
        this.options = []; // 重置选项
        this.queryUserOpts(null); // 重新查询用户选项
      },
      /**
       * @description: 选择改变时的处理函数
       * @param {*} value 选择的值
       * @return {*}
       */
      onChange(value) {
        this.$emit('change', this.options, this.searchItem.model); // 触发 change 事件，传递选项和模型
      },
    },
    mounted() {
      this.getLocalData();
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep .el-input__inner {
    border: none;
    background-color: transparent;
  }
  ::v-deep .el-select {
    width: 115px;
    .el-input__inner {
      text-overflow: ellipsis;
    }
    &[is-multiple='true'] {
      width: 200px;
      .el-select__tags {
        > span :last-child {
          margin-right: 0;
        }
        .el-tag {
          display: inline-block;
          position: relative;
          max-width: calc(100% - 76px);
          margin: 0px 8px 0px 0px;
          padding-right: 8px;
          .el-select__tags-text {
            display: inline-block;
            text-overflow: ellipsis;
            width: 100%;
            font-size: 13px;
            overflow: hidden;
          }
          .el-tag__close {
            position: absolute;
            top: 2px; // 多选标签删除按钮
            right: -10px;
          }
        }
        .el-select__input {
          margin-left: 5px;
        }
      }
    }
  }
</style>
