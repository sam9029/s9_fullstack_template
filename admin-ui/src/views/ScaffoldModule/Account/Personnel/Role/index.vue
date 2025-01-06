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
      @pagination-change="paginationChange"
      @handleUpdate="handleUpdate"
      @handleCopy="handleCopy"
      @handleDelete="handleDelete"
      @switch-change="handleStatusChange"
      @refresh="getTableData()"
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
      width="1024px"
      :visible="visible"
      :loading="dialogLoading"
      :ok-loading="dialogOkLoading"
      @visible-change="visibleChange"
      v-if="visible"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色名称" prop="role_name">
              <el-input v-model="form.role_name" placeholder="请输入角色名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="上级角色" prop="upper_id">
              <el-select
                style="width: 100%"
                v-model="form.upper_id"
                placeholder="请选择上级角色"
                filterable
                clearable
              >
                <el-option
                  v-for="item in roleOptions"
                  :label="item.role_name"
                  :value="Number(item.id)"
                  :key="item.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">开启</el-radio>
                <el-radio :label="2">关闭</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="KOC商务" prop="koc_role">
              <el-radio-group v-model="form.koc_role">
                <el-radio :label="1">是</el-radio>
                <el-radio :label="2">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <!-- <el-col :span="12">
            <el-form-item label="角色" prop="position">
              <el-radio-group v-model="form.position">
                <el-radio :label="1">是</el-radio>
                <el-radio :label="2">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col> -->

          <el-col :span="24">
            <el-form-item label="权限管理" class="otherClass">
              <el-tabs v-model="activeTab">
                <el-tab-pane label="PC端" name="1">
                  <el-col :span="12">
                    <h1>菜单权限</h1>
                    <el-form-item>
                      <el-checkbox
                        v-model="menuExpand"
                        @change="handleCheckedTreeExpand($event, 'menu')"
                        >展开/折叠</el-checkbox
                      >
                      <el-checkbox
                        v-model="menuNodeAll"
                        @change="handleCheckedTreeNodeAll($event, 'menu')"
                        >全选/全不选</el-checkbox
                      >
                      <el-checkbox
                        v-model="menuCheckStrictly"
                        @change="handleCheckedTreeConnect($event, 'menu')"
                        >父子联动</el-checkbox
                      >
                      <el-tree
                        class="tree-border"
                        :data="menuOptions"
                        show-checkbox
                        style="height: 280px; overflow: scroll"
                        ref="menu"
                        node-key="id"
                        :check-strictly="!menuCheckStrictly"
                        empty-text="加载中，请稍后"
                        :props="defaultProps"
                        @check="menuChecks"
                        :render-after-expand="false"
                      ></el-tree>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <h1>数据权限</h1>
                    <el-form-item>
                      <div class="data-class">
                        <el-radio-group v-model="form.data_type" @change="dataTotalChange">
                          <el-radio
                            v-for="item in dataType"
                            :label="item.value"
                            :key="item.value"
                            >{{ item.label }}</el-radio
                          >
                        </el-radio-group>
                      </div>
                      <div v-show="defindShow">
                        <div style="display: flex">
                          <el-checkbox
                            v-model="dataExpand"
                            @change="handleCheckedTreeExpand($event, 'data')"
                            >展开/折叠</el-checkbox
                          >
                          <el-checkbox
                            v-model="dataNodeAll"
                            @change="handleCheckedTreeNodeAll($event, 'data')"
                            >全选/全不选</el-checkbox
                          >
                          <el-select
                            v-model="typeMain"
                            class="data-select"
                            placeholder="权限类型"
                            @change="typeMainChange"
                          >
                            <el-option
                              v-for="item in AUTH_TYPE"
                              :key="item.value"
                              :label="item.label"
                              :value="item.value"
                            ></el-option>
                          </el-select>
                        </div>
                        <el-tree
                          :check-strictly="!dataCheckStrictly"
                          :data="dataOptions"
                          :filter-node-method="dataFilterNode"
                          :props="defaultProps"
                          :render-after-expand="false"
                          @check-change="interfaceChange"
                          class="tree-border"
                          empty-text="请先选择菜单权限"
                          node-key="id"
                          ref="dataAuth"
                          show-checkbox
                          style="height: 250px; overflow: scroll"
                        >
                          <span class="custom-tree-node" slot-scope="{ node, data }">
                            <div>{{ node.label }}</div>
                            <div class="tree-select" v-if="!data.children">
                              <el-select
                                v-model="data.model"
                                placeholder="权限类型"
                                @change="typeChange(data.id)"
                                :disabled="treeType(data.id)"
                              >
                                <el-option
                                  v-for="item in AUTH_TYPE"
                                  :key="item.value"
                                  :label="item.label"
                                  :value="item.value"
                                ></el-option>
                              </el-select>
                            </div>
                          </span>
                        </el-tree>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-tab-pane>
                <el-tab-pane label="小程序" name="2">
                  <el-col :span="12">
                    <h1>菜单权限</h1>
                    <el-form-item>
                      <el-checkbox
                        v-model="appletMenuExpand"
                        @change="handleCheckedTreeExpand($event, 'appletMenu')"
                        >展开/折叠
                      </el-checkbox>
                      <el-checkbox
                        v-model="appletMenuNodeAll"
                        @change="handleCheckedTreeNodeAll($event, 'appletMenu')"
                        >全选/全不选
                      </el-checkbox>
                      <el-checkbox
                        v-model="appletMenuCheckStrictly"
                        @change="handleCheckedTreeConnect($event, 'appletMenu')"
                        >父子联动
                      </el-checkbox>
                      <el-tree
                        :check-strictly="!appletMenuCheckStrictly"
                        :data="appletMenuOptions"
                        :props="defaultProps"
                        :render-after-expand="false"
                        @check="appletMenuChecks"
                        class="tree-border"
                        empty-text="加载中，请稍后"
                        node-key="id"
                        ref="appletMenu"
                        show-checkbox
                        style="height: 280px; overflow: scroll"
                      ></el-tree>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <h1>数据权限</h1>
                    <el-form-item>
                      <div class="data-class">
                        <el-radio-group v-model="form.applet_data_type">
                          <el-radio
                            v-for="item in appletDataType"
                            :label="item.value"
                            :key="item.value"
                            >{{ item.label }}</el-radio
                          >
                        </el-radio-group>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-tab-pane>
              </el-tabs>
            </el-form-item>
          </el-col>

          <el-col :span="24"> </el-col>

          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script>
  import SearchPanel from '@/components/Common/SearchPanel';
  import BaseTable from '@/components/BaseTable/index.vue';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import {
    listRole,
    getRole,
    delRole,
    addRole,
    updateRole,
    upperRole,
    treeRole,
  } from '@/api/account/personnel/role.js';
  import { treeselect as menuTreeselect } from '@/api/system/menu';
  import { AUTH_TYPE } from '@/utils/common/publicOptions';
  import { STATUS_OPTIONS } from '@/utils/mapper';
  import { columns } from './config';

  export default {
    name: 'roleManage',
    components: { SearchPanel, BaseTable, BaseDialog },
    data() {
      return {
        search: {
          model: {
            role_ids: null,
            status: null,
            oem_id: undefined,
            dateRange: null,
          },
          item: [
            {
              genre: 'select',
              label: '角色：',
              model: 'role_ids',
              multiple: true,
              options: [],
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
        columns,
        tableData: [],
        tableLoading: false,

        title: '',
        form: {
          auth_data: [],
          auth_router: [],
          applet_router: [],
          data_type: 1,
          applet_data_type: 1,
          dataCheckStrictly: true,
          deptCheckStrictly: true,
          deptIds: [],
          id: undefined,
          koc_role: null,
          position: 2, // 原创商务
          remark: undefined,
          role_id: undefined,
          role_name: undefined,
          roleSort: 0,
          status: 1,
        },
        menuCheckStrictly: true,
        rules: {
          role_name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
          role_id: [{ required: true, message: '角色ID不能为空', trigger: 'change' }],
          koc_role: [{ required: true, message: '请选择是否为KOC商务', trigger: 'change' }],
          position: [{ required: true, message: '请选择是否为原创商务', trigger: 'change' }],
          roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }],
        },
        visible: false,
        dialogOkLoading: false,
        dialogLoading: false,

        AUTH_TYPE, // 父级角色下拉
        roleOptions: [],
        // 数据列表
        dataOptions: [],
        menuOptions: [],
        defaultProps: {
          children: 'children',
          label: 'label',
        },
        menuExpand: false,
        menuNodeAll: false,
        dataExpand: false,
        dataNodeAll: false,
        defindShow: false,
        dataCheckStrictly: true,
        typeMain: '',
        dataType: [
          {
            value: 1,
            label: '系统默认',
          },
          // {
          //   value: 2,
          //   label: "角色",
          // },
          {
            value: 3,
            label: '部门',
          },
          {
            value: 4,
            label: '公司',
          },
          {
            value: 5,
            label: '自定义配置',
          },
        ],
        appletDataType: [
          { value: 1, label: '系统默认' },
          { value: 3, label: '部门' },
          { value: 4, label: '公司' },
        ],

        activeTab: '1',
        appletMenuCheckStrictly: true,
        appletMenuExpand: false,
        appletMenuNodeAll: false,
        appletMenuOptions: [],
      };
    },
    computed: {
      treeType() {
        return function (item) {
          return [167, 168, 169, 170].includes(Number(item));
        };
      },
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
        if (!params.role_ids?.length) delete params.role_ids;

        listRole(params)
          .then((res) => {
            if (res.code == 0) {
              this.tableData = res.data;
              this.pagination.pagesize = res.pagesize;
              this.pagination.count = res.count;
              this.pagination.page = res.page;
            }
          })
          .catch((err) => {
            this.$notify.error(err?.message || err || '获取角色数据失败');
          })
          .finally(() => {
            this.tableLoading = false;
          });
      },
      paginationChange(val) {
        this.pagination = val;
        this.getTableData();
      },

      getAllRoleOptions() {
        return treeRole()
          .then((data) => {
            this.getSearchItem('role_ids').options = data.data.map((v) => ({
              label: v.role_name,
              value: v.id,
            }));
          })
          .catch((err) => {
            console.log(err);
          });
      },

      getSearchItem(model) {
        return this.search.item.find((v) => v.model == model);
      },
      handleQuery() {
        this.getTableData();
      },
      resetQuery() {
        this.search.model = {
          role_ids: null,
          status: null,
          oem_id: undefined,
          dateRange: null,
        };
        this.handleQuery();
      },

      reset() {
        if (this.$refs.menu != undefined) {
          this.$refs.menu.setCheckedKeys([]);
        }
        if (this.$refs.dataAuth != undefined) {
          this.$refs.dataAuth.setCheckedKeys([]);
        }

        if (this.$refs.dataAuth != undefined) {
          this.$refs.appletMenu.setCheckedKeys([]);
        }
        this.menuExpand = false;
        this.menuNodeAll = false;
        this.menuCheckStrictly = true;
        this.dataExpand = false;
        this.dataNodeAll = false;
        this.deptExpand = true;
        this.deptNodeAll = false;
        this.form = {
          auth_data: [],
          auth_router: [],
          applet_router: [],
          data_type: 1,
          applet_data_type: 1,
          dataCheckStrictly: true,
          deptCheckStrictly: true,
          deptIds: [],
          id: undefined,
          koc_role: null,
          position: 2,
          remark: undefined,
          role_id: undefined,
          role_name: undefined,
          roleSort: 0,
          status: 1,
        };

        this.activeTab = '1';
        this.appletMenuCheckStrictly = true;
        this.appletMenuExpand = false;
        this.appletMenuNodeAll = false;
        this.appletMenuOptions = [];
        this.resetForm('form');
      },
      async handleAdd() {
        this.reset();
        this.visible = true;
        this.title = '添加角色';
        this.dialogLoading = true;
        await this.getFistRoleOption();
        await this.getMenuTreeselect();
        this.dialogLoading = false;
      },
      handleDelete(row) {
        const { id, role_name } = row;
        // console.log(row);
        let that = this;
        // if (!ids || !ids.length) return;
        this.$confirm(`确认删除【${id}】${role_name}`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(function () {
          delRole({ ids: [id] })
            .then((res) => {
              if (res.code == 0) {
                that.$notify.success('删除成功');
                that.getTableData();
              } else {
                throw res;
              }
            })
            .catch((err) => {
              that.$notify.error('删除失败' + err?.message || err);
            });
        });
      },
      handleUpdate(row) {
        this.reset();
        this.visible = true;
        this.title = '修改角色';
        this.dialogLoading = true;
        let all = [
          getRole({ id: row.id }),
          this.getMenuTreeselect({
            company: row.company,
            id: row.id,
            method: 'role',
          }),
          this.getFistRoleOption(row),
        ];
        Promise.all(all)
          .then((response) => {
            let { data } = response[0];
            data.applet_data_type = data.applet_data_type || 1;
            this.form = data || {};
            this.form.data_type = this.form.data_type || 5;
            this.menuCheckStrictly = true;
            this.appletMenuCheckStrictly = true;
            this.dataTotalChange(this.form.data_type);
            this.$nextTick(() => {
              let checkedKeys = this.form.auth_router || [];
              checkedKeys.forEach((v) => {
                this.$refs.menu.setChecked(v, true, false);
              });
              let ids = [];
              let result = this.$refs.menu.getCheckedNodes(false, true);
              result.forEach((t) => {
                ids.push(t.id);
              });
              this.menuChecks(null, {
                checkedKeys: ids,
                halfCheckedKeys: '',
              });

              checkedKeys = this.form.auth_data || [];
              this.handleCheckedTreeExpand(false, 'data');
              checkedKeys.forEach((v) => {
                this.$refs.dataAuth.setChecked(v.interface_id, true, false);
                if (this.$refs.dataAuth.getNode(v.interface_id))
                  this.$refs.dataAuth.getNode(v.interface_id).data.model = v.type;
              });

              let applet_routerCheckedKeys = this.form.applet_router || [];
              applet_routerCheckedKeys.forEach((v) => {
                this.$refs.appletMenu.setChecked(v, true, false);
              });
              ids = [];
              result = this.$refs.appletMenu.getCheckedNodes(false, true);
              result.forEach((t) => {
                ids.push(t.id);
              });
              this.appletMenuChecks(null, {
                checkedKeys: ids,
                halfCheckedKeys: '',
              });
            });
            this.dialogLoading = false;
          })
          .catch(() => {
            this.dialogLoading = false;
          });
      },

      handleCopy(row) {
        this.reset();
        this.visible = true;
        this.title = '复制角色';
        this.dialogLoading = true;

        let all = [
          getRole({ id: row.id }),
          this.getMenuTreeselect({
            company: row.company,
            id: row.id,
            method: 'role',
          }),
          this.getFistRoleOption(),
        ];
        Promise.all(all)
          .then((response) => {
            let { data } = response[0];
            delete data.id;
            data.applet_data_type = data.applet_data_type || 1;
            this.form = data || {};
            this.form.data_type = this.form.data_type || 5;
            delete this.form.role_id;
            this.dataTotalChange(this.form.data_type);
            this.$nextTick(() => {
              let checkedKeys = this.form.auth_router || [];
              checkedKeys.forEach((v) => {
                this.$refs.menu.setChecked(v, true, false);
              });
              let ids = [];
              let result = this.$refs.menu.getCheckedNodes(false, true);
              result.forEach((t) => {
                ids.push(t.id);
              });
              this.menuChecks(null, {
                checkedKeys: ids,
                halfCheckedKeys: '',
              });

              checkedKeys = this.form.auth_data || [];
              this.handleCheckedTreeExpand(false, 'data');
              checkedKeys.forEach((v) => {
                this.$refs.dataAuth.setChecked(v.interface_id, true, false);
                if (this.$refs.dataAuth.getNode(v.interface_id))
                  this.$refs.dataAuth.getNode(v.interface_id).data.model = v.type;
              });

              let applet_routerCheckedKeys = this.form.applet_router || [];
              applet_routerCheckedKeys.forEach((v) => {
                this.$refs.appletMenu.setChecked(v, true, false);
              });
              ids = [];
              result = this.$refs.appletMenu.getCheckedNodes(false, true);
              result.forEach((t) => {
                ids.push(t.id);
              });
              this.appletMenuChecks(null, {
                checkedKeys: ids,
                halfCheckedKeys: '',
              });
            });
            this.dialogLoading = false;
          })
          .catch(() => {
            this.dialogLoading = false;
          });
      },

      handleStatusChange(row) {
        let text = row.status === 1 ? '启用' : '停用';
        let { id, status } = row;
        const that = this;
        this.$confirm('确认要"' + text + ' ' + row.role_name + '角色吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(function () {
            that.tableLoading = true;
            return updateRole({ id, status });
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

      visibleChange(val, type) {
        // console.log(type);
        if (type == 'ok') {
          this.submitForm();
        }
        this.visible = val;
      },

      submitForm() {
        this.dialogOkLoading = true;
        this.$refs['form'].validate((valid) => {
          if (valid) {
            this.form.auth_router = this.getMenuAllCheckedKeys();
            // console.log(this.getMenuAllCheckedKeys());
            this.form.applet_router = this.getAppletMenuAllCheckedKeys();
            if (this.form.data_type != 5) {
              this.$refs.dataAuth
                .getCheckedNodes(false, true)
                .forEach((t) => (t.model = this.form.data_type));
              // console.log(this.$refs.dataAuth.getCheckedNodes(false, true));
            }
            this.form.auth_data = this.getDataAllCheckedKeys();
            if (this.form.id != undefined) {
              updateRole(this.form)
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
                .catch((err) => {
                  this.$notify.error(err.message || err || '操作失败');
                  this.dialogOkLoading = false;
                });
            } else {
              addRole(this.form)
                .then((res) => {
                  if (res.code == 0 || res.code == 200) {
                    this.dialogOkLoading = false;
                    this.getTableData();
                    this.$notify.success('新增成功');
                    this.visible = false;
                  } else {
                    this.$notify.error('新增失败');
                  }
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

      getFistRoleOption(row = {}) {
        let id = row.id;
        return upperRole({ id: id }).then((data) => {
          this.roleOptions = data.data;
        });
      },

      /** 查询菜单树结构 */
      getMenuTreeselect(search = {}) {
        return Promise.all([
          menuTreeselect({ ...search, type: 'edit', router_type: 1 }),
          menuTreeselect({ ...search, type: 'edit', router_type: 2 }),
        ]).then(([menu, applet]) => {
          this.menuOptions = menu.data;
          this.dataOptions = menu.result;
          this.appletMenuOptions = applet.data;
        });
        // return menuTreeselect(search).then((data) => {
        //   this.menuOptions = data.data;
        //   this.dataOptions = data.result;
        // });
      },

      typeChange(id) {
        this.typeMain = '';
        this.$refs.dataAuth.setChecked(id, true, false);
      },
      interfaceChange(data, isCheck) {
        this.typeMain = '';
        if (!data.children) {
          data.model = isCheck ? data.model || 1 : null;
        }
      },
      typeMainChange(val) {
        this.$refs.dataAuth.getCheckedNodes().map((t) => (t.model = val));
      },
      dataTotalChange(val) {
        this.defindShow = val == 5;
      },
      menuChecks(data, result) {
        let array = [...result.checkedKeys, ...result.halfCheckedKeys];
        this.$refs.dataAuth.filter(array);
        array.forEach((t, index) => {
          if (this.$refs.dataAuth.store.nodesMap[t]) {
            this.$refs.dataAuth.store.nodesMap[t].expanded = this.$refs.menu.getNode(t).expanded;
          }
        });
        if (data) {
          if (data.menu_type == 'F') this.$refs.dataAuth.setChecked(data.pid, true, true);
          else this.$refs.dataAuth.setChecked(data.id, true, true);
        }
      },

      appletMenuChecks(data, result) {
        // let array = [...result.checkedKeys, ...result.halfCheckedKeys];
        // this.$refs.dataAuth.filter(array);
        // array.forEach((t, index) => {
        //   if (this.$refs.dataAuth.store.nodesMap[t]) {
        //     this.$refs.dataAuth.store.nodesMap[t].expanded =
        //       this.$refs.menu.getNode(t).expanded;
        //   }
        // });
        // if (data) {
        //   if (data.menu_type == "F")
        //     this.$refs.dataAuth.setChecked(data.pid, true, true);
        //   else this.$refs.dataAuth.setChecked(data.id, true, true);
        // }
      },

      // 树权限（展开/折叠）
      handleCheckedTreeExpand(value, type) {
        if (type == 'menu') {
          // let treeList = this.menuOptions;
          // for (let i = 0; i < treeList.length; i++) {
          //   this.$refs.menu.store.nodesMap[treeList[i].id].expanded = value;
          // }
          for (var i in this.$refs.menu.store.nodesMap) {
            this.$refs.menu.store.nodesMap[i].expanded = value;
          }
        } else if (type == 'dept') {
          let treeList = this.deptOptions;
          for (let i = 0; i < treeList.length; i++) {
            this.$refs.dept.store.nodesMap[treeList[i].id].expanded = value;
          }
        } else if (type == 'data') {
          // let treeList = this.dataOptions;
          // for (let i = 0; i < treeList.length; i++) {
          //   this.$refs.dataAuth.store.nodesMap[treeList[i].id].expanded = value;
          // }
          for (var i in this.$refs.dataAuth.store.nodesMap) {
            this.$refs.dataAuth.store.nodesMap[i].expanded = value;
          }
        } else if (type == 'appletMenu') {
          // let treeList = this.dataOptions;
          // for (let i = 0; i < treeList.length; i++) {
          //   this.$refs.dataAuth.store.nodesMap[treeList[i].id].expanded = value;
          // }
          for (var i in this.$refs.appletMenu.store.nodesMap) {
            this.$refs.appletMenu.store.nodesMap[i].expanded = value;
          }
        }
      },
      // 树权限（全选/全不选）
      handleCheckedTreeNodeAll(value, type) {
        if (type == 'menu') {
          this.$refs.menu.setCheckedNodes(value ? this.menuOptions : []);
          if (value) {
            this.$refs.dataAuth.setCheckedNodes(this.$refs.menu.getCheckedNodes(false, true));
            this.menuChecks(null, {
              checkedKeys: this.$refs.menu.getCheckedKeys(),
              halfCheckedKeys: '',
            });
          } else {
            this.menuChecks(null, {
              checkedKeys: [],
              halfCheckedKeys: [],
            });
          }
        } else if (type == 'dept') {
          this.$refs.dept.setCheckedNodes(value ? this.deptOptions : []);
        } else if (type == 'data') {
          this.$refs.dataAuth.setCheckedNodes(value ? this.dataOptions : []);
        } else if (type == 'appletMenu') {
          this.$refs.appletMenu.setCheckedNodes(value ? this.appletMenuOptions : []);
          // if (value) {
          //   this.$refs.dataAuth.setCheckedNodes(
          //     this.$refs.appletMenu.getCheckedNodes(false, true)
          //   );
          //   this.appletMenuChecks(null, {
          //     checkedKeys: this.$refs.appletMenu.getCheckedKeys(),
          //     halfCheckedKeys: "",
          //   });
          // } else {
          //   this.appletMenuChecks(null, {
          //     checkedKeys: [],
          //     halfCheckedKeys: [],
          //   });
          // }
        }
      },
      // 树权限（父子联动）
      handleCheckedTreeConnect(value, type) {
        if (type == 'menu') {
          this.menuCheckStrictly = value ? true : false;
        } else if (type == 'dept') {
          this.form.deptCheckStrictly = value ? true : false;
        } else if (type == 'data') {
          this.form.dataCheckStrictly = value ? true : false;
        } else if (type == 'appletMenu') {
          this.appletMenuCheckStrictly = value ? true : false;
        }
      },

      dataFilterNode(value, data, node) {
        return value.includes(data.id);
      },

      getMenuAllCheckedKeys() {
        // 目前被选中的菜单节点
        let checkedKeys = this.$refs.menu.getCheckedKeys();
        // 半选中的菜单节点
        let halfCheckedKeys = this.$refs.menu.getHalfCheckedKeys();
        checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        checkedKeys = this.setParentNode(checkedKeys);
        return checkedKeys;
      },

      setParentNode(checkedKeys) {
        let result = [];
        checkedKeys.forEach((key) => {
          let pnode = this.$refs.menu.getNodePath(key).map((item) => item.id);
          result.push(...pnode);
        });
        return [...new Set(result)];
      },

      getAppletMenuAllCheckedKeys() {
        // 目前被选中的菜单节点
        let checkedKeys = this.$refs.appletMenu.getCheckedKeys();
        // 半选中的菜单节点
        let halfCheckedKeys = this.$refs.appletMenu.getHalfCheckedKeys();
        checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        checkedKeys = this.setAppletParentNode(checkedKeys);
        return checkedKeys;
      },

      setAppletParentNode(checkedKeys) {
        let result = [];
        checkedKeys.forEach((key) => {
          let pnode = this.$refs.appletMenu.getNodePath(key).map((item) => item.id);
          result.push(...pnode);
        });
        return [...new Set(result)];
      },
      // 所有数据菜单节点数据
      getDataAllCheckedKeys() {
        // // 目前被选中的菜单节点
        // let checkedKeys = this.$refs.dataAuth.getCheckedKeys();
        // // 半选中的菜单节点
        // let halfCheckedKeys = this.$refs.dataAuth.getHalfCheckedKeys();
        // console.log(this.$refs.dataAuth.getCheckedNodes(false, true))
        // console.log(halfCheckedKeys)
        // checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        let checkedKeys = [];
        this.$refs.dataAuth.getCheckedNodes(false, true).forEach((t) => {
          if (
            this.$refs.dataAuth.getNode(t.id).visible &&
            (this.$refs.dataAuth.getNode(t.id).checked ||
              this.$refs.dataAuth.getNode(t.id).indeterminate)
          ) {
            checkedKeys.push({
              interface_id: t.id,
              type: t.model ?? null,
            });
          }
        });
        return checkedKeys;
      },
      // 所有部门节点数据
      getDeptAllCheckedKeys() {
        // 目前被选中的部门节点
        let checkedKeys = this.$refs.dept.getCheckedKeys();
        // 半选中的部门节点
        let halfCheckedKeys = this.$refs.dept.getHalfCheckedKeys();
        checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        return checkedKeys;
      },
      /** 根据角色ID查询菜单树结构 */
      getRoleMenuTreeselect(id) {
        return roleMenuTreeselect(id).then((response) => {
          this.menuOptions = response.menus;
          return response;
        });
      },
    },
    mounted() {
      this.getTableData();
      this.getAllRoleOptions();
    },
    activated() {
      this.getTableData();
      this.getAllRoleOptions();
    },
  };
</script>

<style lang="scss" scoped>
  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;
    .tree-select {
      width: 100px;
      ::v-deep .el-input__inner {
        height: 20px;
      }
    }
  }
  .data-select {
    width: 110px;
    margin-left: 20px;
    ::v-deep .el-input__inner {
      height: 30px;
    }
  }
  .data-class {
    ::v-deep .el-radio {
      margin-right: 10px;
    }
  }

  .otherClass {
    ::v-deep .el-form-item__label {
      height: 40px !important;
      line-height: 40px !important;
    }
  }
</style>
