<template>
  <div id="app">
    <div>
      <search-panel
        showAll
        :search="searchConfig"
        @onSubmit="onSubmit"
        @onReset="onReset"
      ></search-panel>

      <BaseTable
        :columns="columns"
        :data="tableData"
        :loading="tableLoading"
        :pagination="pagination"
        columnsKey="e9008560-7c85-4d5f-95cd-481c9f1f57c3"
        type="selection"
        :useCount="false"
        @look-count="lookCount"
        @select-change="selectChange"
        @refresh="getTableData(false)"
        @pagination-change="getTableData(false)"
        @handleRecall="handleRecall"
        @handleDelete="handleDelete"
        @handleRestore="handleRestore"
        @handleEdit="handleEdit"
        @handleSend="handleSend"
      >
        <template #header_left>
          <el-button type="primary" class="mr10" @click="addNewMsg"> 新增消息 </el-button>

          <AuthDropDown :items="dropdownsItem" @command="batchOperate">
            <el-button>
              批量操作
              <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
          </AuthDropDown>
        </template>
        <template #custom_preview="{ row }">
          <el-button type="text" @click="handlePreview(row)">预览</el-button>
        </template>
        <template #custom_send_status="{ row }">
          <BaseStatus
            :mapper="MESSAGE_STATUS_MAPPER"
            :iconClass="rowStatusClass"
            :status="row.send_status"
          >
          </BaseStatus>
        </template>
      </BaseTable>
    </div>

    <!-- 预览 -->
    <BaseDialog :showFooter="false" title="消息预览" width="600px" :visible.sync="previewVisible">
      <MessageCard :subTitle="previewMessageTitle" :content="previewContent"></MessageCard>
    </BaseDialog>

    <!-- 新增 -->
    <MessageAdd
      ref="addRef"
      @success="getTableData(false)"
      @handleMessageStatus="handleMessageStatus"
    ></MessageAdd>
  </div>
</template>
<script>
  import BaseTable from '@/components/BaseTable/index.vue';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseStatus from '@/components/BaseCopy/status.vue';
  import {
    list,
    del as changeDataStatus,
    updateStatus as changeMessageStatus,
  } from '@/api/system/messageManagement.js';
  import { dropdownsItem, tableItems, initSearch, checkAction } from './data';
  import { MESSAGE_TYPE_MAPPER, MESSAGE_STATUS_MAPPER } from '@/utils/mapper';

  let notify = null;
  export default {
    name: 'msgManage',
    components: {
      BaseTable,
      BaseDialog,
      BaseStatus,
      SearchPanel: () => import('@/components/Common/SearchPanel'),
      AuthDropDown: () => import('@/components/Common/AuthDropDown'),
      MessageCard: () => import('./create/comps/MessageCard.vue'),
      MessageAdd: () => import('./create'),
    },
    data() {
      return {
        MESSAGE_STATUS_MAPPER,
        columns: tableItems,
        dropdownsItem,
        searchConfig: initSearch(),
        tableData: [],
        selections: [],
        pagination: { pagesize: 20, count: 0, page: 1, next: false, site: 0 },
        tableLoading: false,
        previewVisible: false,
        previewMessageTitle: null,
        previewContent: null,
      };
    },
    created() {
      this.getTableData(false);
    },
    methods: {
      onReset() {
        this.searchConfig.model = initSearch().model;
        this.pagination = this.$options.data().pagination;
        this.getTableData(true);
      },
      onSubmit() {
        this.getTableData(false);
      },
      // 查看总数
      lookCount() {
        this.getTableData(false, true);
      },
      getTableData(reset,is_query_count) {
        if (reset) this.pagination.page = 1;        
        const params = {
          ...this.searchConfig.model,
          ...this.pagination,
        };
        // 是否为查看 总数 （若为处理 请求参数）
        if (is_query_count) {
          params.query_count = true;
        } else {
          if (this.pagination.page == 1) this.pagination.site = 0;
        }

        this.tableLoading = true;
        list(params)
          .then((res) => {
            // 是否为查看 总数 （若为则走 赋值总数）
            if (is_query_count) {
              this.pagination.count = res.count; // 赋值总数
            } else {
              this.tableData = res.data.map(this.formatItem);
              this.pagination.site = Number(res.site); // 设置 site
              this.pagination.next = res.data?.length >= this.pagination.pagesize; // 是否可按下一页
              this.pagination.pagesize = res.pagesize;
              this.pagination.count = res.count;
              this.pagination.page = res.page;
              this.tableLoading = false;
            }
            this.tableLoading = false;
          })
          .catch((e) => {
            this.tableLoading = false;
            this.$notify.error(e.message || e);
          });
      },
      formatItem(item) {
        item.raw_message = JSON.parse(item.raw_message || 'null');
        return item;
      },
      selectChange(rows) {
        this.selections = rows;
      },
      handleRecall(row) {
        return this.handleMessageStatus([row.id], 3);
      },
      handleSend(row) {
        return this.handleMessageStatus([row.id], 2);
      },
      handleDelete(row) {
        return this.handleStatus([row.id], 3);
      },
      handleRestore(row) {
        return this.handleStatus([row.id], 1);
      },
      handleRow(row, status) {
        const operate = OPERATE_MAPPER[status];
        this.$confirm(`确认${operate}消息【${row.id}】?`, '提示', {
          type: 'warning',
          callback: (action) => {
            if (action == 'confirm') {
              return this.handleStatus([row.id], status);
            }
          },
        });
      },
      batchOperate(command) {
        if (!this.selections.length) return this.$notify.warning('请选择要操作的消息！');
        switch (command) {
          case 'batchSend':
            return this.batchHandle(2, 'send');
          case 'batchRecall':
            return this.batchHandle(3, 'recall');
          case 'batchDelete':
            return this.batchHandle(3, 'delete');
          default:
            return;
        }
      },
      batchHandle(status, command) {
        // 过滤不可操作数据
        const ids = [];
        this.selections.forEach((v) => {
          if (checkAction(command, v)) {
            ids.push(v.id);
          }
        });

        if (!ids.length) return this.$notify.warning('无可操作行！');

        if (command == 'delete') {
          this.handleStatus(ids, status);
        } else {
          this.handleMessageStatus(ids, status);
        }
      },
      // 数据状态改变
      handleStatus(ids, status) {
        changeDataStatus({ ids, status })
          .then((res) => {
            if (res.code == 0) {
              this.$notify.success('操作成功');
              this.getTableData();
            }
          })
          .catch((err) => {
            this.selections = [];
            if (notify) notify.close();
            notify = this.$notify.error({
              title: '错误',
              message: err.message || err || '未知异常！',
            });
          });
      },
      // 消息状态改变
      handleMessageStatus(ids, status) {
        changeMessageStatus({ ids, send_status: status })
          .then((res) => {
            if (res.code == 0) {
              this.$notify.success('操作成功');
              this.getTableData();
            }
          })
          .catch((err) => {
            this.selections = [];
            if (notify) notify.close();
            notify = this.$notify.error({
              title: '错误',
              message: err.message || err || '未知异常！',
            });
          });
      },
      handlePreview(row) {
        this.previewMessageTitle = MESSAGE_TYPE_MAPPER[row.message_type];
        this.previewContent = row.show_message;
        this.previewVisible = true;
      },
      handleEdit(row) {
        this.$refs.addRef.open(row);
      },
      addNewMsg() {
        this.$refs.addRef.open();
      },
      // 工具函数
      rowStatusClass(status) {
        switch (status) {
          case 2:
            return 'text-success';
          case 3:
            return 'text-discard';
          case 4:
            return 'text-danger';
          default:
            return 'text-warning';
        }
      },
    },
  };
</script>
