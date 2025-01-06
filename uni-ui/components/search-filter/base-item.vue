<template>
  <view>
    <koc-section class="u-m-t-20" :title="item.label"></koc-section>

    <view class="u-flex-col u-p-20 u-bg-f">
      <!-- select -->
      <koc-select
        v-if="item.filter == 'select'"
        v-model="subValue"
        :list="item.options"
        :placeholder="item.placeholder"
        :clearable="item.clearable"
        :filterable="item.filterable"
        :remote="item.remote"
        @change="handelEvent('change')"
        @remote="handelEvent('remoteMethod', arguments)"
        :visibleItemCount="8"
      ></koc-select>
      <!-- date date-range -->
      <uni-datetime-picker
        v-else-if="item.filter == 'date' || item.filter == 'daterange'"
        :type="item.filter"
        v-model="subValue"
        :clear-icon="item.clearable"
        :start="item.start"
        :end="item.end"
        :placeholder="item.placeholder"
        @change="handelEvent('change')"
      ></uni-datetime-picker>
      <view v-else-if="item.filter == 'number'">
        <u--input
          :placeholder="item.placeholder"
          border="surround"
          type="number"
          v-model="subValue"
          clearable
          @change="handelEvent('change')"
          @clear="clear(subValue)"
        ></u--input>
      </view>
      <view v-else-if="item.filter == 'text'">
        <u--input
          :placeholder="item.placeholder"
          border="surround"
          type="text"
          v-model="subValue"
          clearable
          @change="handelEvent('change')"
          @clear="clear(subValue)"
        ></u--input>
      </view>
    </view>
  </view>
</template>

<script>
import Select from "../koc-select";

export default {
  components: {
    "koc-select": Select,
  },
  props: {
    value: {},
    model: {},
    item: Object,
  },
  computed: {
    subValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  methods: {
    handelEvent(evName, args = []) {
      if (this.item[evName]) {
        this.$emit("event", this.item[evName], ...args);
      }
    },
    clear(subValue){
      // console.log(`清除：`,subValue)
      // subValue = null;
    }
  },
};
</script>
