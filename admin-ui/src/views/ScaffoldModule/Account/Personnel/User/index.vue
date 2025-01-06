<template>
  <div>
    <SearchPanel
      :showAll="false"
      shadow="all"
      :search="search"
      @onSubmit="handleQuery"
      @onReset="resetQuery"
      :prependWidth="`110px`"
    ></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="userList"
      :loading="loading"
      :pagination="pagination"
      @pagination-change="paginationChange"
      @handleUpdate="handleUpdate"
      @handleDelete="handleDelete"
      @handleResetPwd="handleResetPwd"
      @switch-change="handleStatusChange"
      @refresh="getList()"
    >
      <template #header_left>
        <!-- 左上按钮区域默认插槽 -->
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['admin:user:add']"
          >新增</el-button
        >
      </template>

      <template #departments="{ row }">
        <span v-for="(item, index) in row.departments" :key="index">
          <el-tag size="mini">{{ item }}</el-tag
          >&nbsp;&nbsp;
        </span>
      </template>

      <template #role_names="{ row }">
        <template v-if="row.role_names">
          <el-tag size="mini" v-for="(item, index) in row.role_names.split(',')" :key="index">{{
            item
          }}</el-tag>
        </template>
      </template>
    </BaseTable>

    <BaseDialog
      :loading="editLoading"
      :ok-loading="dialogOkLoading"
      :title="title"
      :visible="open"
      @visible-change="visibleChange"
      v-if="open"
      width="1024px"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入用户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录邮箱" prop="email">
              <el-input
                :disabled="form.id ? true : false"
                v-model="form.email"
                placeholder="请输入邮箱"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="telephone">
              <el-input v-model="form.telephone" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.id == undefined" label="用户密码" prop="password">
              <!-- type="password" -->
              <el-input v-model="form.password" placeholder="请输入用户密码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="department">
              <el-select
                style="width: 100%"
                v-model="form.department"
                clearable
                collapse-tags
                multiple
                placeholder="请选择"
                @change="deptChange"
              >
                <el-option
                  v-for="item in deptOptions"
                  :key="item.id"
                  :label="item.label"
                  :value="item.id"
                ></el-option>
              </el-select>
              <!-- <treeselect v-model="form.department" :options="deptOptions" :show-count="true" placeholder="请选择归属部门" /> -->
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色类型" prop="role_ids">
              <el-select
                style="width: 100%"
                v-model="form.role_ids"
                @change="roleChange"
                placeholder="请选择"
                multiple
                collapse-tags
                filterable
              >
                <el-option
                  v-for="item in roleOptions"
                  :key="item.id"
                  :label="item.role_name"
                  :value="item.id"
                  :disabled="item.flag == 1"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <!-- <el-col :span="12">
            <el-form-item label="负责渠道" prop="responsible_channel">
              <el-select
                :disabled="!showChannel"
                multiple
                collapse-tags
                style="width: 100%"
                v-model="form.responsible_channel"
                placeholder="请选择"
              >
                <el-option
                  v-for="item in channelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>-->
          <el-col :span="12">
            <el-form-item label="直属上级">
              <el-select
                style="width: 100%"
                v-model="form.direct_leader"
                placeholder="请选择"
                clearable
              >
                <el-option
                  v-for="item in directOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24"></el-col>
          <el-col :span="12">
            <el-form-item label="权限类型" prop="auth_type">
              <el-radio-group v-model="form.auth_type" @change="authTypeChange">
                <el-radio
                  :disabled="!$checkPermi(['admin:user:custom'])"
                  v-for="item in authTypeOptions"
                  :key="item.value"
                  :label="item.value"
                  >{{ item.label }}</el-radio
                >
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in flagOptions" :key="dict.value" :label="dict.value">{{
                  dict.label
                }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单管理" class="otherClass">
              <el-tabs v-model="activeTab">
                <el-tab-pane label="PC端" name="1">
                  <el-col :span="12">
                    <h1>菜单权限</h1>
                    <el-form-item v-loading="treeLoading">
                      <el-checkbox
                        :disabled="disabledMenu"
                        v-model="menuExpand"
                        @change="handleCheckedTreeExpand($event, 'menu')"
                        >展开/折叠</el-checkbox
                      >
                      <el-checkbox
                        :disabled="disabledMenu"
                        v-model="menuNodeAll"
                        @change="handleCheckedTreeNodeAll($event, 'menu')"
                        >全选/全不选</el-checkbox
                      >
                      <el-checkbox
                        :disabled="disabledMenu"
                        v-model="menuCheckStrictly"
                        @change="handleCheckedTreeConnect($event, 'menu')"
                        >父子联动</el-checkbox
                      >
                      <el-tree
                        :check-strictly="!menuCheckStrictly"
                        :data="menuOptions"
                        :props="defaultProps"
                        :render-after-expand="false"
                        @check="menuChecks"
                        class="tree-border"
                        empty-text="加载中，请稍后"
                        node-key="id"
                        ref="menu"
                        show-checkbox
                        style="height: 280px; overflow: scroll"
                      ></el-tree>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <h1>数据权限</h1>
                    <el-form-item v-loading="treeLoading">
                      <div class="data-class">
                        <el-radio-group
                          :disabled="disabledMenu"
                          v-model="form.data_type"
                          @change="dataTotalChange"
                        >
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
                            :disabled="disabledMenu"
                            v-model="dataExpand"
                            @change="handleCheckedTreeExpand($event, 'data')"
                            >展开/折叠</el-checkbox
                          >
                          <el-checkbox
                            :disabled="disabledMenu"
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
                              :disabled="disabledMenu"
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
                          ref="data"
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
                                  :disabled="disabledMenu"
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
                  <el-col :span="24">
                    <h1>菜单权限</h1>
                    <el-form-item v-loading="treeLoading">
                      <el-checkbox
                        :disabled="disabledMenu"
                        v-model="appletMenuExpand"
                        @change="handleCheckedTreeExpand($event, 'appletMenu')"
                        >展开/折叠</el-checkbox
                      >
                      <el-checkbox
                        :disabled="disabledMenu"
                        v-model="appletMenuNodeAll"
                        @change="handleCheckedTreeNodeAll($event, 'appletMenu')"
                        >全选/全不选</el-checkbox
                      >
                      <el-checkbox
                        :disabled="disabledMenu"
                        v-model="appletMenuCheckStrictly"
                        @change="handleCheckedTreeConnect($event, 'appletMenu')"
                        >父子联动</el-checkbox
                      >
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
                </el-tab-pane>
              </el-tabs>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="短信验证" prop="phone_verification">
              <el-radio-group v-model="form.phone_verification">
                <el-radio :label="1">关闭</el-radio>
                <el-radio :label="2">开启</el-radio>
              </el-radio-group>
              <p class="tips">
                提示：短信验证码开启后会产生一定的费用，如果对用户手机号确定无误，可以关闭短信验证。
              </p>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row></el-row>
        <el-row>
          <el-col :span="12"></el-col>
        </el-row>
        <el-row></el-row>
        <el-row></el-row>
        <el-row></el-row>
      </el-form>
    </BaseDialog>
    <!-- 添加或修改参数配置对话框 -->
  </div>
</template>

<script>
  import '@riophae/vue-treeselect/dist/vue-treeselect.css';
  import { columns, rules } from './config';
  import { companyDownList } from '@/api/system/company.js';
  import { mapGetters } from 'vuex';
  import { treeRole } from '@/api/account/personnel/role.js';
  import { treeselect } from '@/api/account/personnel/dept.js';
  import { treeselect as menuTreeselect } from '@/api/system/menu';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseTable from '@/components/BaseTable/index.vue';
  import SearchPanel from '@/components/Common/SearchPanel';
  import Treeselect from '@riophae/vue-treeselect';
  import { cloneDeep, omit } from 'lodash';
  import {
    listUser,
    getUser,
    addUser,
    updateUser,
    upperUser,
    roleAuthTree,
  } from '@/api/account/personnel/user.js';
  import { STATUS_OPTIONS } from '@/utils/mapper';
  import { REGION_OPTIONS, AUTH_TYPE, CHANNEL_OPTIONS } from '@/utils/common/publicOptions';

  export default {
    name: 'userManage',
    components: { Treeselect, BaseTable, SearchPanel, BaseDialog },
    computed: {
      ...mapGetters(['isAccessUser', 'currentOemId']),
      treeType() {
        return function (item) {
          return [167, 168, 169, 170].includes(Number(item));
        };
      },
      disabledMenu() {
        return this.form.auth_type == 1 || !this.$checkPermi(['admin:user:custom']);
      },
      showChannel() {
        return false;
      },
    },
    data() {
      return {
        search: {
          model: {
            keyword: null,
            dept_name: null,
            role_ids: null,
            status: null,
            auth_type: null,
            oem_id: undefined,
            dateRange: null,
          },
          item: [
            {
              genre: 'input',
              model: 'keyword',
              label: '用户名称：',
              placeholder: '请输入用户ID/名称/手机号',
            },
            {
              genre: 'select',
              label: '部门名称：',
              model: 'dept_name',
              options: [],
            },
            {
              genre: 'select',
              label: '角色：',
              model: 'role_ids',
              multiple: true,
              options: [],
            },
            {
              genre: 'select',
              label: '权限类型：',
              model: 'auth_type',
              options: [
                { value: 1, label: '角色' },
                { value: 2, label: '自定义' },
              ],
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
        //对接媒体下拉
        channelOptions: CHANNEL_OPTIONS,
        //区域下拉选项
        REGION_OPTIONS: REGION_OPTIONS,
        //修改对话框遮罩层
        editLoading: false,
        // 遮罩层
        loading: true,
        // 选中数组
        ids: [],
        // 非单个禁用
        single: true,
        // 非多个禁用
        multiple: true,
        // 显示搜索条件
        showSearch: true,
        // 总条数
        total: 0,
        // 用户表格数据
        userList: [],
        // 弹出层标题
        title: '',
        // 部门树选项
        deptOptions: undefined,
        // 是否显示弹出层
        open: false,
        // 部门名称
        deptName: undefined,
        // 默认密码
        initPassword: undefined,
        // 状态数据字典
        flagOptions: [
          {
            value: 1,
            label: '开启',
          },
          {
            value: 2,
            label: '关闭',
          },
        ],
        // 权限类型字典
        authTypeOptions: [
          {
            value: 1,
            label: '角色',
          },
          {
            value: 2,
            label: '自定义',
          },
        ],
        // 性别状态字典
        sexOptions: [
          {
            value: 1,
            label: '男性',
          },
          {
            value: 2,
            label: '女性',
          },
        ],
        // 岗位选项
        postOptions: [],
        // 角色选项
        roleOptions: [],
        // 表单参数
        form: { phone_verification: 1 },
        defaultProps: {
          children: 'children',
          label: 'label',
          disabled: this.treeDisabled,
        },
        // 表单校验
        rules: rules,
        dataExpand: false,
        dataNodeAll: false,
        dataCheckStrictly: true,
        dataOptions: [],
        menuExpand: false,
        menuNodeAll: false,
        menuCheckStrictly: true,
        menuOptions: [],
        AUTH_TYPE: AUTH_TYPE,
        directOptions: [],
        account_id: null,
        typeMain: '',
        dataType: [
          {
            value: 1,
            label: '系统默认',
          },
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
        defindShow: false,
        copy_auth_router: [],
        copy_auth_data: [],
        init_auth_router: [],
        init_data_type: null,
        init_auth_data: [],
        treeLoading: false,

        dialogOkLoading: false,

        activeTab: '1',
        appletMenuExpand: false,
        appletMenuNodeAll: false,
        appletMenuCheckStrictly: true,
        appletMenuOptions: [],
        copy_applet_router: [],
        init_applet_router: [],
      };
    },
    created() {
      this.getList();
      this.getTreeselect();
      this.getTreeRole();
      if (this.isAccessUser) {
        this.search.item[this.findSearchIndex('oem_id')].show = true;
        this.getOem();
      }
    },
    activated() {
      this.getList();
      this.getTreeselect();
      this.getTreeRole();
      if (this.isAccessUser) {
        this.search.item[this.findSearchIndex('oem_id')].show = true;
        this.getOem();
      }
    },
    methods: {
      visibleChange(val, type) {
        if (type == 'ok') {
          this.submitForm();
        }
        this.open = val;
      },

      findSearchIndex(model) {
        let num = this.search.item.findIndex((item) => item.model == model);
        return num;
      },
      getSearchItem(model) {
        return this.search.item.find((v) => v.model == model);
      },
      async getOem() {
        let { data: res } = await companyDownList();
        if (res && res.length) {
          this.getSearchItem('oem_id').options = res.map((v) => {
            return { label: v.name, value: v.id };
          });
        }
      },
      paginationChange(val) {
        this.pagination = val;
        this.getList();
      },
      /** 查询用户列表 */
      getList() {
        this.loading = true;
        const { pagination, search } = this;
        const params = Object.assign({ interface_id: 16 }, pagination, search.model);
        delete params.dateRange;
        if (search.model.dateRange?.length) {
          params.params = {
            beginTime: search.model.dateRange[0],
            endTime: search.model.dateRange[1],
          };
        }
        listUser(params)
          .then((data) => {
            this.userList = data.data?.map((i) => {
              i.flag_status = i.status;
              return i;
            });
            this.pagination.count = data.count;
          })
          .catch((err) => {
            this.$notify.error(err?.message || err || '获取用户数据失败');
          })
          .finally(() => {
            this.loading = false;
          });
      },
      getTreeRole() {
        return treeRole().then((data) => {
          this.roleOptions = data.data || [];
          this.getSearchItem('role_ids').options = (data.data || []).map((v) => {
            return { label: v.role_name, value: v.id };
          });
        });
      },
      /** 查询部门下拉树结构 */
      getTreeselect() {
        return treeselect().then((data) => {
          this.deptOptions = data.data;
          this.getSearchItem('dept_name').options = data.data.map((v) => {
            return { label: v.label, value: v.id };
          });
        });
      },
      // 筛选节点
      filterNode(value, data) {
        if (!value) return true;
        return data.label.indexOf(value) !== -1;
      },
      // 用户状态修改
      handleStatusChange(row) {
        let text = row.flag_status === 1 ? '启用' : '停用';
        this.$confirm('确认要' + text + '【' + row.name + '】用户吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(function () {
            return updateUser({ id: row.id, status: row.flag_status });
          })
          .then(() => {
            this.$notify.success(text + '成功');
            this.getList();
          })
          .catch(function (e) {
            that.tableLoading = false;
            that.$notify.error(e);
            row.flag_status = row.flag_status === 1 ? 2 : 1;
          });
      },
      // 取消按钮
      cancel() {
        this.open = false;
        this.reset();
      },
      // 表单重置
      reset() {
        if (this.$refs.menu != undefined) {
          this.$refs.menu.setCheckedKeys([]);
        }
        if (this.$refs.data != undefined) {
          this.$refs.data.setCheckedKeys([]);
        }
        this.menuExpand = false;
        this.menuNodeAll = false;
        this.dataExpand = false;
        this.dataNodeAll = false;
        this.form = {
          auth_type: 1,
          data_type: 1,
          department: [],
          direct_leader: undefined,
          email: undefined,
          status: 1,
          gender: undefined,
          id: undefined,
          name: undefined,
          password: undefined,
          region: [],
          remark: undefined,
          responsible_channel: [],
          applet_router: [],
          role_ids: [],
          telephone: undefined,
        };

        this.activeTab = '1';
        this.appletMenuExpand = false;
        this.appletMenuNodeAll = false;
        this.appletMenuCheckStrictly = true;
        this.resetForm('form');
      },
      /** 搜索按钮操作 */
      handleQuery() {
        this.pagination.page = 1;
        this.getList();
      },
      /** 重置按钮操作 */
      resetQuery() {
        this.search.model = {
          keyword: '',
          dept_name: null,
          role_ids: [],
          status: null,
          auth_type: null,
          oem_id: undefined,
          dateRange: null,
        };
        this.handleQuery();
      },
      // 多选框选中数据
      // handleSelectionChange(selection) {
      //   this.ids = selection.map((item) => item.id);
      //   this.single = selection.length != 1;
      //   this.multiple = !selection.length;
      // },
      /** 新增按钮操作 */
      async handleAdd() {
        this.title = '添加用户';
        this.reset();
        this.open = true;
        this.form.data_type = 1;
        this.$set(this.form, 'phone_verification', 1);
        this.defindShow = false;
        this.editLoading = true;
        Promise.all([this.getTreeselect(), this.getTreeRole(), this.getMenuTreeselect()])
          .then((response) => {
            this.$nextTick(() => {
              for (var i in this.$refs.menu.store.nodesMap) {
                this.$set(this.$refs.menu.store.nodesMap[i], 'forbid', true);
              }
              for (var i in this.$refs.appletMenu.store.nodesMap) {
                this.$set(this.$refs.appletMenu.store.nodesMap[i], 'forbid', true);
              }
            });
            this.editLoading = false;
          })
          .catch(() => {
            this.editLoading = false;
          });
      },
      /** 修改按钮操作 */
      async handleUpdate(row) {
        this.title = '修改用户';
        this.reset();
        const id = row.id || this.ids;
        this.account_id = id;
        this.form.password = '';
        this.init_auth_router = [];
        this.init_auth_data = [];
        this.init_applet_router = [];
        this.open = true;
        this.editLoading = true;
        let all = [
          getUser({ id: id }),
          this.getTreeRole(),
          this.getMenuTreeselect({
            company: row.company,
            account_id: id,
            method: 'user',
          }),
          this.getTreeselect(),
        ];
        Promise.all(all)
          .then((response) => {
            let data = response[0];
            this.form = data.data || {};
            this.form.auth_type = this.form.auth_type || 1;
            this.form.data_type = this.form.data_type || 5;
            this.dataTotalChange(this.form.data_type);

            this.form.role_ids = this.form.role_ids.split(',').map((item) => Number(item));
            this.init_auth_data = cloneDeep(this.form.auth_data);
            this.init_auth_router = cloneDeep(this.form.auth_router);
            this.init_applet_router = cloneDeep(this.form.applet_router);
            this.init_data_type = this.form.data_type;

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
                this.$refs.data.setChecked(v.interface_id, true, false);
                if (this.$refs.data.getNode(v.interface_id))
                  this.$refs.data.getNode(v.interface_id).data.model = v.type;
              });

              checkedKeys = this.form.applet_router || [];
              checkedKeys.forEach((v) => {
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

              this.roleChange(data.data.role_ids, true);
              this.deptChange(data.data.department);
              this.editLoading = false;
            });
          })
          .catch((e) => {
            console.log(e);
            this.$notify.error('数据获取失败');
            this.editLoading = false;
          });
      },
      /** 重置密码按钮操作 */
      handleResetPwd(row) {
        this.$prompt('请输入"' + row.name + '"的新密码', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
          .then(({ value }) => {
            updateUser({ id: row.id, password: value })
              .then((response) => {
                this.$notify.success('修改成功，新密码是：' + value);
              })
              .catch((e) => this.$notify.error(e));
          })
          .catch(() => {});
      },
      /** 提交按钮 */
      submitForm: function () {
        this.dialogOkLoading = true;
        this.$refs['form'].validate((valid) => {
          if (valid) {
            this.form.auth_router = this.getMenuAllCheckedKeys();
            if (this.form.data_type != 5)
              this.$refs.data.getCheckedNodes(true).map((t) => (t.model = this.form.data_type));
            this.form.auth_data = this.getDataAllCheckedKeys();
            this.form.applet_router = this.getAppletMenuAllCheckedKeys();
            this.form.data_type = this.form.data_type;

            let obj = omit(cloneDeep(this.form), [
              'account_id',
              'address',
              'avatar',
              'avatar_type',
              'collaborators',
              'contacts',
              'create_time',
              'create_user_id',
              'role_names',
              'update_time',
              'update_user_id',
              'version',
              'wechat_fast_login',
            ]);
            if (this.form.id != undefined) {
              obj = omit(obj, ['password', 'uid']);
              if (!this.form.telephone) obj.telephone = null;
              if (!this.form.direct_leader) obj.direct_leader = null;
              updateUser(obj)
                .then((res) => {
                  if (res.code == 0 || res.code == 200) {
                    this.$notify.success('修改成功');
                    this.open = false;
                    this.getList();
                  } else {
                    this.$notify.error('修改失败');
                  }
                  this.dialogOkLoading = false;
                })
                .catch((e) => {
                  this.$notify.error(e);
                  this.dialogOkLoading = false;
                });
            } else {
              addUser(obj)
                .then((response) => {
                  if (response.code == 0) this.$notify.success('新增成功');
                  else this.$notify.error(`新增失败,${response.message}`);
                  this.open = false;
                  this.getList();
                  this.dialogOkLoading = false;
                })
                .catch((e) => {
                  this.$notify.error(e);
                  this.dialogOkLoading = false;
                });
            }
          } else {
            this.dialogOkLoading = false;
          }
        });
      },
      /** 删除按钮操作 */
      handleDelete(row) {
        const ids = row.id || this.ids;
        const status = row.status == 3 ? 1 : 3;

        this.$confirm(`确认删除【${row.id}】${row.name}`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            return updateUser({ id: ids, status });
          })
          .then(() => {
            this.getList();
            this.$notify.success('操作成功');
          })
          .catch(() => {});
      },
      // 树权限（展开/折叠）
      handleCheckedTreeExpand(value, type) {
        if (['menu', 'data', 'appletMenu'].includes(type)) {
          for (var i in this.$refs[type].store.nodesMap) {
            this.$refs[type].store.nodesMap[i].expanded = value;
          }
        }
      },
      // 树权限（全选/全不选）
      handleCheckedTreeNodeAll(value, type) {
        if (type == 'menu') {
          this.$refs.menu.setCheckedNodes(value ? this.menuOptions : []);
          if (value) {
            this.$refs.data.setCheckedNodes(this.$refs.menu.getCheckedNodes(false, true));
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
        } else if (type == 'data') {
          this.$refs.data.setCheckedNodes(value ? this.dataOptions : []);
        } else if (type == 'appletMenu') {
          this.$refs.appletMenu.setCheckedNodes(value ? this.appletMenuOptions : []);
          if (value) {
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
        }
      },
      // 树权限（父子联动）
      handleCheckedTreeConnect(value, type) {
        if (type == 'menu') {
          this.menuCheckStrictly = value ? true : false;
        } else if (type == 'data') {
          this.dataCheckStrictly = value ? true : false;
        } else if (type == 'data') {
          this.appletMenuCheckStrictly = value ? true : false;
        }
      },
      /** 查询菜单树结构 */
      getMenuTreeselect(search = {}) {
        return Promise.all([
          menuTreeselect({ ...search, router_type: 1 }),
          menuTreeselect({ ...search, type: 'edit', router_type: 2 }),
        ]).then(([menu, applet]) => {
          this.menuOptions = menu.data;
          this.dataOptions = menu.result;
          this.appletMenuOptions = applet.data;

          this.$nextTick(function () {
            this.menuChecks(null, {
              checkedKeys: [],
              halfCheckedKeys: [],
            });
            // this.appletMenuChecks(null, {
            //   checkedKeys: [],
            //   halfCheckedKeys: [],
            // });
          });
        });
        // return menuTreeselect(search).then((data) => {
        //   this.menuOptions = data.data;
        //   this.dataOptions = data.result;
        //   this.$nextTick(function () {
        //     this.menuChecks(null, {
        //       checkedKeys: [],
        //       halfCheckedKeys: [],
        //     });
        //   });
        // });
      },
      // 所有菜单节点数据
      getMenuAllCheckedKeys() {
        // 目前被选中的菜单节点
        let checkedKeys = this.$refs.menu.getCheckedKeys();
        // 半选中的菜单节点
        let halfCheckedKeys = this.$refs.menu.getHalfCheckedKeys();
        checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        checkedKeys = this.setParentNode(checkedKeys);
        return checkedKeys;
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
      setParentNode(checkedKeys) {
        let result = [];
        checkedKeys.forEach((key) => {
          let pnode = this.$refs.menu.getNodePath(key).map((item) => item.id);
          result.push(...pnode);
        });
        return [...new Set(result)];
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
        // let checkedKeys = this.$refs.data.getCheckedKeys();
        // // 半选中的菜单节点
        // let halfCheckedKeys = this.$refs.data.getHalfCheckedKeys();
        // console.log(this.$refs.data.getCheckedNodes(false, true))
        // console.log(halfCheckedKeys)
        // checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
        let checkedKeys = [];
        this.$refs.data.getCheckedNodes(false, true).forEach((t) => {
          if (
            this.$refs.data.getNode(t.id).visible &&
            (this.$refs.data.getNode(t.id).checked || this.$refs.data.getNode(t.id).indeterminate)
          ) {
            checkedKeys.push({
              interface_id: t.id,
              type: t.model ?? null,
            });
          }
        });
        return checkedKeys;
      },
      roleChange(val, bool) {
        if (!val.length) return;
        this.treeLoading = true;
        if (!bool) {
          this.form.data_type = 5;
          this.defindShow = true;
          this.form.responsible_channel = [];
          this.form.direct_leader = undefined;
          roleAuthTree({ role_ids: val }).then((res) => {
            this.copy_auth_router = JSON.parse(JSON.stringify(res.data.auth_router));
            this.copy_auth_data = JSON.parse(JSON.stringify(res.data.auth_data));
            this.copy_applet_router = res.data.applet_router;

            // 当被禁用的时候赋值会失败，只有先可用才能通过key设置勾选成功
            for (var i in this.$refs.menu.store.nodesMap) {
              this.$set(this.$refs.menu.store.nodesMap[i], 'forbid', false);
            }
            //

            for (var i in this.$refs.appletMenu.store.nodesMap) {
              this.$set(this.$refs.appletMenu.store.nodesMap[i], 'forbid', false);
            }

            this.treeChange(res.data.auth_router, res.data.auth_data);
            this.appletTreeChange(res.data.applet_router);
            for (var i in this.$refs.menu.store.nodesMap) {
              this.$set(this.$refs.menu.store.nodesMap[i], 'forbid', this.disabledMenu);
            }
            for (var i in this.$refs.data.store.nodesMap) {
              this.$set(this.$refs.data.store.nodesMap[i], 'forbid', this.disabledMenu);
            }

            for (var i in this.$refs.appletMenu.store.nodesMap) {
              this.$set(this.$refs.appletMenu.store.nodesMap[i], 'forbid', this.disabledMenu);
            }
            this.treeLoading = false;
          });
        } else {
          this.copy_auth_router = JSON.parse(JSON.stringify(this.form.auth_router));
          this.copy_auth_data = JSON.parse(JSON.stringify(this.form.auth_data));
          this.copy_applet_router = JSON.parse(JSON.stringify(this.form.applet_router));
          for (var i in this.$refs.menu.store.nodesMap) {
            this.$set(this.$refs.menu.store.nodesMap[i], 'forbid', this.disabledMenu);
          }
          for (var i in this.$refs.data.store.nodesMap) {
            this.$set(this.$refs.data.store.nodesMap[i], 'forbid', this.disabledMenu);
          }

          for (var i in this.$refs.appletMenu.store.nodesMap) {
            this.$set(this.$refs.appletMenu.store.nodesMap[i], 'forbid', this.disabledMenu);
          }
          this.treeLoading = false;
        }
        this.deptChange();
      },
      typeChange(id) {
        this.typeMain = '';
        this.$refs.data.setChecked(id, true, false);
      },
      interfaceChange(data, isCheck) {
        this.typeMain = '';
        if (!data.children) {
          data.model = isCheck ? data.model || 1 : null;
        }
      },
      typeMainChange(val) {
        this.$refs.data.getCheckedNodes(true, false).map((t) => (t.model = val));
      },
      dataTotalChange(val) {
        this.defindShow = val == 5;
        // if (!bool) this.$refs.data.setCheckedNodes(this.dataOptions);
      },
      menuChecks(data, result) {
        let array = [...result.checkedKeys, ...result.halfCheckedKeys];
        this.$refs.data.filter(array);
        array.forEach((t, index) => {
          if (this.$refs.data.store.nodesMap[t]) {
            this.$refs.data.store.nodesMap[t].expanded = this.$refs.menu.getNode(t).expanded;
          }
        });
        if (data) {
          if (data.menu_type == 'F') this.$refs.data.setChecked(data.pid, true, true);
          else this.$refs.data.setChecked(data.id, true, true);
        }
      },
      appletMenuChecks(data, result) {
        let array = [...result.checkedKeys, ...result.halfCheckedKeys];
        this.$refs.data.filter(array);
        // array.forEach((t, index) => {
        //   if (this.$refs.data.store.nodesMap[t]) {
        //     this.$refs.data.store.nodesMap[t].expanded =
        //       this.$refs.menu.getNode(t).expanded;
        //   }
        // });
      },
      dataFilterNode(value, data, node) {
        return value.includes(data.id);
      },
      authTypeChange(val) {
        if (this.title == '添加用户') {
          if (val == 1) {
            this.treeChange(this.copy_auth_router, this.copy_auth_data);
            this.appletTreeChange(this.copy_applet_router);
          }
        } else if (this.title == '修改用户') {
          if (val == 1) {
            this.roleChange(this.form.role_ids);
          } else {
            for (var i in this.$refs.menu.store.nodesMap) {
              this.$set(this.$refs.menu.store.nodesMap[i], 'forbid', false);
            }
            for (var i in this.$refs.appletMenu.store.nodesMap) {
              this.$set(this.$refs.appletMenu.store.nodesMap[i], 'forbid', false);
            }
            this.treeChange(this.init_auth_router, this.init_auth_data);
            this.appletTreeChange(this.init_applet_router);
            // this.treeChange(this.copy_auth_router, this.copy_auth_data);
          }
        }

        let permission = !this.$checkPermi(['admin:user:custom']);
        for (var i in this.$refs.menu.store.nodesMap) {
          this.$set(this.$refs.menu.store.nodesMap[i], 'forbid', val == 1 || permission);
        }
        for (var i in this.$refs.data.store.nodesMap) {
          this.$set(this.$refs.data.store.nodesMap[i], 'forbid', val == 1 || permission);
        }

        for (var i in this.$refs.appletMenu.store.nodesMap) {
          this.$set(this.$refs.appletMenu.store.nodesMap[i], 'forbid', val == 1 || permission);
        }
      },
      treeDisabled(data, node) {
        return node.forbid;
      },
      treeChange(auth_router, auth_data) {
        let checkedKeys = auth_router;
        this.$refs.menu.setCheckedKeys([]);
        checkedKeys.forEach((v) => {
          this.$refs.menu.setChecked(v, true, false);
        });
        let ids = [];
        this.$nextTick(() => {
          let result = this.$refs.menu.getCheckedNodes(false, true);
          result.forEach((t) => {
            ids.push(t.id);
          });

          this.menuChecks(null, {
            checkedKeys: ids,
            halfCheckedKeys: '',
          });
          checkedKeys = auth_data;
          checkedKeys.forEach((v) => {
            this.$refs.data.setChecked(v.interface_id, true, false);
          });

          this.$nextTick(() => {
            checkedKeys.forEach((v) => {
              let result = this.$refs.data
                .getCheckedNodes(false, true)
                .find((t) => t.id == v.interface_id);
              if (result && !result.children) result.model = v.type;
            });
          });
        });
      },
      appletTreeChange(router, data) {
        let checkedKeys = router;
        this.$refs.appletMenu.setCheckedKeys([]);
        checkedKeys.forEach((v) => {
          this.$refs.appletMenu.setChecked(v, true, false);
        });
        // let ids = [];
        // this.$nextTick(() => {
        //   let result = this.$refs.menu.getCheckedNodes(false, true);
        //   result.forEach((t) => {
        //     ids.push(t.id);
        //   });

        //   this.menuChecks(null, {
        //     checkedKeys: ids,
        //     halfCheckedKeys: "",
        //   });
        //   checkedKeys = data;
        //   checkedKeys.forEach((v) => {
        //     this.$refs.data.setChecked(v.interface_id, true, false);
        //   });

        //   this.$nextTick(() => {
        //     checkedKeys.forEach((v) => {
        //       let result = this.$refs.data
        //         .getCheckedNodes(false, true)
        //         .find((t) => t.id == v.interface_id);
        //       if (result && !result.children) result.model = v.type;
        //     });
        //   });
        // });
      },
      deptChange(val) {
        if (this.form.role_ids && this.form.role_ids.length == 0) return;
        upperUser({
          role_ids: this.form.role_ids,
          account_id: this.account_id,
          dept_ids: val || this.form.department,
        }).then((res) => {
          let obj = res.data.filter((item) => item.id == this.form.direct_leader);
          if (obj.length == 0) this.form.direct_leader = undefined;
          this.directOptions = res.data;
        });
      },
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
    width: 100px;
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
  .el-tag + .el-tag {
    margin-left: 4px;
  }
  .tips {
    color: red;
    font-size: 12px;
    line-height: 22px;
  }

  .otherClass {
    ::v-deep .el-form-item__label {
      height: 40px !important;
      line-height: 40px !important;
    }
  }
</style>
