<template>
  <view class="search-container">
    <u-skeleton
      :title="false"
      rows="1"
      rowsHeight="74rpx"
      :rowsWidth="rowsWidth"
      :loading="loading"
    >
      <view class="u-flex-row">
        <view
          class="search-mian-input u-flex-row"
          style="flex: 1"
          v-if="primarySearch || primaryItems.length"
        >
          <u-search
            v-if="primarySearch"
            :placeholder="primarySearch.placeholder || '请输入关键字查找'"
            v-model="model[primarySearch.model]"
            clearabled
            :showAction="popupItems.length ? false : true"
            animation
            bgColor="#FFFFFF"
            height="74rpx"
            shape="square"
            @input="emitValue"
            @search="submitSearch"
            @clear="submitSearch"
            @custom="submitSearch"
            @blur="emitEvent(primarySearch.change || 'searchBlur', $event)"
          ></u-search>
          <view class="u-flex-row scroll-x">
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
        <view
          v-if="popupItems.length"
          class="u-p-10 u-m-l-20 u-flex-row"
          @click="toggleSubPanel"
        >
          <u-icon
            name="grid"
            label="筛选"
            labelPos="left"
            :labelColor="actionColor"
            :size="22"
            :color="actionColor"
          ></u-icon>
        </view>
      </view>
    </u-skeleton>
    <u-popup
      :show="showPanel"
      :round="10"
      @close="panelClose"
      mode="bottom"
      bgColor="#F5F5F5"
    >
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
          <u-button
            type="primary"
            plain
            shape="circle"
            text="重置"
            @click="resetSearch"
          ></u-button>
        </view>
        <view class="action-button">
          <u-button
            type="primary"
            shape="circle"
            text="确认"
            @click="submitSearch"
          ></u-button>
        </view>
      </view>
    </u-popup>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import FilterItem from "./base-item";
import PrimaryItem from "./primary-item";
export default {
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
      _first_init: false,
      _PrimaryTypes: ["select", "date", "daterange"],
      rowsWidth: ["inherit"],
      loading: true,
      primarySearch: null,
      primaryItems: [],
      popupItems: [],
      showPanel: false,
    };
  },
  onLoad() {
    if (this.$data._first_init) return;
    this.$data._first_init = true;
    this.initSearch();
    // this.$nextTick(this.initSearch);
  },
  mounted() {
    if (this.$data._first_init) return;
    this.$data._first_init = true;
    this.$nextTick(this.initSearch);
  },
  computed: {
    actionColor() {
      // const keys = Reflect.ownKeys(this.model);
      // for (let i = 0; i < keys.length; i++) {
      //   const k = keys[i];
      //   if (k == "__ob__") continue;
      //   if (this.primarySearch) {
      //     if (k == this.primarySearch.model) continue;
      //   }
      //   const val = this.model[k];
      //   if (!this.isEmpty(val)) return this.$store.getters.theme_color;
      // }
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
    },
    handleItems() {
      let primarySearch = null;
      let sortItems = [];
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
          sortItems.push(item);
          if (
            item.type == "primary" &&
            this.$data._PrimaryTypes.includes(item.filter)
          ) {
            primaryItems.push(item);
          } else {
            popupItems.push(item);
          }
        }
      }
      if (primarySearch) {
        return [primarySearch, [], sortItems];
      } else {
        return [null, primaryItems, popupItems];
      }
    },
    isEmpty(val) {
      if (Array.isArray(val)) {
        return val.length === 0;
      }
      return val === "" || val === null || val === undefined;
    },
    toggleSubPanel() {
      this.showPanel = !this.showPanel;
      this.$emit("visible-change", this.showPanel);
    },
    panelClose() {
      this.showPanel = false;
    },
    resetSearch() {
      this.$emit("reset");
      this.panelClose();
    },
    submitSearch() {
      if (this.model.period != null) {
        if (isNaN(this.model.period * 1) || this.model.period * 1 < 1) {
          this.toastMsg("期次必须为数字切大于0!", "error");
          this.model.period = null;
          this.$emit("update:model", this.model);
          return;
        }
      }
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
      this.$set(item, prop, value);
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
      // if (this.loading) return;
      if (prop === "show") {
        return this.initSearch();
      }
      return this.updateItemAttr(modelKey, prop, value);
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
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
  height: 68rpx;
}
.search-mian-input {
  display: inline-flex;
  flex: 1;
  min-width: 0;
}
.right-filter-action {
  font-size: 16px;
  line-height: 34px;
  color: #606266;
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
</style>
