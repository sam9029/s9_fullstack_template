<template>
  <el-popover
    placement="bottom"
    trigger="hover"
    popper-class="pop"
    @after-enter="getCount"
    @show="getList(true)"
  >
    <div slot="reference" style="margin-right: 30px; display: inline-block">
      <el-badge :hidden="messageCount == 0" :value="messageCount" :max="99">
        <div class="bell">
          <i class="el-icon-bell"></i>
        </div>
      </el-badge>
    </div>
    <div>
      <ul class="infinite-list" v-infinite-scroll="getList">
        <template v-if="listData.length != 0">
          <li v-for="item in listData" :key="item.id" class="infinite-list-item">
            <div class="infinite-badge"></div>
            <div class="infinite-content">
              <div class="infinite-title">
                {{ item.sub_title }}
              </div>
              <div class="infinite-time">
                {{ item.create_time }}
              </div>
            </div>
          </li>
        </template>
        <el-empty
          image="https://koc-img.lizhibj.cn/applet/message.png"
          description="暂无新消息"
          :image-size="120"
          v-else
        ></el-empty>
      </ul>

      <div class="flex">
        <template v-if="listData.length != 0">
          <el-button type="text" @click="save([], 'read_all')">全部忽略</el-button>
        </template>
        <div v-else> </div>
        <el-button type="text" @click="all">查看全部</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script>
import { mapGetters } from 'vuex';
import { MESSAGE_TYPE_MAPPER } from '@/utils/mappers/message.js';
import { messageList, messageSave } from '@/api/message.js';
import store from '@/store';
import { throttle } from 'lodash';

export default {
  data() {
    return {
      pagination: {
        count: 0,
        page: 1,
        pagesize: 10,
      },
      isEnd: false,
      listLoading: false,
      listData: [],
    };
  },
  computed: {
    ...mapGetters(['message_info']),
    messageCount() {
      return this.message_info.total || 0;
    },
  },
  mounted() {
    store.dispatch('GetMessageCount');
  },
  methods: {
    getCount() {
      store.dispatch('GetMessageCount');
    },
    getList: throttle(function (reset = false) {
      if (reset) this.isEnd = false;
      if (this.isEnd) return;

      this.listLoading = true;
      this.pagination.page = reset ? 1 : this.pagination.page + 1;

      let params = {
        ...this.pagination,
        has_read: 0,
      };

      messageList(params)
        .then((res) => {
          let arr = res.data;
          arr = arr.sort((a, b) => b.id - a.id);

          if (reset) this.listData = res.data;
          else this.listData.push(...arr);

          if (this.listData.length == res.count) this.isEnd = true;

          this.listLoading = false;
        })
        .catch((err) => {});
    }, 500),

    save(ids, operation_type = 'read') {
      let params = {
        ids: ids,
        operation_type: operation_type,
        operation_object: 'singal',
      };
      if (operation_type == 'read_all') delete params.ids;

      messageSave(params).then((res) => {
        this.getList(true);
        store.dispatch('GetMessageCount');
      });
    },
    all() {
      if (this.$route.path == '/user/message') return;
      this.$router.push('/user/message');
    },
  },
};
</script>

<style lang="scss" scoped>
.infinite-list {
  height: 300px;
  list-style: none;
  margin: 0;
  overflow: auto;
  padding: 0;
  width: 191px;
}
.el-badge {
  line-height: 24px;
  height: 24px;
  padding-top: 2px;
  ::v-deep.el-badge__content.is-fixed {
    top: 3px;
    right: 11px;
  }
  ::v-deep.el-badge__content {
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    padding: 0 4px;
  }
}
.infinite-list .infinite-list-item {
  display: flex;
  align-items: center;
  height: 50px;
  margin: 5px;
  border-bottom: 1px solid #dfdfdf;
}
.infinite-badge {
  width: 5px;
  height: 5px;
  background-color: red;
  border-radius: 5px;
  margin-right: 10px;
}
.infinite-title {
  font-size: 14px;
}
.infinite-time {
  font-size: 12px;
  color: #7f7f7f;
}
.infinite-content {
  width: 158px;
}

.flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.bell {
  color: var(--kj-nav-color);
  width: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  cursor: pointer;
  font-size: 22px;
}
</style>

<style>
.pop {
  padding: 12px 12px 0 12px;
}
</style>
