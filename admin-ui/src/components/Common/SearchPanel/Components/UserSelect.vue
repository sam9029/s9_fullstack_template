<template>
  <el-select
    size="small"
    v-bind="$attrs"
    v-on="$listeners"
    filterable
    remote
    :is-multiple="!!$attrs.multiple"
    :collapse-tags="!!$attrs.multiple"
    :remote-method="queryUserOpts"
    @clear="queryUserOpts(null)"
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
// import { userSelect } from '@/api/public';
import { downUser as userSelect } from '@/api/account/personnel/user.js';

export default {
  props: {
    tipKey: String,
    params: Object,
    queryOnMounted: {
      type: Boolean,
      default: true
    },
  },
  data() {
    return {
      options: []
    }
  },
  mounted() {
    if (this.queryOnMounted) {
      /** 若有初始的绑定值 则进行搜索，解决 （收起）和（展示）之间的相同远程搜索项Options 不同步的问题 */
      if (this.$attrs.value) {
        this.queryUserOpts(this.$attrs.value);
      } else {
        this.queryUserOpts();
      }
    }
  },
  methods: {
    queryUserOpts(keyword = '') {
      const payload = {
        ...this.params,
        keyword:keyword || undefined,
      }
      userSelect(payload).then((data) => {
        this.options = data.data.map(v => {
          const obj = {
            // 兼容处理
            value: v.value || v.id,
            label: v.label || v.name,
          };
          if (this.tipKey) {
            obj.tip = v[this.tipKey] || '';
          }
          return obj;
        });
      });
    }
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