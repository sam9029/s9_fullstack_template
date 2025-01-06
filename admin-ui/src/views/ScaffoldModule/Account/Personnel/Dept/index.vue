<template>
  <div>
    <SearchPanel
      :search="search"
      :showAll="true"
      @onReset="resetQuery"
      @onSubmit="handleQuery"
      shadow="all"
      :prependWidth="`110px`"
    ></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="tableData"
      :loading="tableLoading"
      :pagination="pagination"
      @handleDelete="handleDelete"
      @handleUpdate="handleUpdate"
      @pagination-change="paginationChange"
      @refresh="getTableData()"
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
          v-hasPermi="['admin:department:add']"
          >新增</el-button
        >
      </template>
    </BaseTable>

    <BaseDialog
      :loading="dialogLoading"
      :ok-loading="dialogOkLoading"
      :title="title"
      :visible="visible"
      @visible-change="visibleChange"
      width="550px"
      v-if="visible"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="部门名称" prop="dept_name">
          <el-input v-model="form.dept_name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">开启</el-radio>
            <el-radio :label="2">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script>
  import { columns } from './config';
  import { companyDownList } from '@/api/system/company.js';
  import { mapGetters } from 'vuex';
  import { treeselect as menuTreeselect } from '@/api/system/menu';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseTable from '@/components/BaseTable/index.vue';
  import SearchPanel from '@/components/Common/SearchPanel';
  import {
    listDept,
    getDept,
    delDept,
    addDept,
    updateDept,
    treeselect as deptTreeselect,
  } from '@/api/account/personnel/dept.js';
  import { STATUS_OPTIONS } from '@/utils/mapper';

  export default {
    name: 'deptManage',
    computed: {
      ...mapGetters(['isAccessUser', 'currentOemId']),
    },
    components: { SearchPanel, BaseTable, BaseDialog },
    data() {
      return {
        search: {
          model: {
            keyword: '',
            status: null,
            oem_id: undefined,
            dateRange: null,
          },
          item: [
            {
              genre: 'input',
              model: 'keyword',
              label: '部门名称：',
              placeholder: '请输入部门ID/名称',
            },
            {
              genre: 'select',
              label: '状态：',
              model: 'status',
              options: STATUS_OPTIONS,
            },
            {
              genre: 'select',
              label: '公司全称：',
              model: 'oem_id',
              options: [],
              show: false,
            },
            // {
            //   genre: "daterange",
            //   label: "创建时间：",
            //   model: "dateRange",
            //   clearable: true,
            // },
          ],
        },
        pagination: { pagesize: 20, count: 900, page: 1 },
        columns: columns,
        tableData: [],
        tableLoading: false,

        title: '',
        form: {
          id: undefined,
          role_name: undefined,
          role_id: undefined,
          roleSort: 0,
          status: 1,
          auth_router: [],
          auth_data: [],
          deptIds: [],
          menuCheckStrictly: true,
          deptCheckStrictly: true,
          dataCheckStrictly: true,
          remark: undefined,
          data_type: 1,
        },
        rules: {
          dept_name: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
          roleSort: [{ required: true, message: '部门顺序不能为空', trigger: 'blur' }],
        },
        visible: false,
        dialogOkLoading: false,
        dialogLoading: false,

        // 是否显示弹出层（数据权限）
        openDataScope: false,
        menuExpand: false,
        menuNodeAll: false,
        deptExpand: true,
        deptNodeAll: false,
        // 数据范围选项
        // dataScopeOptions: dataScopeOptions,
        // 菜单列表
        menuOptions: [],
        // 部门列表
        deptOptions: [],
      };
    },
    mounted() {
      this.getTableData();
      if (this.isAccessUser) {
        this.search.item[this.findSearchIndex('oem_id')].show = true;
        this.getOem();
      }
    },
    activated() {
      this.getTableData();
      if (this.isAccessUser) {
        this.search.item[this.findSearchIndex('oem_id')].show = true;
        this.getOem();
      }
    },
    methods: {
      findSearchIndex(model) {
        let num = this.search.item.findIndex((item) => item.model == model);
        return num;
      },
      getSearchItem(model) {
        return this.search.item.find((v) => v.model == model);
      },
      async getOem() {
        let { data: res } = await companyDownList();
        if (res.code == 0) {
          this.getSearchItem('oem_id').options = res.data.map((v) => {
            return { label: v.name, value: v.id };
          });
        }
      },
      /** 查询部门列表 */
      getTableData() {
        this.tableLoading = true;
        const { pagination, search } = this;
        const params = Object.assign({}, pagination, search.model);
        delete params.dateRange;
        if (search.model.dateRange?.length) {
          params.params = {
            beginTime: search.model.dateRange[0],
            endTime: search.model.dateRange[1],
          };
        }

        listDept(params)
          .then((data) => {
            this.tableData = data.data;
            this.pagination.count = data.count || 0;
          })
          .catch((err) => {
            this.$notify.error(err?.message || err || '获取部门数据失败');
          })
          .finally(() => {
            this.tableLoading = false;
          });
      },

      visibleChange(val, type) {
        if (type == 'ok') {
          this.submitForm();
        }
        this.visible = val;
      },

      paginationChange(val) {
        this.pagination = val;
        this.getTableData();
      },
      /** 查询菜单树结构 */
      getMenuTreeselect(search = {}) {
        return menuTreeselect(search).then(({ data }) => {
          this.menuOptions = data.data;
        });
      },
      /** 查询部门树结构 */
      getDeptTreeselect() {
        deptTreeselect().then((response) => {
          this.deptOptions = response.data;
        });
      },

      // 表单重置
      reset() {
        if (this.$refs.menu != undefined) {
          this.$refs.menu.setCheckedKeys([]);
        }
        this.menuExpand = false;
        this.menuNodeAll = false;
        this.deptExpand = true;
        this.deptNodeAll = false;
        this.form = {
          id: undefined,
          dept_name: undefined,
          roleSort: 0,
          status: 1,
          auth_router: [],
          deptIds: [],
          menuCheckStrictly: true,
          deptCheckStrictly: true,
          remark: undefined,
        };
        this.resetForm('form');
      },
      /** 搜索按钮操作 */
      handleQuery() {
        this.pagination.page = 1;
        this.getTableData();
      },
      /** 重置按钮操作 */
      resetQuery() {
        this.search.model = {
          keyword: '',
          status: null,
          oem_id: undefined,
          dateRange: null,
        };
        this.handleQuery();
      },
      // 树权限（展开/折叠）
      handleCheckedTreeExpand(value, type) {
        if (type == 'menu') {
          let treeList = this.menuOptions;
          for (let i = 0; i < treeList.length; i++) {
            this.$refs.menu.store.nodesMap[treeList[i].id].expanded = value;
          }
        } else if (type == 'dept') {
          let treeList = this.deptOptions;
          for (let i = 0; i < treeList.length; i++) {
            this.$refs.dept.store.nodesMap[treeList[i].id].expanded = value;
          }
        }
      },
      // 树权限（全选/全不选）
      handleCheckedTreeNodeAll(value, type) {
        if (type == 'menu') {
          this.$refs.menu.setCheckedNodes(value ? this.menuOptions : []);
        } else if (type == 'dept') {
          this.$refs.dept.setCheckedNodes(value ? this.deptOptions : []);
        }
      },
      // 树权限（父子联动）
      handleCheckedTreeConnect(value, type) {
        if (type == 'menu') {
          this.form.menuCheckStrictly = value ? true : false;
        } else if (type == 'dept') {
          this.form.deptCheckStrictly = value ? true : false;
        }
      },

      /** 新增按钮操作 */
      async handleAdd() {
        this.reset();
        this.title = '添加部门';
        this.visible = true;
        this.dialogLoading = true;
        await this.getMenuTreeselect();
        this.dialogLoading = false;
      },

      /** 修改按钮操作 */
      handleUpdate(row) {
        this.reset();
        this.title = '修改部门';
        this.visible = true;
        this.dialogLoading = true;
        const id = row.id;
        let all = [getDept({ id: id })];
        Promise.all(all)
          .then((response) => {
            let data = response[0];
            this.form = data.data || {};
            this.dialogLoading = false;
          })
          .catch(() => {
            this.dialogLoading = false;
          });
      },

      /** 删除按钮操作 */
      handleDelete(row) {
        this.$confirm(`确认删除【${row.id}】${row.dept_name}`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(function () {
            return delDept({ ids: [row.id] });
          })
          .then(() => {
            this.getTableData();
            this.$notify.success('删除成功');
          })
          .catch(() => {});
      },

      // 部门状态修改
      handleStatusChange(row) {
        let text = row.status === 1 ? '启用' : '停用';
        let { id, status } = row;
        const that = this;
        this.$confirm('确认要"' + text + ' ' + row.dept_name + '部门吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(function () {
            that.tableLoading = true;
            return updateDept({ id, status });
          })
          .then(() => {
            that.tableLoading = false;
            this.$notify.success(text + '成功');
          })
          .catch(function (e) {
            that.tableLoading = false;
            that.$notify.error(e);
            row.status = row.status === 2 ? 1 : 2;
          });
      },

      /** 提交按钮 */
      submitForm: function () {
        if (this.openLoading) return;
        this.$refs['form'].validate((valid) => {
          if (valid) {
            if (this.form.id != undefined) {
              updateDept(this.form).then((res) => {
                if (res.code == 0 || res.code == 200) {
                  this.$notify.success('修改成功');
                  this.visible = false;
                  this.getTableData();
                } else {
                  this.$notify.error('修改失败');
                }
              });
            } else {
              addDept(this.form).then((res) => {
                if (res.code == 0 || res.code == 200) {
                  this.$notify.success('新增成功');
                  this.visible = false;
                  this.getTableData();
                } else {
                  this.$notify.error('新增失败');
                }
              });
            }
          } else {
            this.dialogOkLoading = false;
          }
        });
      },
    },
  };
</script>
