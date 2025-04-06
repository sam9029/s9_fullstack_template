<template>
  <div>
    <!-- 引入 搜索 -->
    <search-panel
      showAll
      :search="searchConfig"
      @onSubmit="queryTableData(true)"
      @onReset="searchReset"
    ></search-panel>

    <!-- 引入 表格 -->
    <BaseTable
      :columns="columns"
      :columnsKey="tableColumnsKey"
      :data="tableData"
      :pagination="pagination"
      :loading="tableLoading"
      :type="['selection']"
      :useCount="false"
      @look-count="lookCount"
      @pagination-change="paginationChange"
      @select-change="selectChange"
      @refresh="queryTableData()"
      @handleRowEdit="handleRowEdit"
      @handleRowDel="handleRowDel"
      @handleRowOpen="handleRowOpen"
      @handleRowStop="handleRowStop"
      @handleRowSubmit="handleRowSubmit"
      @handleRowPass="handleRowPass"
      @handleRowReject="handleRowReject"
    >
      <!-- 左上按钮区域默认插槽 -->
      <template #header_left>
        <el-button type="primary" v-if="$checkPermi(AUTHCONFIG.edit)" @click="handleAdd"
          >新增</el-button
        >
        <!-- 批量按钮 -->
        <AuthDropDown class="ml10" :items="AuthDropDownItem" @command="batchOperate">
          <el-button>
            批量操作
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
        </AuthDropDown>
      </template>

      <template #header_right>
        <DescButton
          icon="el-icon-download"
          circle
          plain
          desc="导出数据"
          v-hasPermi="AUTHCONFIG.export"
          @click="openExportExcel"
        />
      </template>

      <!-- 审批流 -->
      <!-- 
        <template #verify_process="scope">
          <ApprovalProcess :row_data="scope.row"></ApprovalProcess>
        </template> 
      -->
    </BaseTable>

    <!-- 新增 -->
    <!-- <EddDialog ref="editDialogRef" @success="queryTableData"></EddDialog> -->

    <!-- 导出 -->
    <ExportExcel
      :exportVisible.sync="exportVisible"
      :tableItem="exportItem"
      @exportCol="handleExport"
      title="导出选择列"
      width="800px"
    ></ExportExcel>
  </div>
</template>

<script>
  // 依赖&组件
  import SearchPanel from '@/components/Common/SearchPanel';
  import BaseTable from '@/components/BaseTable';
  import ApprovalProcess from '@/components/ApprovalProcess/index.vue';

  // 工具
  import RightTipEmitter from '@/components/RightTip/evbus.js';
  import { setSearchItemOpts, exportColumns } from '@/utils/tools.js';
  import {
    AUTHCONFIG,
    AuthDropDownItem,
    initSearchConfig,
    columns,
    checkAction,
  } from './config.js';

  // API
  // import { list, update, approval, exportData } from '@/api/';
  import { advertiserCategroyList } from '@/api/public.js';

  export default {
    // name: 'XXXX',

    components: {
      BaseTable,
      SearchPanel,
      ApprovalProcess,
      BaseStatus: () => import('@/components/BaseCopy/status'),
      AuthDropDown: () => import('@/components/Common/AuthDropDown.vue'),
      ExportExcel: () => import('@/components/Common/ExportExcel.vue'),
      // EddDialog: () => import('./editDialog.vue'),
    },

    computed: {},

    data() {
      return {
        AUTHCONFIG,
        AuthDropDownItem,
        tableColumnsKey: 'KHSA089-SKAHUI-SAHK9889-SAKH9SA', // 每个页tablekey要不一致，记得每次都要更新

        searchConfig: initSearchConfig(this),
        columns,
        // 页码
        pagination: { pagesize: 20, count: 0, page: 1, next: false, site: 0 },
        // 表数据
        tableData: [],
        // 多选 选中
        selections: [],
        // 表加载
        tableLoading: false,

        /** 导出 */
        exportVisible: false,
        exportItem: exportColumns(columns),
      };
    },

    methods: {
      //#region 基础页面函数模块
      // 检索条件重置
      searchReset() {
        this.searchConfig.model = initSearchConfig(this).model;
        this.pagination = this.$options.data().pagination;
        this.queryTableData(true);
      },

      // 查看总数
      lookCount() {
        this.queryTableData(false, true);
      },

      // 分页切换
      paginationChange(val) {
        this.pagination = val;
        this.queryTableData();
      },

      // 单选 多选 选中值
      selectChange(data) {
        this.selections = data;
      },

      // 请求数据
      queryTableData(flag = false, is_query_count = false) {
        if (flag) {
          this.pagination.page = 1;
        }

        // APi 调用关键词参数
        let params = {
          ...this.searchConfig.model,
          ...this.pagination,
        };

        // 是否为查看 总数 （若为处理 请求参数）
        if (is_query_count) {
          params.query_count = true;
        } else {
          if (this.pagination.page == 1) this.pagination.site = 0;
        }

        if (typeof list === 'undefined') throw new Error('未配置API-列表list函数');
        this.tableLoading = true;
        list(params)
          .then((res) => {
            // // dev-log >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            console.log(`[Dev_Log][${'queryTableData'}_]_>>>`, res);
            if (!res.code) {
              // 是否为查看 总数 （若为则走 赋值总数）
              if (is_query_count) {
                this.pagination.count = res.count; // 赋值总数
              } else {
                this.tableData = res.data.map(this.formatItem);
                this.pagination.site = Number(res.site); // 设置 site
                this.pagination.count = res.count; // 赋值总数
                this.pagination.next = res.data?.length >= this.pagination.pagesize; // 是否可按下一页
              }
            }
          })
          .catch((err) => this.$notify.error(err))
          .finally(() => {
            this.tableLoading = false;
          });

        //#region =====  模拟 MOCKMOCK，记得删除
        this.tableData = [
          { id: 1, name: '测试数据1', status: 1, verify_status: 1 },
          { id: 2, name: '测试数据2', status: 1, verify_status: 2 },
          { id: 3, name: '测试数据3', status: 1, verify_status: 3 },
          { id: 4, name: '测试数据4', status: 1, verify_status: 4 },
          { id: 5, name: '测试数据5', status: 3, verify_status: 4 },
        ];
        setTimeout(() => {
          this.tableLoading = false;
        }, 1000);
        //#endregion
      },

      formatItem(item) {
        item.curr_account_id = this.$store.getters.currentAccountId;
        return item;
      },
      //#endregion

      //#region 数据处理模块

      //#region =====  页面操作函数模块
      // 新增事件
      handleAdd() {
        this.$refs.editDialogRef?.open();
      },

      // 操作 修改 事件
      handleRowEdit(row, column, $index) {
        this.$refs.editDialogRef?.open(row);
      },
      //#endregion

      //#region ===== 批量操作模块
      batchOperate(command) {
        if (!this.selections.length) return this.$notify.warning('请选择要操作数据！');

        // 过滤不可操作数据
        let ids = [];
        this.selections.forEach((v) => {
          if (checkAction(command, v)) {
            ids.push(v.id);
          }
        });
        if (!ids.length) {
          return this.$notify.warning('无可操作行！');
        }

        switch (command) {
          //#region ===== 状态
          case 'open':
            return this.handleBatchUpdateStatus(ids, command);
          case 'stop':
            return this.handleBatchUpdateStatus(ids, command);
          case 'del':
            return this.handleBatchUpdateStatus(ids, command);
          //#endregion
          //#region ===== 审核状态
          case 'submit':
            return this.handleBatchUpdateApprovalStatus(ids, command);
          case 'reject':
            return this.handleConfirmReject(ids, command);
          case 'pass':
            return this.handleBatchUpdateApprovalStatus(ids, command);
          //#endregion
          default:
            return;
        }
      },
      //#endregion

      //#region ===== 通用状态改变事件模块 (启用&停用&删除)
      // 操作 启用 事件
      handleRowOpen(row, column, $index) {
        this.handleUpdateStatus([row.id], 'open');
      },

      // 操作 停用 || 终止 事件
      handleRowStop(row, column, $index) {
        this.handleUpdateStatus([row.id], 'stop');
      },

      // 操作 删除 事件
      handleRowDel(row, column, $index) {
        this.handleUpdateStatus([row.id], 'del');
      },

      // 操作 恢复 事件
      handleRowRestore(row, column, $index) {
        this.handleUpdateStatus([row.id], 'restore');
      },

      // 状态改变函数 (批量数据 操作)
      handleBatchUpdateStatus(ids, command) {
        this.handleUpdateStatus(ids, command);
      },

      // 状态改变函数 (单个数据 操作)
      handleUpdateStatus(ids, command) {
        let mapper = {
          open: 1,
          stop: 2,
          del: 3,
          restore: 1,
        };

        if (typeof update === 'undefined') throw new Error('未配置API-状态改变函数');
        update({
          ids: ids,
          status: mapper[command],
        })
          .then(() => {
            this.$notify.success('操作成功！');
            this.queryTableData();
          })
          .catch((err) => {
            this.$notify.error(err.message || err || '操作失败！');
          });
      },
      //#endregion

      //#region ===== 审核状态改变事件模块 (提交&通过&拒绝)
      handleRowSubmit(row, column, $index) {
        this.handleUpdateApprovalStatus([row.id], 'submit');
      },

      handleRowRecall(row, column, $index) {
        this.handleUpdateApprovalStatus([row.id], 'recall');
      },

      handleRowPass(row, column, $index) {
        this.handleUpdateApprovalStatus([row.id], 'pass');
      },

      handleRowReject(row, column, $index) {
        this.handleConfirmReject([row.id]);
      },

      handleBatchUpdateApprovalStatus(ids, command) {
        this.handleUpdateApprovalStatus(ids, command);
      },

      handleConfirmReject(ids) {
        const tip = `请输入审核拒绝原因`;
        return this.$prompt(tip, '提示', {
          inputValidator: (value) => {
            if (!value) return tip;
            const val = value.trim();
            if (!val) return tip;
            return true;
          },
        }).then(({ value }) => {
          return this.handleUpdateApprovalStatus(ids, 'reject', {
            verify_suggest: value.trim(),
          });
        });
      },

      handleUpdateApprovalStatus(ids, command, extra) {
        let mapper = {
          submit: 2,
          pass: 3,
          reject: 4,
          recall: 5,
        };

        let params = {
          ids: ids,
          verify_status: mapper[command],
          ...extra,
          // site:this.pagination.site,
        };

        approval(params)
          .then((res) => {
            let err = null;
            if (res.data?.fails?.length) {
              let approval_text = '未建立审批流，请创建好审批流后再进行提交审核！';
              if (res.data?.fails.find((t) => t.message == approval_text)) {
                this.$notify.error(approval_text);
                return;
              }
              res.data.fails.forEach((e) => {
                if (err) {
                  if (err != e.message) {
                    throw `部分报价操作失败！`;
                  }
                }
                err = e.message;
              });
              throw err;
            }
            this.$notify.success('操作成功！');
            this.queryTableData();
          })
          .catch((err) => {
            this.$notify.error(err.message || err || '操作失败！');
          });
      },
      //#endregion

      //#region ===== 导出模块
      // 打开导出
      openExportExcel() {
        this.exportVisible = true;
      },

      // 导出
      handleExport(cols, _epxort_params) {
        this.pageLoading = true;
        let params = {
          cols,
          ...this.searchConfig.model,
          ..._epxort_params,
        };
        exportData(params)
          .then((res) => {
            if (res && res.code == 0) {
              this.$notify.success('导出任务创建成功，请注意查看进度!');
              RightTipEmitter.emit('export-log');
            } else {
              throw res;
            }
            this.pageLoading = false;
          })
          .catch((err) => {
            this.pageLoading = false;
            this.$notify.error(`导出失败：${err}`);
          });
      },
      //#endregion

      //#endregion

      //#region API请求模块
      // 获取业务类型
      async queryAdvertiseType() {
        try {
          let res = await advertiserCategroyList();
          if (res && !res.code) {
            setSearchItemOpts(this.searchConfig, 'type', res.data);
          }
        } catch (err) {
          this.$notify.error(err || '获取业务类型失败!');
        }
      },
      //#endregion
    },

    created() {
      this.queryAdvertiseType();
      this.queryTableData();
    },

    mounted() {},
  };
</script>

<style lang="scss" scoped></style>
