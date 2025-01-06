<template>
  <div>
    <SearchPanel
      :showAll="true"
      shadow="all"
      :search="search"
      @onSubmit="handleQuery"
      @onReset="resetQuery"
    ></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="tableData"
      :loading="tableLoading"
      :pagination="pagination"
      @pagination-change="paginationChange"
      @refresh="getTableData()"
      @switch-change="handleStatusChange"
      @handleUpdate="handleUpdate"
      @handleDelete="handleDelete"
    >
      <template #header_left>
        <!-- 左上按钮区域默认插槽 -->
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['admin:role:add']"
          >新增</el-button
        >
      </template>
    </BaseTable>

    <BaseDialog
      :title="title"
      :visible.sync="visible"
      :loading="dialogLoading"
      :ok-loading="dialogOkLoading"
      @visible-change="visibleChange"
      v-if="visible"
    >
      <Form
        ref="slotForm"
        :value="form"
        @input="(val) => (form = val)"
        :menuOptions="menuOptions"
        :postTreeData="postTreeData"
        :appletMenuOptions="appletMenuOptions"
      />
    </BaseDialog>
  </div>
</template>

<script>
  import { columns } from './data';
  import { treeselect as menuTreeselect } from '@/api/system/menu';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseTable from '@/components/BaseTable/index.vue';
  import Form from './form.vue';
  import SearchPanel from '@/components/Common/SearchPanel';
  import {
    listCompany,
    getCompany,
    delCompany,
    addCompany,
    updateCompany,
  } from '@/api/system/company';
  import { STATUS_OPTIONS } from '@/utils/mapper';
  export default {
    name: 'Companymange',
    components: { SearchPanel, BaseTable, BaseDialog, Form },
    data() {
      return {
        search: {
          model: {
            name: null,
            company: null,
            status: 1,
            dateRange: null,
          },
          item: [
            {
              genre: 'input',
              label: '公司名称：',
              model: 'name',
            },
            {
              genre: 'input',
              label: '公司全称：',
              model: 'company',
            },
            {
              genre: 'select',
              label: '状态：',
              model: 'status',
              options: STATUS_OPTIONS,
            },
            {
              genre: 'daterange',
              label: '创建时间：',
              model: 'dateRange',
              clearable: true,
            },
          ],
        },
        pagination: { pagesize: 20, count: 900, page: 1 },
        columns: columns,
        tableData: [],
        tableLoading: false,

        title: '',
        form: {
          id: undefined,
          name: undefined,
          company: undefined,
          status: 1,
          auth_router: [],
          applet_router: [],
          menuCheckStrictly: true,
          remark: undefined,
          password: undefined,
          theme: '#1890ff',
          logo: '',
          logoMode: 'image',
          title: '',
        },
        visible: false,
        dialogOkLoading: false,
        dialogLoading: false,

        // 菜单列表
        menuOptions: [],
        appletMenuOptions: [],
        postTreeData: [],
      };
    },
    methods: {
      getTableData() {
        this.tableLoading = true;

        const params = Object.assign({}, this.pagination, this.search.model);
        delete params.dateRange;
        if (this.search.model.dateRange?.length) {
          params.params = {
            beginTime: this.search.model.dateRange[0],
            endTime: this.search.model.dateRange[1],
          };
        }

        listCompany(params)
          .then((data) => {
            this.tableData = data.data;
            this.pagination.count = data.count || 0;
            this.tableLoading = false;
          })
          .catch(() => {
            this.tableLoading = false;
          });
      },

      paginationChange(val) {
        this.pagination = val;
        this.getTableData();
      },

      handleQuery() {
        this.pagination.page = 1;
        this.getTableData();
      },
      resetQuery() {
        this.search.model = {
          name: null,
          company: null,
          status: 1,
          dateRange: null,
        };
        this.handleQuery();
      },

      // 公司状态修改
      handleStatusChange(row) {
        let text = row.status === 1 ? '启用' : '停用';
        const that = this;
        this.$confirm('确认要' + text + '【' + row.company + '】公司吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(function () {
            that.tableLoading = true;
            return updateCompany({ id: row.id, status: row.status });
          })
          .then(() => {
            this.$notify.success(text + '成功');
            that.tableLoading = false;
          })
          .catch(function (e) {
            that.tableLoading = false;
            that.$notify.error(e);
            row.status = row.status === 2 ? 1 : 2;
          });
      },

      visibleChange(val, type) {
        // console.log(type);
        if (type == 'ok') {
          this.submitForm();
        }
        this.visible = val;
      },

      reset() {
        this.form = {
          id: undefined,
          name: undefined,
          company: undefined,
          status: 1,
          applet_router: [],
          auth_router: [],
          menuCheckStrictly: true,
          remark: undefined,
          password: undefined,
          theme: '#1890ff',
          logo: '',
          logoMode: 'image',
          title: '',
        };
      },
      async handleAdd() {
        this.reset();
        this.visible = true;
        this.title = '添加公司';
        this.dialogLoading = true;
        await this.getMenuTreeselect();
        this.dialogLoading = false;
      },

      handleDelete(row) {
        const { id: ids } = row;
        const that = this;
        this.$confirm('是否确认删除公司编号为"' + ids + '"的数据项?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(function () {
            return delCompany({ ids: [ids] });
          })
          .then(() => {
            that.getTableData();
            this.$notify.success('删除成功');
          })
          .catch(() => {});
      },
      async handleUpdate(row) {
        this.reset();
        const id = row.id;
        this.visible = true;
        this.title = '修改公司';
        this.dialogLoading = true;
        await this.getMenuTreeselect();
        const { data } = await getCompany({ id: id });

        const formTemp = Object.assign({}, this.form, data);
        Object.assign(formTemp, JSON.parse(formTemp.platform_setting || 'null'));

        delete formTemp.platform_setting;
        this.form = formTemp;

        this.$nextTick(() => {
          let checkedKeys = this.form.auth_router || []; // 设置选中tree
          checkedKeys.forEach((v) => {
            this.$nextTick(() => {
              this.$refs.slotForm.$refs.menu.setChecked(v, true, false);
            });
          });

          checkedKeys = this.form.applet_router || []; // 设置选中tree
          checkedKeys.forEach((v) => {
            this.$nextTick(() => {
              this.$refs.slotForm.$refs.appletMenu.setChecked(v, true, false);
            });
          });
        });
        this.dialogLoading = false;
      },

      getMenuAllCheckedKeys() {
        // 目前被选中的菜单节点
        let checkedKeys = this.$refs.slotForm.$refs.menu.getCheckedKeys();
        // 半选中的菜单节点
        let halfCheckedKeys = this.$refs.slotForm.$refs.menu.getHalfCheckedKeys();
        checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        return checkedKeys;
      },
      getAppletMenuAllCheckedKeys() {
        // 目前被选中的菜单节点
        let checkedKeys = this.$refs.slotForm.$refs.appletMenu.getCheckedKeys();
        // 半选中的菜单节点
        let halfCheckedKeys = this.$refs.slotForm.$refs.appletMenu.getHalfCheckedKeys();
        checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        return checkedKeys;
      },

      getMenuTreeselect() {
        // return menuTreeselect({ type: "edit" }).then((data) => {
        //   // console.log(data);
        //   this.menuOptions = data.data;
        //   this.postTreeData = data.data;
        // });

        return Promise.all([
          menuTreeselect({ type: 'edit', router_type: 1 }),
          menuTreeselect({ type: 'edit', router_type: 2 }),
        ]).then(([menu, applet]) => {
          this.menuOptions = menu.data;
          this.appletMenuOptions = applet.data;
        });
      },
      submitForm() {
        this.dialogOkLoading = true;
        this.$refs.slotForm.$refs.form.validate((valid) => {
          if (valid) {
            const params = Object.assign({}, this.form);
            params.auth_router = this.getMenuAllCheckedKeys();
            params.applet_router = this.getAppletMenuAllCheckedKeys();

            const platform_setting = {
              logoMode: params.logoMode,
              logo: params.logo,
              theme: params.theme,
              title: params.title,
            };
            params.platform_setting = platform_setting;
            delete params.logoMode;
            delete params.logo;
            delete params.theme;
            delete params.title;

            if (params.id != undefined) {
              updateCompany(params)
                .then((res) => {
                  if (res.code == 0) {
                    this.$notify.success('修改成功');
                    this.getTableData();
                    this.visible = false;
                  } else {
                    this.$notify.error(res.message);
                  }
                  this.dialogOkLoading = false;
                })
                .catch((err) => {
                  this.$notify.error(err.message || err || '操作失败');
                  this.dialogOkLoading = false;
                });
            } else {
              addCompany(params)
                .then((res) => {
                  if (res.code == 0) {
                    this.$notify.success('新增成功');
                    this.getTableData();
                    this.visible = false;
                  } else {
                    this.$notify.error(res.message);
                  }
                  this.dialogOkLoading = false;
                })
                .catch((err) => {
                  this.$notify.error(err.message || err || '操作失败');
                  this.dialogOkLoading = false;
                });
            }
          } else {
            this.dialogOkLoading = false;
          }
        });
      },
    },
    mounted() {
      this.getTableData();
    },
  };
</script>

<style lang="scss" scoped>
  .avatar-uploader {
    > :first-child {
      min-width: 80px;
      max-width: 320px;
      height: 80px;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      &:hover {
        border-color: var(--theme-default);
      }
    }
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 80px;
    height: 80px;
    line-height: 80px;
    text-align: center;
  }
  .avatar {
    max-width: 320px;
    height: 80px;
    display: block;
  }
</style>
