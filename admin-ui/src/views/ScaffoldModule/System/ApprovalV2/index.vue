<template>
  <div>
    <SearchPanel
      :search="search"
      shadow="all"
      @onSubmit="searchSubmit"
      @onReset="searchReset"
    ></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="tableList"
      :loading="tableLoading"
      :pagination="pagination"
      @refresh="queryList(true)"
      @handleDelete="handleDelete"
      @handleUpdate="handleUpdate"
    >
      <template #header_left>
        <el-button type="primary" @click="add" :disabled="!$checkPermi(['sys:approvalV2:add'])">
          新建审批流管理
        </el-button>
      </template>

      <template #business_category="{ row }">
        {{ BUINESS_TYPE_MAPPER[row.business_category] }}
      </template>

      <template #type="{ row }">
        {{ COMMON_MAPPER[row.business_category][row.type] }}
      </template>

      <template #select_length="{ row }">
        {{ row.config.length }}
      </template>
    </BaseTable>

    <BaseDrawer title="平台信息" :visible.sync="visible" size="1200px" @close="close">
      <el-card :style="{ margin: '10px' }">
        <el-form
          ref="form"
          v-loading="formLoading"
          label-width="120px"
          :rules="rules"
          :model="form"
        >
          <el-form-item label="业务类别">
            <el-radio-group v-model="form.business_category" @change="businessTypeChange">
              <el-radio
                v-for="(item, key) in BUINESS_TYPE_MAPPER"
                :key="key"
                :label="Number(key)"
                >{{ item }}</el-radio
              >
            </el-radio-group>
          </el-form-item>

          <el-form-item label="审批流类目">
            <div class="radio-group">
              <el-radio-group v-model="form.type">
                <el-radio v-for="(item, key) in approvalList" :key="key" :label="Number(key)">{{
                  item
                }}</el-radio>
              </el-radio-group>
            </div>
          </el-form-item>

          <el-form-item label="审批流配置" required>
            <el-row :gutter="20" type="flex" class="aproval-row">
              <el-col :span="11">
                <div class="row-item--border pt50">
                  <div class="row-item--header">
                    <el-input placeholder="输入关键字进行过滤" v-model="filterText" clearable>
                    </el-input>
                  </div>
                  <div class="row-item--content">
                    <el-tree
                      ref="treeRef"
                      node-key="uid"
                      default-expand-all
                      show-checkbox
                      :data="accountTree"
                      :props="defaultProps"
                      :filter-node-method="filterNode"
                      @check="treeCheck"
                    ></el-tree>
                  </div>
                </div>
              </el-col>
              <el-col :span="2" class="col-button">
                <el-button :disabled="buttonDisabled" type="primary" size="medium" @click="saveTree"
                  >保存</el-button
                >
              </el-col>
              <el-col :span="11">
                <div class="row-item--border">
                  <el-table :data="selectTable" height="398" row-key="uid">
                    <el-table-column label="审批次序" min-width="60">
                      <template slot-scope="{ row, column, $index }">
                        {{ $index + 1 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="审批人" min-width="150">
                      <template slot-scope="{ row }">
                                              {{row.name}}
                        <!-- <el-tag v-for="(item, index) in row.name.split(',')" :key="index">{{ item }}</el-tag> -->
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" min-width="90">
                      <template slot-scope="{ row, column, $index }">
                        <el-button type="text" class="margin-right" @click="edit(row, $index)"
                          >编辑</el-button
                        >
                        <el-button type="text" @click="del($index)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item label="审批流概览">
            <template v-if="selectTable.length">
              <div>{{ selectTable.length }}个层级依次审批</div>
              <div class="approval-stream">
                <div v-for="(item, index) of selectTable" :key="index" class="approval-stream-item">
                  <div class="approval-stream-item--name">
                    {{ item.name }}
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <span style="color: #606266">请先配置审批流</span>
            </template>
          </el-form-item>

          <el-form-item label="备注说明">
            <el-input v-model="form.remark" placeholder=""></el-input>
          </el-form-item>
        </el-form>
      </el-card>
      <div slot="footer" class="dialog-footer" :style="{ margin: '10px' }">
        <el-button @click="close">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submit">确 定</el-button>
      </div>
    </BaseDrawer>
  </div>
</template>

<script>
  import SearchPanel from '@/components/Common/SearchPanel';
  import BaseDrawer from '@/components/BaseDrawer';
  import BaseTable from '@/components/BaseTable';
  import { STATUS_OPTIONS } from '@/utils/mapper.js';
  import { approvalUser } from '@/api/business/public.js';
  import { list, add, def, del } from '@/api/system/approvalV2.js';
  import { columns, BUINESS_TYPE_MAPPER, COMMON_MAPPER } from './data';

  export default {
    name: 'sysApprovalV2',
    components: {
      SearchPanel,
      BaseTable,
      BaseDrawer,
    },
    data() {
      return {
        search: {
          model: {
            status: '',
            business_category: '',
            type: '',
          },
          item: [
            {
              genre: 'select',
              label: '状态：',
              model: 'status',
              options: STATUS_OPTIONS,
              placeholder: '不限',
            },
            {
              genre: 'select',
              label: '业务类别：',
              model: 'business_category',
              options: BUINESS_TYPE_MAPPER,
              placeholder: '不限',
            },
            {
              genre: 'select',
              label: '审批流项目：',
              model: 'type',
              options: [],
              placeholder: '不限',
            },
          ],
        },
        tableLoading: false,
        columns,
        tableList: [],
        pagination: { pagesize: 20, count: 0, page: 1 },
        visible: false,
        form: {
          id: null,
          business_category: 1,
          type: 1,
          remark: '',
        },
        defaultProps: {
          children: 'children',
          label: 'name',
        },
        accountTree: [],
        filterText: '',
        submitLoading: false,
        BUINESS_TYPE_MAPPER,
        COMMON_MAPPER,
        formLoading: false,
        selectList: [],
        selectTable: [],
        editIndex: null,
      };
    },
    computed: {
      approvalList() {
        return COMMON_MAPPER[this.form.business_category];
      },
      buttonDisabled() {
        return !this.selectList.length;
      },
    },
    watch: {
      filterText(val) {
        this.$refs.treeRef.filter(val);
      },
    },
    methods: {
      searchSubmit() {
        this.queryList(true);
      },
      searchReset() {
        this.search.model = {
          status: '',
          business_category: '',
          type: '',
        };
        this.queryList(true);
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
        this.tableList = [];
        list(params)
          .then((data) => {
            this.tableLoading = false;
            this.tableList = data.data;
            this.pagination.count = data.count;
          })
          .catch((err) => {
            this.tableLoading = false;
          });
      },
      add() {
        this.visible = true;
      },
      businessTypeChange() {
        this.form.type = '';
      },
      filterNode(value, data) {
        if (!value) return true;
        return data.id && data.name.indexOf(value) !== -1;
      },

      getAccountTree() {
        approvalUser().then((data) => {
          this.formatAccountList(data.data);
        });
      },
      formatAccountList(list = []) {
        const roleMap = new Map();
        const roleTree = [];
        list.forEach((v) => {
          v.uid = `${v.role_id}-${v.id}`;
          if (roleMap.has(v.role_id)) {
            const index = roleMap.get(v.role_id);
            roleTree[index].children.push(v);
          } else {
            const newRole = {
              uid: v.role_id,
              id: v.id,
              name: v.role_name,
              children: [],
            };
            newRole.children.push(v);
            roleTree.push(newRole);
            roleMap.set(v.role_id, roleTree.length - 1);
          }
        });
        this.accountTree = roleTree;
        roleMap.clear();
      },
      close() {
        this.form = {
          id: null,
          business_category: 1,
          type: 1,
          remark: '',
        };
        this.selectList = [];
        this.selectTable = [];
        this.editIndex = null;
        this.visible = false;
        this.submitLoading = false;
        this.formLoading = false;
        this.filterText = '';
        this.$refs.treeRef.setCheckedKeys([]);
      },
      treeCheck() {
        this.selectList = this.$refs.treeRef.getCheckedNodes(true);
      },
      saveTree() {
        let obj = {
          name: this.selectList.map((t) => t.name).toString(),
          id: [...new Set(this.selectList.map((t) => t.id))],
          data: this.selectList,
        };

        if (this.editIndex || this.editIndex === 0) {
          this.selectTable[this.editIndex].name = obj.name;
          this.selectTable[this.editIndex].data = obj.data;
          this.selectTable[this.editIndex].id = obj.id;
          this.editIndex = null;
        } else {
          this.selectTable.push(obj);
        }

        this.$refs.treeRef.setCheckedKeys([]);
      },
      edit(row, index) {
        this.$refs.treeRef.setCheckedNodes(row.data);
        this.editIndex = index;
      },
      del(index) {
        this.editIndex = null;
        this.selectTable.splice(index, 1);
      },
      submit() {
        if (!this.form.type) {
          return this.$notify.warning('请先选择审批流类目！');
        }
        if (!this.selectTable.length) {
          return this.$notify.warning('请先配置审批流！');
        }

        this.submitLoading = true;
        let obj = {
          ...this.form,
          config: this.selectTable,
        };
        add(obj)
          .then(() => {
            this.submitLoading = false;
            this.$notify.success('保存成功！');
            this.close();
            this.searchSubmit();
          })
          .catch((err) => {
            this.submitLoading = false;
            this.$notify.error(err || '保存失败！');
          });
      },
      dealOptions() {
        let obj = {};
        for (let i in COMMON_MAPPER) {
          obj = { ...obj, ...COMMON_MAPPER[i] };
        }
        this.search.item.find((t) => t.model == 'type').options = obj;
      },
      handleUpdate(row) {
        this.visible = true;
        this.formLoading = true;
        def({ id: row.id }).then((res) => {
          this.formLoading = false;
          this.form = res.data;
          this.selectTable = res.data.config;
        });
      },
      handleDelete(row) {
        this.$confirm(`确认删除该审批流?`, '提示', {
          type: 'warning',
          callback: (action) => {
            if (action == 'confirm') {
              del({ id: row.id })
                .then(() => {
                  this.$notify.success('删除成功！');
                  this.queryList(false);
                })
                .catch((err) => {
                  this.$notify.error(err || '删除失败！');
                });
            }
          },
        });
      },
    },
    mounted() {
      this.queryList();
      this.getAccountTree();
      this.dealOptions();
    },
  };
</script>

<style lang="scss" scoped>
  .aproval-row {
    height: 400px;
  }
  .row-item--border {
    position: relative;
    border: 1px solid #e4e7ed;
    height: 100%;
    overflow: auto;
  }
  .pt50 {
    padding-top: 50px;
    overflow: unset;
  }
  .row-item--header {
    position: absolute;
    top: 0;
    width: 100%;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    .el-input {
      padding: 8px 10px;
    }
    ::v-deep .el-input__inner {
      border-color: transparent;
    }
  }
  .row-item--content {
    height: 100%;
    overflow: auto;
  }
  .approval-stream {
    :last-child {
      &::after {
        content: '';
      }
    }
  }
  .approval-stream-item {
    position: relative;
    display: inline-block;
    padding-right: 40px;
    margin-bottom: 10px;
    &:after {
      content: '\e6e0';
      position: absolute;
      right: 10px;
      top: 16px;
      font-family: element-icons;
      font-size: 20px;
      color: var(--theme-default);
    }
  }
  .approval-stream-item--name {
    padding: 10px;
    min-width: 120px;
    max-width: 240px;
    text-align: center;
    border: 1px solid #e4e7ed;
  }
  .radio-group {
    display: flex;
    flex-wrap: wrap;

    ::v-deep .el-radio {
      width: 100px;
      margin-top: 10px;
    }
  }
  .col-button {
    display: flex;
    align-items: center;
  }
  .margin-right {
    margin-right: 10px;
  }
</style>
