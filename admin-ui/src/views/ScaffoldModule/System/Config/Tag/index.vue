<template>
  <div>
    <SearchPanel :search="search" @onSubmit="searchSubmit" @onReset="searchReset"></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="list"
      :loading="tableLoading"
      :pagination="pagination"
      @refresh="queryList(false)"
      @switch-change="toggleStatus"
      @handleDelete="handleDelete"
      @handleUpdate="handleUpdate"
    >
      <template #header_left>
        <el-button
          type="primary"
          @click="addNew"
          :disabled="!$checkPermi(['sys:config:tag:add'])"
          >新增标签</el-button
        >
      </template>
    </BaseTable>

    <BaseDialog title="作品标签" :visible.sync="visible" width="600px" @close="close">
      <el-form class="left-align-form" label-width="80px">
        <el-form-item label="标签名称" required>
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="close">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submit">确 定</el-button>
      </span>
    </BaseDialog>
  </div>
</template>

<script>
  import SearchPanel from '@/components/Common/SearchPanel';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseTable from '@/components/BaseTable/index.vue';
  import { list, create, remove, update, updateStatus } from '@/api/system/tag.js';
  import { STATUS_OPTIONS } from '@/utils/mapper.js';
  import { columns } from './data';

  export default {
    components: {
      SearchPanel,
      BaseTable,
      BaseDialog,
    },
    data() {
      return {
        search: {
          model: {
            keyword: '',
            status: '',
          },
          item: [
            {
              genre: 'input',
              label: '标签名称：',
              model: 'keyword',
              placeholder: '请输入标签名称或ID',
            },
            {
              genre: 'select',
              label: '状态：',
              model: 'status',
              options: STATUS_OPTIONS,
            },
          ],
        },
        columns: columns,
        list: [],
        pagination: { pagesize: 20, count: 0, page: 1 },
        tableLoading: false,
        form: {
          id: null,
          name: '',
          remark: '',
        },
        visible: false,
        submitLoading: false,
      };
    },
    methods: {
      searchSubmit() {
        this.queryList(true);
      },
      searchReset() {
        this.search.model = {
          keyword: '',
          status: '',
        };
        this.searchSubmit();
      },
      queryList(reset) {
        if (reset) {
          this.pagination.page = 1;
        }
        const params = {
          ...this.search.model,
          ...this.pagination,
        };
        this.tableLoading = true;
        this.list = [];
        list(params)
          .then((data) => {
            this.tableLoading = false;
            this.list = data.data.map((v) => {
              v.flag = v.status == 1 ? 1 : 2;
              return v;
            });
            this.pagination.count = data.count;
          })
          .catch((err) => {
            this.tableLoading = false;
          });
      },
      addNew() {
        this.visible = true;
      },
      toggleStatus(row) {
        const old = row.flag == 1 ? 2 : 1;
        const params = { ids: [row.id], status: row.flag };
        updateStatus(params)
          .then(() => {
            this.$notify.success('操作成功！');
            this.queryList(false);
          })
          .catch((err) => {
            row.flag = old;
            this.$notify.error('操作失败！');
          });
      },
      handleDelete(row) {
        this.$confirm(`确认删除标签 ${row.name} ?`, '提示', {
          type: 'warning',
          callback: (action) => {
            if (action == 'confirm') {
              remove({ ids: [row.id] })
                .then(() => {
                  this.$notify.success('操作成功！');
                  this.queryList(false);
                })
                .catch((err) => {
                  this.$notify.error(err.message || err || '操作失败！');
                });
            }
          },
        });
      },
      handleUpdate(row) {
        this.form.id = row.id;
        this.form.name = row.name;
        this.form.remark = row.remark;
        this.visible = true;
      },
      submit() {
        const { id, name } = this.form;
        if (!name) return this.$notify.warning('请输入标签名称！');
        const func = id ? update : create;
        this.submitLoading = true;
        func(this.form)
          .then(() => {
            this.submitLoading = false;
            this.$notify.success('保存成功！');
            this.searchSubmit();
            this.close();
          })
          .catch((err) => {
            this.submitLoading = false;
            this.$notify.error(err.message || err || '保存失败！');
          });
      },
      close() {
        this.visible = false;
        this.form = { id: null, name: '', remark: '' };
      },
    },
    mounted() {
      this.searchSubmit();
    },
  };
</script>

<style lang="scss" scoped></style>
