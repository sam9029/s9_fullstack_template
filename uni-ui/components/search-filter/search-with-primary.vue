<template>
  <view class="search-container">
    <u-skeleton :title="false" rows="2" :rowsHeight="rowsHeight" :rowsWidth="rowsWidth" :loading="loading">
      <view class="search-mian-input" v-if="primarySearch">
        <u-search
          :placeholder="primarySearch.placeholder || '请输入搜索关键字'"
          v-model="model[primarySearch.model]"
          clearabled
          :showAction="false"
          @input="emitValue"
          @search="submitSearch"
        ></u-search>
      </view>
      <view class="u-flex-row u-m-t-24">
        <view class="primary-search-row scroll-x">
          <view class="u-flex-row">
            <PrimaryItem
              v-for="item in primaryItems"
              :item="item"
              :key="item.model"
              v-model="model[item.model]"
              @input="emitValue"
              @event="emitEvent"
            ></PrimaryItem>
          </view>
        </view>
        <view class="u-flex u-p-10" @click="toggleSubPanel">
          <view class="right-line u-h-100 u-m-r-10" v-if="primaryItems.length">
            <u-line direction="col"></u-line>
          </view>
          <template v-if="popupItems.length">
            <u--text class="right-filter-action" text="筛选" :color="actionColor">筛选</u--text>
            <u-icon name="grid" :size="22" :color="actionColor"></u-icon>
          </template>
        </view>
      </view>
    </u-skeleton>
    <u-popup :show="showPanel" :round="10" @close="panelClose" mode="bottom" bgColor="#F5F5F5">
      <view class="u-flex panel-cover-view safe-top-area">全部筛选</view>
      <view class="panel-container">
        <FilterItem
          v-for="item in popupItems"
          :item="item"
          :key="item.model"
          v-model="model[item.model]"
          @input="emitValue"
          @event="emitEvent"
        ></FilterItem>
      </view>
      <view class="u-flex panel-cover-view panel-bottom">
        <view class="action-button">
          <u-button shape="circle" text="重置" @click="resetSearch"></u-button>
        </view>
        <view class="action-button">
          <u-button type="primary" shape="circle" text="确认" @click="submitSearch"></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import FilterItem from "./base-item";
import PrimaryItem from "./primary-item";
export default {
  options: {
    styleIsolation: "shared",
  },
  name: "search-filter",
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    model: {
      type: Object,
      default: () => Object.create(null),
    },
  },
  components: {
    FilterItem: FilterItem,
    PrimaryItem: PrimaryItem,
  },
  data() {
    return {
      _PrimaryTypes: ["select", "date", "daterange"],
      rowsHeight: ["34px", "32px"],
      rowsWidth: ["inherit", "inherit"],
      loading: true,
      primarySearch: null,
      primaryItems: [],
      popupItems: [],
      showPanel: false,
    };
  },
  mounted() {
    this.$nextTick(this.initSearch);
  },
  computed: {
    actionColor() {
      const keys = Reflect.ownKeys(this.model);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k == "__ob__") continue;
        if (this.primarySearch) {
          if (k == this.primarySearch.model) continue;
        }
        const val = this.model[k];
        if (!this.isEmpty(val)) return "#3c9cff";
      }
      return "#606266";
    },
  },
  methods: {
    initSearch() {
      const [primarySearch, primaryItems, popupItems] = this.handleItems();
      this.primarySearch = primarySearch;
      this.primaryItems = primaryItems;
      this.popupItems = popupItems;
      this.loading = false;
      this.$emit('initialized');
    },
    handleItems() {
      let primarySearch = null;
      // let sortItems = [];
      let popupItems = [];
      let primaryItems = [];

      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        if (item.show === false) continue;
        if (item.filter == "search") {
          if (primarySearch) {
            throw "items中最多有一个seach类型筛选！";
          }
          primarySearch = item;
        } else {
          // sortItems.push(item);
          if (item.type == "primary" && this.$data._PrimaryTypes.includes(item.filter)) {
            primaryItems.push(item);
          } else {
            popupItems.push(item);
          }
        }
      }
      if (!primaryItems.length) {
        const item = popupItems.shift();
        item && primaryItems.push(item);
      }
      if (!primaryItems.length) {
        console.error('items长度不足，建议使用u-search！')
      }

      return [primarySearch, primaryItems, popupItems];
      // if (primarySearch) {
      //   return [primarySearch, [], sortItems];
      // } else {
      //   return [null, primaryItems, popupItems];
      // }
    },
    isEmpty(val) {
      if (Array.isArray(val)) {
        return val.length === 0;
      }
      return val === "" || val === null || val === undefined;
    },
    toggleSubPanel() {
      this.showPanel = !this.showPanel;
    },
    panelClose() {
      this.showPanel = false;
    },
    resetSearch() {
      this.$emit("reset");
      this.panelClose();
    },
    submitSearch() {
      this.$emit("submit");
      this.panelClose();
    },
    emitValue(item) {
      this.$emit("update:model", this.model);
    },
    emitEvent(evName, ...args) {
      this.$emit(evName, ...args);
    },
    updateItemAttr(modelKey, prop, value) {
      const item = this.items.find((v) => v.model == modelKey);
      if (!item) return;
      if (this.primarySearch?.model == modelKey) {
        this.primarySearch = item;
        return;
      }
      const popIndex = this.popupItems.findIndex((v) => v.model == modelKey);
      if (popIndex !== -1) {
        this.$set(this.popupItems[popIndex], prop, value);
        return;
      }
      const index = this.primaryItems.findIndex((v) => v.model == modelKey);
      if (index !== -1) {
        this.$set(this.primaryItems[index], prop, value);
      }
    },
    // ref method
    updateItem(modelKey, prop, value) {
      if (this.loading) return;
      if (prop === "show") {
        return this.initSearch();
      }
      return this.updateItemAttr(modelKey, prop, value);
    },
  },
};
</script>

<style lang="scss" scoped>
//#region
.flex-row {
  flex-direction: row;
}
.search-container {
  position: relative;
}
.primary-search-row {
  display: inline-flex;
  padding-right: 40rpx;
  flex: 1;
}
.right-filter-action {
  font-size: 16px;
  line-height: 34px;
  color: #606266;
  margin-right: 10rpx;
}
//#endregion

.panel-container {
  max-height: 280px;
  overflow: auto;
}
.panel-cover-view {
  color: $u-main-color;
  background-color: #fff;
}
.safe-top-area {
  line-height: 48rpx;
  padding: 16rpx 0;
  justify-content: center;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
}
.panel-bottom {
  bottom: 0;
  padding: 20rpx 40rpx;
  justify-content: space-between;
}
.action-button {
  width: 200rpx;
}

.search-mian-input {
  ::v-deep .u-search__content {
    border-color: $u-primary !important;
    .uicon-search {
      color: $u-primary !important;
    }
  }
}
.right-line {
  ::v-deep .u-line {
    border-color: $u-primary !important;
  }
}
</style>
