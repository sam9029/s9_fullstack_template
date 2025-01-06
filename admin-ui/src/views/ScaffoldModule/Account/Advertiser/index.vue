<template>
  <div>
    <search-panel :search="searchConfig" @onSubmit="onSubmit" @onReset="onReset"></search-panel>
    <BaseTable
      ref="table"
      columnsKey="account-advertiser-list-cols"
      :type="['expand']"
      :columns="columns"
      :data="tableData"
      :loading="tableLoading"
      :pagination="pagination"
      @select-change="selectChange"
      @refresh="getTableData(false)"
      @pagination-change="getTableData(false)"
      @expand-change="handleExpandChange"
      @handleEdit="handleRowEdit"
      @handleDel="handleRowDel"
      @handleRecover="handleRowRecover"
      @showRowPromotion="showRowPromotion"
    >
      <template #header_left>
        <el-button type="primary" @click="showAddAdver"> 新增 </el-button>

        <!-- <AuthDropDown :items="dropdowns" @command="batchOperate">
          <el-button>
            批量操作
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
        </AuthDropDown> -->
      </template>
      <template #expand="{ row }">
        <SalerExpand
          :id="row.id"
          :data="row.expandList"
          :loading="row.expandLoading"
          @expand-add="showExpandAdd(row)"
          @expand-refresh="queryRowExpandList(row)"
        ></SalerExpand>
      </template>
      <template #promotion="{ row }">
        <el-tag @click="showRowPromotion(row)" class="promotions" v-if="row.promotions">{{ row.promotions }}</el-tag>
        <el-tag v-else  @click="showRowPromotion(row)" class="promotions">去添加</el-tag>
      </template>
      <template #icon="{ row }">
        <el-avatar shape="square" :size="50" fit="contain" :src="row.icon">未设置</el-avatar>
      </template>
    </BaseTable>

    <CreateAdvertiser @refresh="addComRefresh" ref="addRef" :industryOptions="industryOptions"></CreateAdvertiser>
    <PromotionManage ref="promteRef"></PromotionManage>
  </div>
</template>

<script>
import {
  advertiserList,
  adverSalerList,
  advertiserSave,
  getCreativeCategoryList
} from '@/api/account/advertiser/advertiser.js';
import BaseTable from '@/components/BaseTable/index.vue';
import BaseDialog from '@/components/BaseDialog/index.vue';
import SearchPanel from '@/components/Common/SearchPanel';
import { tableItems, initSearch, SIGN_TYPE, listToTree} from './data';

export default {
  name: 'adProject',
  components: {
    BaseTable,
    BaseDialog,
    SearchPanel,
    CreateAdvertiser: () => import('./CreateAdvertiser.vue'),
    SalerExpand: () => import('./SalerExpand.vue'),
    PromotionManage: () => import('./PromotionManage.vue'),
  },
  data() {
    return {
      pagination: { pagesize: 20, count: 0, page: 1 },
      columns: tableItems,
      searchConfig: initSearch(),
      tableData: [],
      tableLoading: false,
      selections: [],
      industryOptions: []
      // dropdowns: [
      //   {
      //     label: '删除',
      //     command: 'delete',
      //     auth: ['*:*:*'],
      //   },
      //   {
      //     label: '恢复',
      //     command: 'recover',
      //     auth: ['*:*:*'],
      //   },
      // ],
    };
  },
  activated() {
    this.$refs.table.$refs.tableElRef.doLayout();
  },
  created() {
    this.getTableData(true);
  },
  mounted() {
    this.getIndustryOps();
  },
  methods: {
    // #region search
    onReset() {
      const model = initSearch().model;
      this.searchConfig.model = model;
      this.getTableData(true);
    },
    onSubmit() {
      this.getTableData(true);
    },
    getTableData(reset) {
      if (reset) this.pagination.page = 1;
      this.tableData = [];
      const params = {
        ...this.searchConfig.model,
        ...this.pagination,
        interface_id: 2131,
      };
      this.tableLoading = true;
      setTimeout(advertiserList(params)
        .then((res) => {
          this.tableData = res.data.map(this.formatItem);
          this.pagination.count = res.count;
          this.tableLoading = false;
        })
        .catch((e) => {
          this.tableLoading = false;
          this.$notify.error(e.message || e);
        }), 1000);
      
    },
    formatItem(item) {
      // item.expandLoaded = false;
      item.expandLoading = false;
      item.expandList = [];
      return item;
    },
    // #endregion
    selectChange(rows) {
      this.selections = rows;
    },
    showAddAdver() {
      this.$refs.addRef.open(SIGN_TYPE.NEW_AD, null);
    },
    addComRefresh(sign, id) {
      if (sign == SIGN_TYPE.NEW_SALER) {
        const row = this.tableData.find((v) => v.id == id);
        if (row) {
          return this.queryRowExpandList(row);
        }
      }
      return this.getTableData(false);
    },
    // batchOperate(command) {
    //   if (!this.selected.length) return this.$notify.warning('请选择要操作的广告主！');
    //   switch (command) {
    //     case 'recover':
    //       return this.batchHandle(1, '恢复');
    //     case 'delete':
    //       return this.batchHandle(3, '删除');
    //     default:
    //       return;
    //   }
    // },
    // batchStatus(status, operate) {
    //   const ids = [];
    //   let breakId = null;
    //   for (let i = 0; i < this.selected.length; i++) {
    //     const { status: rowStatus, id } = this.selected[i];
    //     if (rowStatus == status) {
    //       breakId = id;
    //       break;
    //     }
    //     ids.push(id);
    //   }
    //   if (breakId) {
    //     return this.$notify.warning(`广告主【${breakId}】不可${operate}!`);
    //   }
    // },
    //#region table row
    queryRowExpandList(row) {
      // if (row.expandLoaded) return;
      row.expandLoading = true;
      adverSalerList({ advertiser_type: row.id })
        .then((data) => {
          row.expandLoading = false;
          // row.expandLoaded = true;
          row.expandList = data.data.map((v) => {
            v.status_copy = v.status == 1;
            v.end_date = v.end_date || '至今';
            return v;
          });
        })
        .catch((err) => {
          this.$notify.error(err.message || err);
        });
    },
    handleExpandChange(row, expandedRows) {
      if (!expandedRows.includes(row)) return;
      this.queryRowExpandList(row);
      return true;
    },
    showExpandAdd(row) {
      this.$refs.addRef.open(SIGN_TYPE.NEW_SALER, row);
    },
    handleRowEdit(row) {
      this.$refs.addRef.open(SIGN_TYPE.EDIT_AD, row);
    },
    showRowPromotion(row) {
      this.$refs.promteRef.open(row);
    },
    handleRowDel(row) {
      this.confirmChangeStatus(row.id, 3, '删除');
    },
    handleRowRecover(row) {
      this.confirmChangeStatus(row.id, 1, '恢复');
    },
    confirmChangeStatus(id, status, operate) {
      this.$confirm(`确认${operate}已选中的广告主?`, '提示', {
        type: 'warning',
        callback: (action) => {
          if (action == 'confirm') {
            return this.handleStatus(id, status);
          }
        },
      });
    },
    handleStatus(id, status) {
      this.tableLoading = true;
      advertiserSave({ id, status })
        .then((data) => {
          this.tableLoading = false;
          this.$notify.success('操作成功！');
          this.getTableData(false);
        })
        .catch((err) => {
          this.tableLoading = false;
          this.selected = [];
          this.$notify.error(err.message || err || '未知异常！');
        });
    },
    getIndustryOps() {
        getCreativeCategoryList().then((data) => {
          if (data.code == 0) {
            const { tree, mapper } = listToTree(data.data, {
              needMapper: true,
              nameConnectParent: true,
            });
            this.industryOptions = tree;
            this.industryMapper = mapper;
          }
        });
      },
    //#endregion
  },
};
</script>


<style lang="scss" scoped>
.expand-table-wrapper {
  padding: 20px 100px 20px 40px;
}
.promotions {
  cursor: pointer;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>