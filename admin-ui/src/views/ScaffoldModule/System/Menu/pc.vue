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
      lazy
      row-key="id"
      :load="loadChild"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      @refresh="getTableData()"
      @handleDelete="handleDelete"
      @handleUpdate="handleUpdate"
      @handleAdd="handleAdd"
      @switch-change="handleStatusChange"
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

      <template #name="{ row }">
        <span>{{ row.meta.title }}</span>
      </template>

      <template #icon="{ row }">
        <svg-icon v-if="row.meta.icon" :iconName="row.meta.icon" />
      </template>
    </BaseTable>

    <BaseDialog
      :title="title"
      :visible.sync="visible"
      width="680px"
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
      />
    </BaseDialog>
  </div>
</template>

<script>
  import { listMenu, getMenu, delMenu, addMenu, updateMenu } from '@/api/system/menu';
  import SearchPanel from '@/components/Common/SearchPanel';
  import BaseTable from '@/components/BaseTable/index.vue';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import Form from './form.vue';
  import { columns } from './data';
  export default {
    components: { SearchPanel, BaseTable, BaseDialog, Form },
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
              label: '菜单名称：',
              model: 'name',
            },
          ],
        },
        columns: columns,
        tableData: [],
        tableLoading: false,

        title: '',
        form: {
          id: undefined,
          pid: 0,
          name: undefined,
          icon: undefined,
          menu_type: 'M',
          order: undefined,
          is_frame: '2',
          isCache: '1',
          hidden: '1',
          status: '1',
          show_sidebar: '1',
        },
        visible: false,
        dialogOkLoading: false,
        dialogLoading: false,

        // 菜单树选项
        menuOptions: [],
        resolveMap: {},
      };
    },
    created() {},
    methods: {
      reRender(val) {
        if (val.pid && this.resolveMap[val.pid])
          this.loadChild({ id: val.pid }, {}, this.resolveMap[val.pid]);
      },
      loadChild(tree, treeNode, resolve) {
        this.resolveMap[tree.id] = resolve;
        listMenu({ pid: tree.id }).then((res) => {
          resolve(res.data);
        });
      },
      getTableData() {
        this.tableLoading = true;
        listMenu(this.search.model).then((data) => {
          this.tableData = this.handleTree(data.data, 'id', 'pid');
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

      submitForm() {
        this.dialogOkLoading = true;
        this.$refs.slotForm.$refs.form.validate((valid) => {
          if (valid) {
            if (this.form.id !== undefined) {
              updateMenu(this.form).then(() => {
                this.$notify.success('修改成功');
                this.visible = false;
                this.reRender(this.form);
                this.getTableData();
              });
              this.dialogOkLoading = false;
            } else {
              addMenu(this.form).then(() => {
                this.$notify.success('新增成功');
                this.visible = false;
                this.reRender(this.form);
                this.getTableData();
              });
              this.dialogOkLoading = false;
            }
            this.dialogOkLoading = false;
          } else {
            this.dialogOkLoading = false;
          }
        });
      },

      handleStatusChange(row) {
        let old_status = row.status
        let text = row.status === 1 ? '启用' : '停用';
        const that = this;
        this.$confirm('确认要' + text + '【' + row.meta.title + '】吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(function () {
            that.tableLoading = true;
            return updateMenu({ id: row.id, status: row.status });
          })
          .then(() => {
            this.$notify.success(text + '成功');
            that.tableLoading = false;
          })
          .catch((e) => {
            row.status = old_status;
            that.tableLoading = false;
            that.$notify.error(e);
          });
      },

      async handleAdd(row) {
        this.reset();
        this.visible = true;
        this.title = '添加菜单';
        this.dialogLoading = true;
        await this.getTreeselect();
        if (row != null && row.id) {
          switch (row.menu_type) {
            case 'M':
              this.form.menu_type = 'C';
              break;
            case 'C':
              this.form.menu_type = 'T';
              break;
            case 'T':
              this.form.menu_type = 'F';
              break;
            default:
              this.form.menu_type = 'F';
              break;
          }
          this.form.pid = row.id;
        } else {
          this.form.menu_type = 'C';
          this.form.pid = 0;
        }
        this.dialogLoading = false;
      },
      /** 修改按钮操作 */
      async handleUpdate(row) {
        this.reset();
        this.visible = true;
        this.title = '修改菜单';
        this.dialogLoading = true;
        await this.getTreeselect();
        const data = await getMenu({ id: row.id });
        this.form = data.data;
        this.dialogLoading = false;
      },
      handleDelete(row) {
        let main_delete_str = '';
        if (!row.pid) main_delete_str = '删除主菜单将会同步删除其下的子菜单！';
        this.$confirm(
          '是否确认删除名称为"' + row.meta.title + '"的菜单？' + main_delete_str,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          },
        )
          .then(function () {
            return delMenu({ id: row.id });
          })
          .then(() => {
            this.getTableData();
            this.$notify.success('删除成功');
          })
          .catch(() => {});
      },

      reset() {
        this.form = {
          id: undefined,
          pid: 0,
          name: undefined,
          icon: undefined,
          menu_type: 'M',
          order: undefined,
          is_frame: '2',
          isCache: '1',
          hidden: '1',
          status: '1',
          show_sidebar: '1',
        };
      },

      /** 查询菜单下拉树结构 */
      getTreeselect() {
        listMenu({ type: 'tree', menu_type: 'F' }).then((res) => {
          this.menuOptions = [];
          const menu = { id: 0, name: '主菜单', children: [] };
          res.data.forEach((element) => {
            element.name = element.meta.title;
          });
          menu.children = this.handleTree(res.data, 'id', 'pid');
          this.menuOptions.push(menu);
        });
      },
    },
    mounted() {
      this.getTableData();
    },
    activated() {
      this.getTableData();
    },
  };
</script>

<style lang="scss" scoped></style>
