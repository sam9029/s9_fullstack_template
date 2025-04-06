<template>
  <div v-loading="treeListLoading" class="tree-transfer__wrapper">
    <div class="el-left">
      <div class="el-left-header">
        <div class="el-header-info">
          <div>{{ titles[0] }}</div>
          <div class="el-header-btn">
            <el-checkbox :indeterminate="indeterminate" v-model="checkedAll"> 全选 </el-checkbox>
            <el-link v-if="!showRightTable" type="primary" :underline="false" @click="clearSelect"
              >清空</el-link
            >
          </div>
        </div>
        <div class="search-tool">
          <el-input placeholder="输入关键字进行过滤" v-model="filterText" clearable></el-input>
        </div>
      </div>

      <el-scrollbar class="scrollbar-change">
        <el-tree
          ref="treeLeft"
          class="tree-change"
          show-checkbox
          highlight-current
          :data="dataLeft"
          :node-key="nodeKey"
          :props="defaultProps"
          :filter-node-method="filterNode"
          :default-expand-all="expandAllNode"
          @check="handleCheckChange"
        >
        </el-tree>
      </el-scrollbar>
    </div>

    <div class="el-right" v-if="showRightTable">
      <div class="el-right-header">
        <div class="el-header-info">
          <span>{{ titles[1] }}</span>
          <el-link type="primary" :underline="false" @click="clearSelect">清空</el-link>
        </div>
      </div>

      <el-scrollbar class="scrollbar-change">
        <el-tree
          ref="treeRight"
          class="tree-change"
          highlight-current
          :data="dataRight"
          :node-key="nodeKey"
          :props="defaultProps"
          default-expand-all
        >
        </el-tree>
      </el-scrollbar>
    </div>
  </div>
</template>

<script>
  import { extractSelectedNodes } from './utils';

  export default {
    model: {
      prop: 'value',
      event: 'EmitModelValueChange',
    },

    components: {},

    props: {
      value: {
        type: [Array, null],
        default: () => [],
      },

      titles: {
        type: Array,
        default: () => ['待选项', '已选项'],
      },

      sourceData: {
        type: Array,
        default: () => [],
      },

      nodeKey: {
        type: String,
        default: 'id',
      },

      defaultProps: {
        type: Object,
        default: {
          label: 'label',
          children: 'children',
        },
      },

      expandAllNode: {
        type: Boolean,
        default: true,
      },

      showRightTable: {
        type: Boolean,
        default: true,
      },
    },

    computed: {},

    data() {
      return {
        isIndeterminate: false, // UN 为想到好的逻辑暂未写
        checkedAll: false,

        filterText: '',
        dataLeft: [],
        dataRight: [],

        cate: '',
        isTrue: true,
        status_text: '',
        treeListLoading: false,
      };
    },

    watch: {
      // 监听 value 的变化, 主要是回显
      value: {
        handler(newVal, oldVal) {
          /** 前后值不一致触发变更 */
          if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
            this.setLeftTreeChecked(newVal);
          }
        },
        immediate: true,
      },

      sourceData: {
        handler(n, o) {
          this.dataLeft = n;
        },
        deep: true,
        immediate: true,
      },

      checkedAll(val) {
        // 全选
        if (val) this.setAllChecked();
        // 全不选
        else this.setLeftTreeChecked([]);
      },

      filterText(val) {
        this.$refs.treeLeft.filter(val);
      },
    },

    computed: {},
    methods: {
      syncModelValue() {
        // 所有被选中的key值（不包含半选节点）
        let data = this.$refs.treeLeft?.getCheckedKeys();
        this.$emit('EmitModelValueChange', data);
      },

      handleCheckChange(checkedNodes, checkedKeys, halfCheckedNodes, halfCheckedKeys) {
        this.syncModelValue();
      },

      randerRightTree() {
        // 所有被选中的节点 key值（不包含半选节点）
        const keys = this.$refs.treeLeft?.getCheckedKeys();
        // 所有被选中半选节点的 key值
        const halfKeys = this.$refs.treeLeft?.getHalfCheckedKeys();

        const allKeys = [...keys, ...halfKeys];

        this.dataRight = extractSelectedNodes(this.dataLeft, allKeys);
      },

      setAllChecked() {
        /** 拿到所有的顶级父节点key */
        const allKeys = this.dataLeft.map((item) => item[this.nodeKey]);
        this.setLeftTreeChecked(allKeys);
      },

      setLeftTreeChecked(checkedKeys = []) {
        this.$nextTick(() => {
          this.$refs.treeLeft?.setCheckedKeys(checkedKeys);
          // 触发右侧树形渲染
          this.randerRightTree();
          // 触发数据变更
          this.syncModelValue();
        });
      },

      clearSelect() {
        this.checkedAll = false;
        this.dataRight = [];
        this.setLeftTreeChecked([]);
        this.syncModelValue();
      },

      filterNode(value, data) {
        if (!value) return true;
        if (
          (data.id && data.id.toString().includes(value)) ||
          (data.pid && data.pid.toString().includes(value))
        ) {
          return true;
        }
        return data.label.toLowerCase().includes(value.toLowerCase());
      },
    },
    created() {},
    mounted() {},
  };
</script>

<style lang="scss" scoped>
  .tree-transfer__wrapper {
    display: flex;
    gap: 15px;

    .el-left,
    .el-right {
      width: 400px;
      flex: 1 1 auto;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      min-height: 300px;
      max-height: 500px;

      .scrollbar-change {
        height: 100%;
        width: 100%;
        background-color: #fff;
        border-radius: 5px;
      }
    }

    .el-left-header,
    .el-right-header {
      padding: 3px;
      background-color: #f5f7fa;
      border-bottom: 1px solid #dcdfe6;

      .el-header-info {
        padding: 0 10px;
        display: flex;
        justify-content: space-between;

        .el-header-btn {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          align-items: center;
        }
      }

      .search-tool {
        .el-input {
          width: 100% !important;
        }
      }
    }

    .el-scrollbar__wrap {
      overflow-x: hidden;
    }

    .city-middle {
      padding: 60px 20px;
      .middle-left {
        display: block;
        margin-top: 10px;
        margin-left: 0;
      }
      .middle-right {
        display: block;
        margin-right: 0;
      }
      .middle-left,
      .middle-right {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        padding: 0;
      }
    }

    .el-radio-group {
      font-size: 14px;
      margin: 13px auto;
      float: left;
    }
    ::v-deep .el-tree-node__content {
      height: unset;
      white-space: normal;
    }
  }
</style>
