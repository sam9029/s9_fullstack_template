<template>
  <div v-if="pagination">
    <el-pagination
      v-if="useCount"
      class="pagination"
      :background="background"
      :current-page="pagination.page"
      :hideOnSinglePage="hideOnSinglePage"
      :layout="layout"
      :nextText="nextText"
      :page-size="pagination.pagesize"
      :pagerCount="pagerCount"
      :pageSizes="pageSizes"
      :prevText="prevText"
      :small="small"
      :total="pagination.count"
      @current-change="paginationCurrentChange"
      @size-change="paginationSizeChange"
    ></el-pagination>

    <div class="pagination2" v-else>
      <el-popover class="lookcount" placement="bottom" width="160" trigger="click">
        <p
          >总数：<span v-if="!pagination.loading">{{ pagination.count }}</span
          ><i v-if="pagination.loading" class="el-icon-loading"></i
        ></p>
        <el-button @click="lookCount" slot="reference">查看总数</el-button>
      </el-popover>
      <div class="pagination-jump ml10 mr10">
        <p>每页</p>
        <el-select
          type="text"
          placeholder="请选择分页大小"
          v-model="pagination.pagesize"
          class="ml5 mr5"
          style="width: 50px"
          @change="paginationSizeChange"
        >
          <el-option v-for="item in pageSizes" :key="item" :label="item" :value="item"> </el-option>
        </el-select>
        <p>条</p>
      </div>
      <div v-if="pageMode == 'page'" class="pagination-jump ml10 mr10">
        <p>跳转</p>
        <el-input
          type="text"
          placeholder="请输入跳转页数"
          v-model.number="pagination.page"
          class="ml5 mr5"
          style="width: 50px"
          @change="jumpPageChange"
        >
        </el-input>
        <p>页</p>
      </div>
      <el-button-group>
        <el-button
          :disabled="pagination.page == 1"
          type="primary"
          icon="el-icon-arrow-left"
          @click="previousPageChange"
          >上一页</el-button
        >
        <el-button :disabled="!pagination.next" type="primary" @click="nextPageChange"
          >下一页<i class="el-icon-arrow-right el-icon--right"></i
        ></el-button>
      </el-button-group>
    </div>
  </div>
</template>


<script>
import { paginationProps } from '../props';
export default {
  props: paginationProps,
  methods: {
    emitPaginationChange(data) {
      // this.$emit('update:pagination', data);
      this.$emit('pagination-change', data);
    },
    paginationCurrentChange(val) {
      const data = { ...this.pagination, page: val };
      this.emitPaginationChange(data);
    },
    paginationSizeChange(val) {
      const data = { ...this.pagination, pagesize: val, page: 1 };
      this.emitPaginationChange(data);
    },
    previousPageChange() {
      const data = { ...this.pagination };
      data.page = Math.max(data.page - 1, 1);
      this.emitPaginationChange(data);
    },
    nextPageChange() {
      const data = { ...this.pagination };
      data.page = Number(data.page) + 1;
      this.emitPaginationChange(data);
    },
    lookCount() {
      this.$emit('look-count');
    },
    jumpPageChange(val) {
      const data = { ...this.pagination, page: val };
      // data.page = data.page + 1;
      this.emitPaginationChange(data);
    },
  },
};
</script>

<style lang="scss" scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}
.pagination2 {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}
.lookcount {
  margin: 0 20px;
}
.pagination-jump {
  font-size: 12px;
  color: #606266;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  ::v-deep .el-input__inner {
    padding: 0 !important;
    text-align: center;
  }
  ::v-deep .el-input__suffix {
    display: none;
  }
}
</style>