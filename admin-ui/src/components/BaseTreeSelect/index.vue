<template>
  <el-row type="flex" :gutter="20" class="base-tree-select__wrapper">
    <!-- 选择框 -->
    <el-col :span="12">
      <el-card shadow="never" class="bts-left__wrapper bts-inner__wrapper">
        <!-- 顶部头栏 -->
        <template #header>
          <div class="bts-inner-header__wrapper">
            <el-input v-model="filterText" placeholder="输入筛选" size="mini"></el-input>
            <el-checkbox
              :indeterminate="isIndeterminate"
              v-model="checkAll"
              @change="handleCheckAllChange"
              >全选</el-checkbox
            >
          </div>
        </template>

        <!-- 选择树主体 -->
        <el-tree
          ref="formTreeRef"
          show-checkbox
          default-expand-all
          :data="formData"
          :props="defaultProps"
          :filter-node-method="filterNode"
        >
        </el-tree>
      </el-card>
    </el-col>

    <!-- 展示框 -->
    <el-col :span="12">
      <el-card shadow="never" class="bts-right__wrapper bts-inner__wrapper">
        <!-- 顶部头栏 -->
        <template #header>
          <div class="bts-inner-header__wrapper">
            <span>已选({{ selectedNum }})</span>
            <el-button type="primary" plain size="mini">清空</el-button>
          </div>
        </template>

        <!-- 展示树主体 -->
        <el-tree
          ref="toTreeRef"
          default-expand-all
          :data="toData"
          :props="defaultProps"
          :filter-node-method="filterNode"
        >
        </el-tree>

        <div></div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
  export default {
    props: {
      /** 树的数据 */
      data: {
        type: Array,
        default: () => [],
      },

      /** 树的指定显示指字段 */
      defaultProps: {
        type: Object,
        default: () => ({
          children: 'children',
          label: 'label',
        }),
      },
    },

    components: {},

    computed: {
      selectedNum() {
        return 0;
      },
    },

    watch: {
      filterText(val) {
        this.$refs.formTreeRef.filter(val);
      },
    },

    data() {
      return {
        // 左侧
        filterText: null,
        checkAll: false,
        isIndeterminate: false,
        formData: [
          {
            id: 1,
            label: '一级 1',
            children: [
              {
                id: 4,
                label: '二级 1-1',
                children: [
                  {
                    id: 9,
                    label: '三级 1-1-1',
                  },
                  {
                    id: 10,
                    label: '三级 1-1-2',
                  },
                ],
              },
            ],
          },
          {
            id: 2,
            label: '一级 2',
            children: [
              {
                id: 5,
                label: '二级 2-1',
              },
              {
                id: 6,
                label: '二级 2-2',
              },
            ],
          },
          {
            id: 3,
            label: '一级 3',
            children: [
              {
                id: 7,
                label: '二级 3-1',
              },
              {
                id: 8,
                label: '二级 3-2',
              },
              {
                id: 7,
                label: '二级 3-1',
              },
              {
                id: 8,
                label: '二级 3-2',
              },
              {
                id: 7,
                label: '二级 3-1',
              },
              {
                id: 8,
                label: '二级 3-2',
              },
              {
                id: 7,
                label: '二级 3-1',
              },
              {
                id: 8,
                label: '二级 3-2',
              },
              {
                id: 7,
                label: '二级 3-1',
              },
              {
                id: 8,
                label: '二级 3-2',
              },
            ],
          },
        ],

        // 右侧
        toData: [],
      };
    },

    methods: {
      // 左侧
      handleCheckAllChange(val) {
        this.checkedCities = val ? cityOptions : [];
        this.isIndeterminate = false;
      },

      /** 筛选 */
      filterNode(value, data) {
        if (!value) return true;
        return data.label.indexOf(value) !== -1;
      },
    },

    mounted() {},
  };
</script>

<style lang="scss" scoped>
  .base-tree-select__wrapper {
    ::v-deep {
        .el-card__body{
            height: 250px;
            max-height: 250px;
            overflow-y: auto;
        }
    }

    .bts-inner-header__wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

  }
</style>
