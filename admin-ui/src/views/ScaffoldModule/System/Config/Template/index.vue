<template>
  <div>
    <SearchPanel
      :showAll="true"
      :search="search"
      @onSubmit="handleQuery"
      @onReset="resetQuery"
    ></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="tableData"
      :loading="tableLoading"
      :pagination="pagination"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      @handleDelete="handleDelete"
      @handleUpdate="handleUpdate"
      @switch-change="handleStatusChange"
      @refresh="getTableData()"
      @pagination-change="paginationChange"
    >
      <template #header_left>
        <!-- 左上按钮区域默认插槽 -->
        <UploadTemplate
          title="上传模板"
          @uploadOk="getTableData"
          :disabled="!$checkPermi(['sys:config:template:upload'])"
        />
      </template>
    </BaseTable>

    <BaseDialog
      :title="title"
      :visible.sync="visible"
      width="380px"
      :loading="dialogLoading"
      :ok-loading="dialogOkLoading"
      @visible-change="visibleChange"
      v-if="visible"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="100px" class="demo-ruleForm">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script>
  import { columns } from './data';
  import { getTemplatelist, templateEdit } from '@/api/public.js';
  import { STATUS_OPTIONS } from '@/utils/mapper.js';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseTable from '@/components/BaseTable/index.vue';
  import SearchPanel from '@/components/Common/SearchPanel';
  import UploadTemplate from '@/components/Upload/template/index.vue';

  export default {
    name: 'Template',
    components: { SearchPanel, BaseTable, BaseDialog, UploadTemplate },
    data() {
      return {
        search: {
          model: {
            name: null,
            status: null,
          },
          item: [
            {
              genre: 'input',
              label: '模版名称：',
              model: 'name',
            },
            {
              genre: 'select',
              label: '状态：',
              model: 'status',
              options: STATUS_OPTIONS,
            },
          ],
        },
        pagination: { pagesize: 20, count: 0, page: 1 },
        columns: columns,
        tableData: [],
        tableLoading: false,

        title: '',
        form: {
          name: undefined,
        },
        rules: {
          name: { required: true, message: '请输入模板名称', trigger: 'blur' },
        },
        visible: false,
        dialogOkLoading: false,
        dialogLoading: false,

        // 菜单树选项
        menuOptions: [],
      };
    },
    created() {},
    methods: {
      getTableData() {
        this.tableLoading = true;
        getTemplatelist({ ...this.search.model, ...this.pagination })
          .then((data) => {
            this.pagination.count = data.count || 0;
            this.pagination.page = data.page || 0;
            this.pagination.pagesize = data.pagesize || 0;
            this.tableData = data.data;
            this.tableLoading = false;
          })
          .catch(() => {
            this.tableLoading = false;
          });
      },
      handleQuery() {
        this.getTableData();
      },
      resetQuery() {
        this.search.model = {
          name: null,
          status: null,
        };
        this.handleQuery();
      },

      visibleChange(val, type) {
        // console.log(val);
        if (type == 'ok') {
          this.submitForm();
        }
        this.visible = val;
      },

      handleUpdate(row) {
        this.title = '修改';
        this.form.id = row.id;
        this.form.name = row.name;
        this.visible = true;
      },

      handleDelete(row) {
        let { id, status } = row;
        let val = null,
          title = null;
        if (status == 1) {
          (val = 3), (title = '删除');
        }
        if (status == 2) {
          (val = 1), (title = '启用');
        }
        if (status == 3) {
          (val = 1), (title = '恢复');
        }
        templateEdit({ id, status: val })
          .then((res) => {
            if (res.code == 0) {
              this.$notify.success(title + '成功');
              this.getTableData();
            } else {
              this.$notify.success(title + '失败');
            }
          })
          .catch((e) => {
            this.$notify.success(title + '失败', e);
          });
      },
      handleStatusChange(row) {
        let text = row.status === 1 ? '启用' : '停用';
        let { id, status } = row;
        const that = this;
        this.$confirm('确认要' + text + ' ' + row.name + '模板吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            that.tableLoading = true;
            return templateEdit({ id, status });
          })
          .then(() => {
            that.tableLoading = false;
            that.getTableData();
            this.$notify.success(text + '成功');
          })
          .catch(function (e) {
            that.tableLoading = false;
            that.$notify.error(e);
            row.status = row.status === 2 ? 1 : 2;
          });
      },
      submitForm() {
        this.dialogOkLoading = true;
        this.$refs['form'].validate((valid) => {
          if (valid) {
            templateEdit(this.form)
              .then((res) => {
                if (res.code == 0 || res.code == 200) {
                  this.dialogOkLoading = false;
                  this.getTableData();
                  this.$notify.success('修改成功');
                  this.visible = false;
                } else {
                  this.$notify.error('修改失败');
                }
              })
              .catch((e) => {
                this.$notify.error(e);
              });
          } else {
            this.dialogOkLoading = false;
          }
        });
      },
      paginationChange(val) {
        this.pagination = val;
        this.getTableData();
      },
    },
    mounted() {
      this.getTableData();
    },
  };
</script>

<style lang="scss" scoped></style>
