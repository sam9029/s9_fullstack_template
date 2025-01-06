<template>
  <view class="primary-filter u-m-r-20" :class="classList">
    <!-- select -->
    <koc-select
      v-if="item.filter == 'select'"
      v-model="subValue"
      :list="item.options"
      :placeholder="item.label"
      :clearable="item.clearable"
      :filterable="item.filterable"
      :remote="item.remote"
      @change="handelEvent('change')"
      @remote="handelEvent('remoteMethod', arguments)"
    ></koc-select>
    <!-- date date-range -->
    <uni-datetime-picker
      v-else-if="item.filter == 'date'"
      :type="item.filter"
      v-model="subValue"
      :clear-icon="item.clearable"
      :start="item.start"
      :end="item.end"
      :placeholder="item.label"
      @change="handelEvent('change')"
    ></uni-datetime-picker>
    <view v-else-if="item.filter == 'daterange'">
      <uni-datetime-picker
        :type="item.filter"
        v-model="subValue"
        :clear-icon="item.clearable"
        :start="item.start"
        :end="item.end"
        @change="handelEvent('change')"
      >
        <view class="slot-uni-date-range">
          <input class="slot-uni-date__x-input" type="text" :value="daterangeText" :placeholder="item.label" :disabled="true" />
          <view v-if="showClearIcon" class="slot-uni-date__icon-clear" @click.stop="clearDaterange">
            <u-icon name="close-circle" color="#dcdfe6" size="18"></u-icon>
          </view>
        </view>
      </uni-datetime-picker>
    </view>
  </view>
</template>


<script>
import Select from "../koc-select";

export default {
  options: {
    styleIsolation: "shared",
  },
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
    showClearIcon() {
      if (!this.item.clearable) return false;
      if (!this.value?.length) return false;
      return true;
    },
    daterangeText() {
      if (Array.isArray(this.value)) {
        if (this.value.length) {
          return `${this.value[0]} - ${this.value[1]}`;
        }
      }
      return null;
    },
    classList() {
      switch (this.item.filter) {
        case "select":
          return "primary-filter--select";
        case "date":
          return "primary-filter--date";
        case "daterange":
          return "primary-filter--daterange";
        default:
          return "none";
      }
    },
  },
  methods: {
    handelEvent(evName, args = []) {
      if (this.item[evName]) {
        this.$emit("event", this.item[evName], ...args);
      }
    },
    clearDaterange() {
      this.subValue = [];
      this.handelEvent('change', [[]]);
    }
  },
};
</script>


<style lang="scss" scoped>
@mixin base-primary {
  border-radius: 15px;
  background-color: #f2f2f2;
}
@mixin base-input {
  text-overflow: ellipsis;
  // 覆盖内联样式
  text-align: center !important;
  color: #666 !important;
}
.primary-filter--select {
  width: 130px;
  ::v-deep .koc-select-view {
    @include base-primary;
    .like-uni-date-editor {
      border: none;
      padding: 0 8px 0 15px;
    }
    .u-input__content__field-wrapper__field {
      @include base-input;
    }
  }
}
.primary-filter--date {
  width: 130px;
  ::v-deep .uni-date-editor {
    .uni-date-x--border {
      border: none;
    }
    .uni-date-single {
      @include base-primary;
      padding: 0px;
    }
    .uni-date__x-input {
      padding: 0px 20px;
      @include base-input;
    }
    .uni-date__icon-clear {
      right: 5px;
    }
  }
}
.primary-filter--daterange {
  position: relative;
  width: 220px;
}
.slot-uni-date-range {
  @include base-primary;
}
.slot-uni-date__x-input {
  padding: 0 15px;
  height: 30px;
  line-height: 40px;
  font-size: 14px;
  pointer-events: none;
  @include base-input;
}
.slot-uni-date__icon-clear {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 5px;
  display: flex;
  align-items: center;
}
</style>