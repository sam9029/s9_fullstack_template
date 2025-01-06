<template>
  <BaseDrawer
    v-bind="$attrs"
    v-on="$listeners"
    size="900px"
    title="导出记录"
    :showTop="true"
    @close="close"
    @opened="opened"
  >
    <div class="container">
      <SearchPanel
        show="all"
        :search="search"
        @onSubmit="searchSubmit"
        @onReset="searchReset"
      ></SearchPanel>

      <BaseTable
        border
        :columns="columns"
        :data="list"
        :loading="tableLoading"
        :pagination="pagination"
        columnsKey="right-export-log-tb"
        @refresh="queryList(false)"
        @download="handleDownload"
        @pagination-change="queryList(false)"
      >
        <!-- <template #header_left>
        <AuthDropDown :items="dropdowns" @command="handleBatch">
          <el-button>
            批量操作
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
        </AuthDropDown>
      </template> -->

        <template #export_status="{ row }">
          <BaseStatus
            :mapper="statusMapper"
            :status="row.export_status"
            :icon-class="rowStatusClass"
            :reason="row.export_message"
          ></BaseStatus>
        </template>
      </BaseTable>
    </div>

    <span slot="footer"></span>
  </BaseDrawer>
</template>


<script>
//
import { export_log, export_download } from '@/api/public/export.js';
//
import BaseDrawer from '@/components/BaseDrawer';
import SearchPanel from '@/components/Common/SearchPanel';
import BaseTable from '@/components/BaseTable/index.vue';
// import AuthDropDown from '@/components/Common/AuthDropDown';
import BaseStatus from '@/components/BaseCopy/status.vue';
//
import { initSearch, tableItems, EXPORT_STATUS } from './ExportLogData';

export default {
  components: {
    BaseDrawer,
    SearchPanel,
    BaseTable,
    // AuthDropDown,
    BaseStatus,
  },
  data() {
    return {
      statusMapper: EXPORT_STATUS,
      search: initSearch(),
      columns: tableItems,
      list: [],
      tableLoading: false,
      pagination: { pagesize: 20, count: 0, page: 1 },
      // selections: [],
      // dropdowns: [
      //   {
      //     label: '批量下载',
      //     command: 'download',
      //     auth: ['*:*:*'],
      //   },
      // ],
    };
  },
  methods: {
    searchSubmit() {
      this.queryList(true);
    },
    searchReset() {
      this.search.model = initSearch().model;
      this.searchSubmit();
    },
    queryList(reset) {
      if (reset) {
        this.pagination.page = 1;
      }
      const params = {
        // interface_id: 1109,
        ...this.search.model,
        ...this.pagination,
      };
      this.tableLoading = true;
      export_log(params)
        .then((data) => {
          this.tableLoading = false;
          this.list = data.data;
          this.pagination.count = data.count;
        })
        .catch((err) => {
          this.tableLoading = false;
          this.$notify.error(err.message || err || '查询失败！');
        });
    },
    // selectionChange(rows) {
    //   this.selections = rows;
    // },
    // handleBatch(command) {
    //   switch (command) {
    //     case 'download':
    //       return;
    //     default:
    //       throw 'unkown command';
    //   }
    // },
    handleDownload(row) {
      export_download({ id: row.id })
        .then((data) => {
          this.downloadUrl(data.data.download_url);
        })
        .catch((err) => {
          this.$notify.error(err.message || err || '获取下载链接失败！');
        });
    },
    downloadUrl(url) {
      if (!url) return;
      const elemFrame = document.createElement('iframe');
      elemFrame.src = url;
      elemFrame.style.display = 'none';
      document.body.appendChild(elemFrame);
    },
    rowStatusClass(status) {
      switch (status) {
        case 2:
          return 'text-warning';
        case 3:
          return 'text-success';
        case 4:
          return 'text-danger';
        default:
          return 'text-info';
      }
    },
    opened() {
      this.searchSubmit();
    },
    close() {
      this.$emit('update:visible', false);
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  padding: 10px;
}
</style>