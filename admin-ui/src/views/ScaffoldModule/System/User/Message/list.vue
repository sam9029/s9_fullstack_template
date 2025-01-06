<template>
  <div class="head-tabs-view">
    <el-tabs v-model="activeName" @tab-click="tabClick">
      <el-tab-pane v-for="item in tabsList" :key="item.name" :name="item.name">
        <!-- <el-badge :value="12" slot="label" is-dot>
          {{ item.label }}
        </el-badge> -->
        <span slot="label"> {{ item.label }}</span>
      </el-tab-pane>
    </el-tabs>
    <SearchPanel
      show-all
      :search="search"
      @onSubmit="searchSubmit"
      @onReset="searchReset"
    ></SearchPanel>

    <div style="margin-top: 8px">
      <BaseTable
        :columns="columns"
        :data="tableData"
        :loading="tableLoading"
        :pagination="pagination"
        :type="['selection']"
        @refresh="getList(true)"
        @select-change="tableSelectChange"
        @pagination-change="paginationChange"
        :selectable="(row) => row.has_read == 0"
      >
        <template #header_left>
          <span class="infinite-time">消息类型</span>
          <el-select v-model="selectValue" placeholder="请选择" @change="selectChange">
            <el-option
              v-for="item in selectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
          <el-button
            type="primary"
            class="mr10"
            :disabled="selectList.length == 0"
            @click="hasRead"
          >
            标记为已读
          </el-button>
        </template>
        <template #message="{ row }">
          <div class="message" @click="checkDetails(row)">
            <div>
              【{{ row.sender_name }}】{{ row.sub_title }}
              <span v-if="row.has_read == 0" class="new">new</span>
            </div>
            <div class="infinite-time">
              {{ traMessage(row) }}
            </div>
          </div>
        </template>
      </BaseTable>
    </div>

    <el-drawer v-if="drawerShow" :visible.sync="drawerShow">
      <div slot="title">
        <div>【{{ drawerData.sender_name }}】{{ drawerData.sub_title }} </div>
        <div class="infinite-time" style="margin-top: 8px"> {{ drawerData.create_time }}</div>
      </div>
      <div class="content">
        <div class="card_content-list-li" v-for="(item, index) in drawerData.message" :key="index">
          <span class="card_content-list-li-title">
            {{ item.label }}
          </span>
          <span
            class="card_content-list-li-info"
            :style="{ textIndent: item.label == '内容' ? '24px' : 0 }"
          >
            {{ item.value }}
          </span>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script>
  import { mapGetters } from 'vuex';
  import { MESSAGE_TYPE_MAPPER } from '@/utils/mappers/message.js';
  import { messageList, messageSave } from '@/api/message.js';
  import BaseTable from '@/components/BaseTable/index.vue';
  import SearchPanel from '@/components/Common/SearchPanel';
  import store from '@/store';

  export default {
    name: 'myMessage',
    components: { BaseTable, SearchPanel },
    data() {
      return {
        activeName: 0,
        search: {
          model: {
            keyword: null,
          },
          item: [
            {
              genre: 'input',
              model: 'keyword',
              label: '关键字',
              type: 'primary',
            },
          ],
        },

        columns: [
          {
            prop: 'message',
            label: '消息详情',
            slots: {
              customRender: 'message',
            },
          },
          {
            width: 150,
            prop: 'sub_title',
            label: '消息类型',
            slots: {
              customRender: 'tag',
            },
          },
          {
            width: 150,
            prop: 'create_time',
            label: '消息时间',
            slots: { customRender: 'dateTime' },
          },
        ],
        pagination: {
          count: 0,
          page: 1,
          pagesize: 20,
        },
        tableLoading: false,
        tableData: [],
        selectList: [],

        selectValue: -1,
        selectOptions: [
          {
            value: -1,
            label: '全部',
          },
          {
            value: 0,
            label: '未读',
          },
          {
            value: 1,
            label: '已读',
          },
        ],

        drawerShow: false,
        drawerData: null,
      };
    },
    computed: {
      ...mapGetters(['message_info']),
      tabsList() {
        let tabsList = [
          {
            label: '全部',
            name: 0,
            badge: {
              value: 0,
            },
          },
        ];

        for (let key in MESSAGE_TYPE_MAPPER) {
          tabsList.push({
            label: MESSAGE_TYPE_MAPPER[key],
            name: key,
            badge: {
              value: 0,
            },
          });
        }

        tabsList = tabsList.map((item) => {
          item.badge.value = this.message_info[item.value == 0 ? 'total' : item.value] || 0;
          item.name = String(item.name);
          return item;
        });
        return tabsList;
      },
    },
    mounted() {
      this.getList(true);
    },
    methods: {
      searchReset() {
        this.search.model.keyword = null;
        return this.searchSubmit();
      },

      searchSubmit() {
        return this.getList(true);
      },

      tableSelectChange(data) {
        this.selectList = data;
      },
      selectChange(v) {
        this.getList(true);
      },
      traMessage(row) {
        if (row.type == 1) {
          return row.message[0].value + '，' + row.message[1].value;
        }

        if (row.type == 2) {
          let name = row.message[0].value;
          let pass = row.message[1].value;
          let unpass = row.message[2].value;
          return name + '，审核通过：' + pass + '，审核失败：' + unpass;
        }
        if (row.type == 6) {
          return row.message[1].value + '已入住';
        }
        if (row.type == 7) {
          return row.message[0].value;
        }
      },
      tabClick(tab, event) {
        this.search.model.keyword = null;
        this.activeName = tab.name;
        this.selectValue = -1;
        this.getList(true);
      },
      paginationChange(val) {
        this.pagination = val;
        this.getList(false);
      },

      getList(reset = false) {
        this.tableLoading = true;
        let params = {
          ...this.pagination,
          ...this.search.model,
        };

        params.type = Number(this.activeName);
        if (params.type == 0) delete params.type;
        if (reset) this.listData = [];

        params.has_read = this.selectValue;
        if (this.selectValue == -1) delete params.has_read;

        this.tableData = [];
        messageList(params)
          .then((res) => {
            this.pagination.count = res.count;
            this.tableData = res.data;
            this.tableLoading = false;
          })
          .catch((err) => {});
      },
      hasRead() {
        let arr = [];
        this.selectList.forEach((item) => {
          if (item.has_read == 0) arr.push(item.id);
        });
        if (arr.length == 0) return;
        this.save(arr, 'read');
        // console.log('hasRead', arr, this.selectList);
      },

      save(ids, operation_type = 'read') {
        let params = {
          ids: ids,
          operation_type: operation_type,
          operation_object: 'singal',
        };

        messageSave(params).then((res) => {
          this.selectList = [];
          store.dispatch('GetMessageCount');
          this.getList(true);
        });
      },

      checkDetails(row) {
        this.drawerData = row;
        this.drawerShow = true;
      },
    },
  };
</script>

<style lang="scss" scoped>
  .infinite-time {
    font-size: 12px;
    color: #7f7f7f;
  }
  .new {
    background: #67c23a;
    padding: 2px 4px;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
  }
  .el-select {
    margin-right: 8px;
    margin-left: 8px;
    width: 100px;
  }
  .message {
    cursor: pointer;
  }
  .content {
    padding: 20px;
  }
  .card_content-list-li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 8px;
    .card_content-list-li-title {
      line-height: 19px;
      width: 30%;
      color: #7f7f7f;
    }

    .card_content-list-li-info {
      width: 65%;
    }
  }
  ::v-deep .el-tabs__item {
    height: 48px;
    line-height: 48px;
  }
  // ::v-deep .el-badge {
  //   height: 60px;
  //   line-height: 60px;
  // }
</style>
