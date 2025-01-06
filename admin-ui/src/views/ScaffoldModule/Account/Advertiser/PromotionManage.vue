<template>
  <BaseDrawer :title="title" size="800px" :visible.sync="visible" @close="close">
    <div class="table-wrapper h-100">
      <BaseTable
        class="h-100"
        un-fullscreen
        un-refresh
        un-custom
        :pagination="pagination"
        :columns="columns"
        :data="data"
        :loading="loading"
        @handleEdit="handleEdit"
        @pagination-change="getTableData(false)"
      >
        <template #header_left>
          <el-button type="primary" @click="handleAdd">新增</el-button>
        </template>
        <template #status="{ row }">
          <el-switch v-model="row.status_copy" @change="editFlag(row)"></el-switch>
        </template>
      </BaseTable>
    </div>

    <BaseDialog title="推广类目" append-to-body :visible.sync="dialogShow" @close="dialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="推广类目" prop="name">
          <el-input v-model="form.name" placeholder=""></el-input>
        </el-form-item>
      </el-form>
      <template slot="footer">
        <el-button @click="dialogClose">取 消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="dialogSubmit"> 确 定 </el-button>
      </template>
    </BaseDialog>

    <span slot="footer"></span>
  </BaseDrawer>
</template>

<script>
import {
  adverPromoteList,
  adverPromoteAdd,
  adverPromoteSave,
} from '@/api/account/advertiser/advertiser.js';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseDrawer from '@/components/BaseDrawer/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';
import { promoteColumns } from './data';

export default {
  components: {
    BaseDrawer,
    BaseDialog,
    BaseTable,
  },
  data() {
    return {
      columns: promoteColumns,
      visible: false,
      title: "推广类目",
      id: null,
      pagination: { pagesize: 20, count: 0, page: 1 },
      data: [],
      loading: false,
      dialogShow: false,
      dialogLoading: false,
      form: {
        id: null,
        name: '',
      },
      rules: {
        name: [{ required: true, message: '请输入推广类目名称', trigger: 'blur' }],
      },
    };
  },
  methods: {
    open(row) {
      this.id = row.id;
      this.title = `推广类目 - ${row.name}`
      this.getTableData(true);
      this.visible = true;
    },
    close() {
      this.data = [];
      this.loading = false;
      this.visible = false;
    },
    handleAdd() {
      this.form = {
        id: null,
        name: '',
      };
      this.dialogShow = true;
    },
    handleEdit(row) {
      this.form = {
        id: row.id,
        name: row.name,
      };
      this.dialogShow = true;
    },
    dialogClose() {
      this.dialogShow = false;
      this.form = {
        id: null,
        name: '',
      };
      this.dialogLoading = false;
      this.$refs.formRef.clearValidate();
    },
    dialogSubmit() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.dialogLoading = true;
          const params = { ...this.form, advertiser_type: this.id };
          let func = params.id ? adverPromoteSave : adverPromoteAdd;
          func(params)
            .then((data) => {
              this.dialogLoading = false;
              this.$notify.success('保存成功！');
              this.dialogClose();
              this.getTableData(false);
            })
            .catch((err) => {
              this.dialogLoading = false;
              this.$notify.error(err.message || err);
            });
        }
      });
    },
    getTableData(reset) {
      if (reset) this.pagination.page = 1;
      const params = {
        advertiser_type: this.id,
        ...this.pagination,
      };
      this.loading = true;
      adverPromoteList(params)
        .then((data) => {
          this.loading = false;
          this.pagination.count = data.count;
          this.data = data.data.map(this.formatItem);
        })
        .catch((err) => {
          this.loading = false;
          this.$notify.error(err.message || err);
        });
    },
    formatItem(item) {
      item.status_copy = item.status == 1;
      return item;
    },
    editFlag(row) {
      const newStatus = row.status_copy ? 1 : 3;
      const oldStatus = !row.status_copy;
      const params = {
        id: this.id,
        status: newStatus,
      };
      adverPromoteSave(params)
        .then((data) => {
          this.$notify.success('操作成功！');
          this.getTableData();
        })
        .catch((err) => {
          this.$notify.error(err.message || err || '操作失败！');
          row.status_copy = oldStatus;
        });
    },
  },
};
</script>


<style lang="scss" scoped>
.table-wrapper {
  padding: 10px;
  height: 100%;
}
.h-100 {
  height: 100%;
}
</style>