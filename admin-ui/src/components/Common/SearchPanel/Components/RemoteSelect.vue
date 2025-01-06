<template>
  <el-select
    size="small"
    v-bind="$attrs"
    v-on="$listeners"
    filterable
    remote
    reserve-keyword
    :clearable="clearable"
    :is-multiple="!!$attrs.multiple"
    :collapse-tags="!!$attrs.multiple"
    :remote-method="queryOptions"
    @focus="lazyQueryOpts"
  >
    <el-option v-for="item in options" :key="item.value" v-bind="item">
      <div v-if="tipKey" class="option-show-id">
        <span>{{ item.label }}</span>
        <span class="tip-value">{{ item.tip }}</span>
      </div>
    </el-option>
  </el-select>
</template>


<script>
import Vue from 'vue'
import { downUser } from '@/api/account/personnel/user.js';
import { adverDownList } from '@/api/account/advertiser/advertiser.js';
import { ACCOUNT_TYPE_MAPPER } from '@/utils/mapper';
import store from '@/store'

export default {
  props: {
    tipKey: String,
    params: Object,
    remote: Function,
    type: String,
    clearable:Boolean
  },
  data() {
    return {
      init: false,
      options: []
    }
  },
  watch: {
    params() {
      this.queryOptions().then(() => {
        this.callSetSelected();
      });
    },
    "$attrs.value"() {
      // 父级更改value导致没有选中
      this.$nextTick(() => {
        let isNotSelect = this.isNotSelectOption();
        if (isNotSelect) {
          this.queryAndSelected();
        }
      })
    }
  },
  mounted() {
    // 没有value 不会查询， 用于创建时就有默认值
    this.queryAndSelected();
  },
  methods: {
    queryOptions(keyword = '') {
      this.init = true;
      const payload = {
        account_type: store.getters.accountType,
        ...this.params,
        keyword,
      }
      if (!payload.pagesize) {
        payload.pagesize = 100;
      }
      let func = this.getQueryFn();
      return func(payload).then((options) => {
        this.options = options;
      });
    },
    getQueryFn() {
      if (this.remote) return this.remote
      if (this.type) {
        switch(this.type) {
          case 'select-user':
            return this.getUserOpts;
          case 'select-adver':
            return this.getAdverOpts;
          default:
            throw "error remote type";
        }
      }
      throw 'remote or type is required';
    },
    lazyQueryOpts() {
      if (this.init) return;
      this.init = true;
      if (!this.$attrs.value) return this.queryOptions();
      return this.queryAndSelected()
    },
    queryAndSelected() {
      if (!this.$attrs.value) return;
      this.init = true;
      this.queryOptions(this.$attrs.value).then(() => {
        this.callSetSelected();
      });
    },
    isNotSelectOption() {
      const elSelect = this.$children[0];
      if (!elSelect?.selected) return elSelect;
      // 找到选项是vue实例 临时是Object
      let isSelectElOption = elSelect.selected instanceof Vue;
      if (isSelectElOption) return false;
      return elSelect;
    },
    callSetSelected() {
      const isNotSelect = this.isNotSelectOption();
      if (isNotSelect) {
        isNotSelect.setSelected?.();
      }
    },
    getUserOpts(params) {
      return downUser(params).then((data) => {
        return data.data.map(v => {
          if (v.account_type) {
            v.role_name = ACCOUNT_TYPE_MAPPER[v.account_type] || '其他';
          }
          const obj = {
            value: v.id,
            label: v.name,
          };
          this.setOptTip(obj, v);
          return obj;
        });
      })
    },
    getAdverOpts(params) {
      return adverDownList(params).then((data) => {
        return data.data.map(v => {
          const obj = {
            value: v.value,
            label: v.label,
          };
          this.setOptTip(obj, v);
          return obj;
        });
      })
    },
    setOptTip(opt, data) {
      if (this.tipKey) {
        opt.tip = data[this.tipKey] || '';
      }
    },
  },
};
</script>

<style lang="scss">
  .option-show-id {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    .tip-value {
      padding-left: 15px;
      font-size: 12px;
      color: #8492a6;
    }
  }
</style>