<template>
  <div
    id="baseTable"
    class="baseTable"
    :class="model == 'inline' ? 'inline_table' : ''"
    v-loading="loading"
  >
    <Header
      v-if="header"
      class="header"
      :columns="cal_columns"
      :columns-group="cal_columnsGroup"
      :columns-key="columnsKey"
      :size="size"
      :title="title"
      :un-fullscreen="unFullscreen"
      :un-refresh="unRefresh"
      :un-custom="unCustom"
      @refresh="$emit('refresh')"
      @calcTableHeight="calcTableHeight"
      @columnsChange="columnsChange"
    >
      <template #header_left>
        <slot name="header_left"></slot>
      </template>
      <template #header_right>
        <slot name="header_right"></slot>
      </template>
    </Header>

    <el-table
      ref="tableElRef"
      class="main"
      :border="border"
      :currentRowKey="currentRowKey"
      :data="data"
      :defaultExpandAll="defaultExpandAll"
      :expandRowKeys="expandRowKeys"
      :span-method="spanMethod"
      :height="cal_height"
      :highlight-current-row="cal_highlightCurrentRow"
      :maxHeight="maxHeight"
      :rowKey="rowKey"
      :show-header="showHeader"
      :size="size"
      :stripe="stripe"
      :row-class-name="rowClassName"
      @select="tableSelection"
      @selection-change="tableSelectionChange"
      v-bind="$attrs"
      v-on="$listeners"
      @sort-change="tableSortChange"
    >
      <!--  单选 -->
      <el-table-column v-if="exColumnsShow('radio')" width="40" fixed>
        <template slot-scope="{ row, $index }">
          <el-radio
            :label="row[rowKey]"
            :disabled="!selectDisable(row, $index)"
            @change="tableSelectionChange(row, 'radio', $index)"
            class="single_choice"
            v-model="singleChoiceValue"
          />
        </template>
      </el-table-column>

      <!-- 索引 -->
      <el-table-column
        type="index"
        :index="(index) => index + 1"
        v-if="exColumnsShow('index')"
        fixed
      />

      <!-- 多选 -->
      <el-table-column
        type="selection"
        width="55"
        align="center"
        :selectable="selectDisable"
        v-if="exColumnsShow('selection')"
        fixed
      />

      <!-- 展开 -->
      <el-table-column type="expand" v-if="exColumnsShow('expand')" fixed>
        <template slot-scope="{ row, column, $index }">
          <!-- slot默认内容的语法兼容 -->
          <slot v-if="$slots.expand" name="expand" :row="row" :columns="column" :index="$index">
          </slot>
          <template v-else>
            <el-empty description="暂无数据"></el-empty>
          </template>
        </template>
      </el-table-column>

      <template v-if="cal_columns && cal_columns.length">
        <template v-for="(item, index) in cal_columns">
          <!-- 操作列 -->
          <el-table-column
            v-if="item.prop == 'action' && (!item.hasOwnProperty('show') || item.show)"
            :align="item.align || 'center'"
            :fixed="item.fixed"
            :key="item.prop || index"
            :label="item.label || '操作'"
            :prop="item.prop"
            :width="item.width"
            :min-width="item.minWidth || '120'"
          >
            <template slot-scope="{ row, column, $index }">
              <slot v-if="$slots.action" name="action" :row="row" :column="column" :index="$index">
              </slot>
              <template v-else>
                <Action
                  v-if="item.actions && item.actions.length"
                  :item="item"
                  :row="row"
                  :column="column"
                  :index="$index"
                  @actionEmit="actionEmit"
                />
              </template>
            </template>
          </el-table-column>

          <!-- 嵌套单元格 -->
          <el-table-column
            v-else-if="item.children && item.children.length && item.show"
            :align="item.align"
            :fixed="item.fixed"
            :key="item.prop || index"
            :label="item.label"
            :min-width="item.minWidth"
            :prop="item.prop"
            :show-overflow-tooltip="item.tooltip"
            :width="item.width"
          >
            <template v-for="(child, index2) in item.children">
              <el-table-column
                v-if="!child.hasOwnProperty('show') || child.show != false"
                :align="child.align"
                :fixed="child.fixed"
                :key="child.prop || index2"
                :label="child.label"
                :min-width="child.minWidth"
                :prop="child.prop"
                :show-overflow-tooltip="child.tooltip"
                :width="child.width"
                :class-name="child.className"
                :sortable="child.sortable"
              >
                <template slot-scope="{ row, column, $index }">
                  <tableSlot
                    v-if="child.hasOwnProperty('slots') && isTableSlot(child.slots.customRender)"
                    :item="child"
                    :row="row"
                    :column="column"
                    :$index="$index"
                    @switch-change="switchChange"
                  ></tableSlot>

                  <slot
                    v-else-if="
                      child.hasOwnProperty('slots') &&
                      isTableSlot(child.slots.customRender) == false
                    "
                    :name="child.slots.customRender"
                    :row="row"
                    :columns="column"
                    :index="$index"
                  />

                  <span v-else> {{ row[column.property] }} </span>
                </template>

                <template v-if="child.children && child.children.length > 0">
                  <el-table-column
                    v-for="(sun, index3) in child.children"
                    :align="sun.align"
                    :fixed="sun.fixed"
                    :key="sun.prop || index3"
                    :label="sun.label"
                    :min-width="sun.minWidth"
                    :prop="sun.prop"
                    :show-overflow-tooltip="sun.tooltip"
                    :width="sun.width"
                    :class-name="sun.className"
                    :sortable="child.sortable"
                  >
                    <template slot-scope="{ row, column, $index }">
                      <tableSlot
                        v-if="sun.hasOwnProperty('slots') && isTableSlot(sun.slots.customRender)"
                        :item="sun"
                        :row="row"
                        :column="column"
                        :$index="$index"
                        @switch-change="switchChange"
                      ></tableSlot>

                      <slot
                        v-else-if="
                          sun.hasOwnProperty('slots') &&
                          isTableSlot(sun.slots.customRender) == false
                        "
                        :name="sun.slots.customRender"
                        :row="row"
                        :columns="column"
                        :index="$index"
                      />

                      <span v-else> {{ row[column.property] }} </span>
                    </template>
                  </el-table-column>
                </template>
              </el-table-column>
            </template>
          </el-table-column>

          <!-- 普通单元格 -->
          <el-table-column
            v-else-if="!item.hasOwnProperty('show') || item.show"
            :align="item.align"
            :fixed="item.fixed"
            :key="item.prop || index"
            :label="item.label"
            :min-width="item.minWidth"
            :prop="item.prop"
            :show-overflow-tooltip="item.tooltip"
            :width="item.width"
            :class-name="item.className"
            :sortable="item.sortable"
          >
            <template slot-scope="{ row, column, $index }">
              <tableSlot
                v-if="item.hasOwnProperty('slots') && isTableSlot(item.slots.customRender)"
                :item="item"
                :row="row"
                :column="column"
                :$index="$index"
                @switch-change="switchChange"
              ></tableSlot>

              <slot
                v-else-if="
                  item.hasOwnProperty('slots') && isTableSlot(item.slots.customRender) == false
                "
                :name="item.slots.customRender"
                :row="row"
                :columns="column"
                :index="$index"
              />

              <span v-else> {{ row[column.property] }} </span>
            </template>
          </el-table-column>
        </template>
      </template>

      <template slot="empty">
        <!-- slot默认内容的语法兼容 -->
        <slot v-if="$slots.empty" name="empty"></slot>
        <template v-else>
          <el-empty description="暂无数据"></el-empty>
        </template>
      </template>
    </el-table>

    <!-- 分页 -->
    <Pagination
      v-if="paginationShow"
      ref="paginationElRef"
      :useCount="useCount"
      :pagination="pagination"
      :background="background"
      :hideOnSinglePage="hideOnSinglePage"
      :layout="layout"
      :nextText="nextText"
      :pagerCount="pagerCount"
      :pageMode="pageMode"
      :pageSizes="pageSizes"
      :prevText="prevText"
      :small="small"
      @pagination-change="paginationChange"
      @look-count="$emit('look-count')"
    ></Pagination>
  </div>
</template>

<script>
//  BaseTable 参考示例为 示例
//  el-pagination的 pageSize total current 和 el-pagination 默认的不同 按照示例来
//  其他长度并无太大变化
//  el-table 原有的大部分均可使用 不可使用如下
//  highlightCurrentRow type
//  新的 type拥有参数 radio selection expand index 可以以字符串或者数组的形式来传递

import { isArray, cloneDeep, isEmpty } from 'lodash';
import { basicProps } from './props';
import { getViewportOffset } from './methods';
import Action from './src/action.vue';
import Header from './src/header.vue';
import Render from './src/render.vue';
import Pagination from './src/pagination.vue';
import tableSlot from './src/tableSlot.vue';

export default {
  components: {
    Action,
    Header,
    Render,
    Pagination,
    tableSlot,
    BaseCopy: () => import('@/components/BaseCopy/index.vue'),
    Infos: () => import('./components/Infos.vue'),
  },
  props: basicProps,
  data() {
    return {
      options: {
        target: '#baseTable',
        callback: (isFullscreen) => {
          this.calcTableHeight();
        },
        bodyEl: null,
      },
      isFullscreen: false,
      canHeight: null,
      singleChoiceValue: null,
      cus_columns: [], // 自定义列存储
    };
  },
  computed: {
    cal_columns() {
      let co = null;
      if (this.cus_columns && this.cus_columns.length) {
        co = this.columns.map((item, index) => {
          let flagChild = 0; // 用于判断父一级列下的所有children是否存在show为true，只要有一个show父级列show也为true
          // 更新原列中含有children下每一列的show值
          if (item.children && item.children.length) {
            item.children.forEach((child, index) => {
              this.cus_columns.some((el) => {
                if (el.children && el.children.length) {
                  el.children.forEach((cus_child, index) => {
                    if (cus_child.prop == child.prop) {
                      child.show = cus_child.show;
                      if (child.show) {
                        flagChild++;
                        el.show = true;
                      }
                    }
                  });
                }
              });
            });
          }
          // flag移至下方用于获取已经更改后的el
          let flag = this.cus_columns.filter((el) => el.prop == item.prop);
          return {
            ...item,
            // 新增判断当这一列有children时判断flagChild是否大于0来控制父一级的显隐
            show: (() => {
              if (flag.length) {
                if (flag.length == 1) {
                  return flag[0].show;
                } else if (flag.length > 1) {
                  if (item.children && item.children.length) {
                    // console.log(flagChild);
                    return flagChild > 0;
                  }
                } else {
                  return false;
                }
              } else {
                return true;
              }
            })(),
          };
        });
      } else {
        co = this.columns;
      }
      return co;
    },

    cal_columnsGroup() {
      return cloneDeep(this.columnsGroup);
    },

    cal_highlightCurrentRow() {
      // if (this.exColumnsShow("radio")) {
      //   return true;
      // }
      // return false;
      return false;
      // 不建议使用原有的行点击事单选这个事件;
    },

    cal_height() {
      return this.height || this.canHeight || null;
    },

    cal_pagination() {
      return cloneDeep(this.pagination);
    },
  },
  methods: {
    // ===================== table方法 =====================
    // 计算高度
    calcTableHeight() {
      if (!this.canResize) return;

      const maxHeight = 999;
      const table = this.$refs.tableElRef;
      const pagination = this.$refs.paginationElRef;

      if (!table) return;

      const tableEl = table.$el;
      if (!tableEl) return;

      let bodyEl = null;
      if (!bodyEl) {
        bodyEl = tableEl.querySelector('.el-table__body-wrapper');
        if (!bodyEl) return;
      }

      const hasScrollBarY = bodyEl.scrollHeight > bodyEl.clientHeight;
      const hasScrollBarX = bodyEl.scrollWidth > bodyEl.clientWidth;

      // bodyEl.style.height = 'unset';

      const headEl = tableEl.querySelector('.el-table__header-wrapper');
      if (!headEl) return;

      const { bottomIncludeBody } = getViewportOffset(headEl);

      const paddingHeight = 24;

      let paginationHeight = 0;

      if (pagination) {
        const paginationEl = pagination.$el;
        if (paginationEl) {
          const offsetHeight = paginationEl.offsetHeight;
          paginationHeight += offsetHeight || 0;
        } else {
          paginationHeight += 24;
        }
      } else {
        paginationHeight = 0;
      }

      let headerHeight = 0;
      // if (headEl) headerHeight = headEl.offsetHeight;

      let height = bottomIncludeBody - 0 - paddingHeight - paginationHeight - headerHeight;

      height = (height > maxHeight ? maxHeight : height) ?? height;
      this.canHeight = height < this.minHeight ? this.minHeight : height;
      // bodyEl.style.height = `${height - headerHeight}px`;

      const baseTableEl = document.getElementById('baseTable');
      if (baseTableEl) {
        let tableWithHeaderHeight = baseTableEl.getBoundingClientRect().height;
        this.$emit('heightChange', tableWithHeaderHeight);
      }
    },

    // ===================== slot 内部方法 =====================
    // 时间处理
    // getDateTime(time) {
    //   if (typeof time == "number") {
    //     return moment(time * 1000).format("YYYY-MM-DD HH:mm");
    //   } else if (!isEmpty(time)) {
    //     return moment(time).format("YYYY-MM-DD HH:mm");
    //   } else {
    //     return "";
    //   }
    // },
    switchChange(row, column, index) {
      this.$emit('switch-change', row, column, index);
    },

    isTableSlot(val) {
      if (
        ['tag', 'link', 'infos', 'switch', 'dateTime', 'progress', 'money', 'rate', 'statusComps', 'imageComps'].includes(val)
      ) {
        return true;
      } else if (typeof val == 'function') {
        return true;
      } else {
        return false;
      }
    },

    // ===================== 表格 =====================
    // radio selection expand index 是否展示
    exColumnsShow(name) {
      if (this.type) {
        if (typeof this.type == 'string') {
          if (name == this.type) return true;
          else return false;
        } else if (isArray(this.type)) {
          if (this.type.includes(name)) return true;
          else return false;
        } else {
          console.error('BaseTable中传入的type类型只能为Array或String,允许');
          return false;
        }
      } else {
        return false;
      }
      x;
    },
    selectDisable(row, index) {
      if (this.selectable) {
        return this.selectable(row, index);
      } else {
        return true;
      }
    },
    // 选中回调
    tableSelectionChange(val, type, index) {
      if (type == 'radio') {
        this.singleChoiceValue = val[this.rowKey];
      }
      this.$emit('select-change', val, index);
    },
    tableSelection(selection, row, index) {
      this.$emit('select-click', selection, row, index);
    },
    // 操作列回调函数
    actionEmit(eName, row, column, $index) {
      // console.log(eName, row, column, $index);
      this.$emit(eName, row, column, $index);
    },

    // ===================== 分页变化 =====================
    paginationChange(data) {
      Object.entries(data).forEach(([key, value]) => {
        this.$set(this.pagination, key, value);
      });
      this.$emit('pagination-change', data);
    },
    // paginationSizeChange(val) {
    //   let data = JSON.parse(JSON.stringify(this.cal_pagination));
    //   data.pagesize = val;
    //   this.pagination.pagesize = val;
    //   this.$emit('pagination-change', data);
    // },
    // paginationCurrentChange(val) {
    //   let data = JSON.parse(JSON.stringify(this.cal_pagination));
    //   data.page = val;
    //   this.pagination.page = val;
    //   this.$emit('pagination-change', data);
    // },

    // ===================== 列变化 =====================
    columnsChange(data) {
      this.cus_columns = [];
      this.$set(
        this,
        'cus_columns',
        data,
        // data.filter((item) => item.show)
      );
      this.$emit('columns-change', data);
      this.$nextTick(() => {
        this.$refs.tableElRef.doLayout();
      });
    },
    tableSortChange(data) {
      this.$emit('sort-change', data);
    },

    // 多选时默认选中项
    defaultChecked() {
      if (this.exColumnsShow('selection')) {
        var that = this;
        that.$nextTick(() => {
          this.data.forEach((v, i) => {
            if (v.checkboxFlag) {
              this.$refs.tableElRef.toggleRowSelection(v, true);
            }
          });
        });
      }
    },
  },
  mounted() {
    // 自适应高度
    if (this.canResize) {
      this.$nextTick(() => {
        /**
         * 由于 basetable 经常和其他的 兄弟组件（如：searchPanel）使用
         * 但是又无法监听同页面兄弟组件的渲染进度，有时出现高度计算错误的问题
         * V-DOM渲染是微任务、为确保【初次执行高度计算】一定在整个页面DOM渲染完成之后执行，使用宏任务 
         * */
        setTimeout(this.calcTableHeight, 0)
        window.addEventListener('resize', this.calcTableHeight, true);
      });
    }
    this.defaultChecked();
  },
  beforeDestroy() {
    if (this.canResize) {
      window.removeEventListener('resize', this.calcTableHeight, false);
    }
  },
  watch: {
    data: {
      handler() {
        this.defaultChecked();
        //  数据在变化的时候 会出现行错乱
        this.$nextTick(() => {
          this.$refs.tableElRef.doLayout();
        });
      },
      immediate: true,
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.baseTable {
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e6ebf5;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  padding: 6px 12px;
  .header {
    padding-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .main {
    width: 100%;
    box-sizing: content-box;
  }
  .pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
  }
}

.inline_table {
  border: unset !important;
  box-shadow: unset !important;
  padding: 0 !important;
}

.el-tag {
  margin: 2px 0 0 2px;
  & + .el-tag {
    margin: 2px 0 0 2px;
  }
}

::v-deep .el-link {
  font-size: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
}

.single_choice {
  ::v-deep .el-radio__label {
    display: none;
  }
}

::v-deep .el-table__fixed {
  background: #ffffff;
}
::v-deep .el-table__fixed-right {
  background: #ffffff;
}
</style>
