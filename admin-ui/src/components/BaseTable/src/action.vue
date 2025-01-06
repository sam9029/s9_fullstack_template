<template>
  <div class="action" v-if="item.actions">
    <template v-for="(action, index) in buttons">
      <el-divider :key="index" direction="vertical" v-if="index > 0"></el-divider>

      <el-link
        :disabled="action.disabled"
        :key="action.label"
        :underline="false"
        @click.stop="actionEmit(action)"
        >{{ actionLabel(action, row, index) }}
      </el-link>
    </template>

    <el-divider direction="vertical" v-if="dropdowns.length"></el-divider>
    <el-dropdown
      :hide-on-click="false"
      trigger="click"
      v-if="dropdowns.length"
      @command="actionEmit($event)"
    >
      <el-link :underline="false" style="width: none">
        更多
        <i class="el-icon-arrow-down"></i>
      </el-link>

      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          v-for="action in dropdowns"
          :disabled="action.disabled"
          :icon="action.icon"
          :key="action.label"
          :command="action || null"
          >{{ actionLabel(action, row, index) }}</el-dropdown-item
        >
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
  import { isUndefined, isFunction, isBoolean, cloneDeep } from 'lodash';
  export default {
    name: 'Action',
    props: {
      item: { type: Object },
      row: { type: Object },
      column: { type: Object },
      index: { type: Number },
    },
    computed: {
      buttons() {
        let actions = cloneDeep(this.item.actions);
        actions = actions
          .filter((el) => {
            if (isUndefined(el.show)) {
              return el;
            } else if (isFunction(el.show) && el.show(this.row)) {
              return el;
            } else if (isBoolean(el.show) && el.show) {
              return el;
            }
          })
          .map((item) => {
            item.disabled = this.disabledJudge(item);
            item.show = true;
            return item;
          })
          .sort(function (a, b) {
            return a.disabled - b.disabled;
          });
        if (actions.length <= 3) return actions.slice(0, 3);
        if (actions.length > 3) return actions.slice(0, 2);
      },
      dropdowns() {
        let actions = cloneDeep(this.item.actions);
        actions = actions
          .filter((el) => {
            if (isUndefined(el.show)) {
              return el;
            } else if (isFunction(el.show) && el.show(this.row)) {
              return el;
            } else if (isBoolean(el.show) && el.show) {
              return el;
            }
          })
          .map((item) => {
            item.disabled = this.disabledJudge(item);
            item.show = true;
            return item;
          })
          .sort(function (a, b) {
            return a.disabled - b.disabled;
          });
        if (actions.length <= 3) return [];
        if (actions.length > 3) return actions.slice(2);
      },
    },
    methods: {
      actionLabel(action, row, index) {
        return action.customRender ? action.customRender(row, index) : action.label;
      },
      disabledJudge(action) {
        const { disabled, auth = null } = action;
        if (auth && !this.$checkPermi(auth)) {
          return true;
        }
        if (typeof disabled === 'boolean') {
          return disabled;
        } else if (typeof disabled === 'function') {
          return disabled(this.row);
        } else {
          return false;
        }
      },
      actionEmit(action) {
        if (!action.onClick) console.log('没有为该菜单选项添加事件');

        if (action.hasOwnProperty('confirm')) {
          let message = null;
          if (typeof action.confirm === 'string') {
            message = action.confirm;
          } else if (typeof action.confirm === 'function') {
            message = action.confirm(this.row);
          }

          this.$confirm(`${message}`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
            .then(() => {
              this.$emit('actionEmit', action.onClick, this.row, this.column, this.index);
            })
            .catch((err) => {
              // if (notify) notify.close();
              // notify = this.$notify.error({
              //   title: "错误",
              //   message: err.message || err || "未知异常！",
              // });
            });
        } else {
          this.$emit('actionEmit', action.onClick, this.row, this.column, this.index);
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  .action {
    display: flex;
    justify-content: space-around;
    align-items: center;
    .el-link {
      width: 48px;
      color: var(--theme-default);
      font-size: inherit;
    }
  }

  ::v-deep .el-dropdown {
    font-size: inherit;
  }
</style>
