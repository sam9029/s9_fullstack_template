<template>
  <el-dropdown @command="handleCommand" style="margin-left: 10px" trigger="click">
    <DescButton icon="el-icon-s-operation" circle plain :size="size" desc="自定义列" />

    <el-dropdown-menu slot="dropdown">
      <template v-for="(item, index) in custom_columns_options">
        <el-dropdown-item
          :key="index"
          v-if="item && item.user_id == $store.getters.userInfo.accountId && item.name !== '未命名'"
          :command="item"
        >
          <i :class="[item.isChecked ? 'el-icon-check' : 'checked_box']"></i>
          {{ item.name }}
        </el-dropdown-item>
      </template>

      <el-dropdown-item command="custom" divided>
        <i class="el-icon-circle-plus-outline"></i>自定义
      </el-dropdown-item>
    </el-dropdown-menu>

    <CustomColumnPanel
      ref="CustomColumnPanel"
      :columns="columns"
      :columnsGroup="columnsGroup"
      :columnsKey="columnsKey"
      @app="columnsChange"
    ></CustomColumnPanel>
  </el-dropdown>
</template>

<script>
  import CustomColumnPanel from './customColumnPanel.vue';
  import DescButton from '@/components/DescButton/index.vue';

  export default {
    components: {
      CustomColumnPanel,
      DescButton,
    },
    props: {
      size: {
        type: String,
      },
      columns: {
        type: Array,
        default: () => [],
      },
      columnsGroup: {
        type: Array,
        default: () => [],
      },
      columnsKey: {
        type: String,
        default: '',
      },
    },
    data() {
      return {
        custom_columns_options: [],
      };
    },
    methods: {
      columnsChange(data) {
        this.init(data);
      },
      handleCommand(command) {
        if (command == 'custom') {
          this.$refs.CustomColumnPanel.handleOpen();
        } else {
          let re = JSON.parse(JSON.stringify(command));

          this.custom_columns_options = this.custom_columns_options.map((item) => {
            if (item.name == re.name && item.user_id == re.user_id) {
              item.isChecked = true;
            } else {
              item.isChecked = false;
            }
            return item;
          });

          this.custom_columns_options = this.custom_columns_options.filter(
            (item) => item.version === process.env.VUE_APP_BASETABLE_VERSION,
          );
          localStorage.setItem(this.columnsKey, JSON.stringify(this.custom_columns_options));
          this.$emit('columnsChange', command.columns);
          this.$notify({
            message: `自定义列:《${re.name}》, 应用成功`,
            type: 'success',
          });
        }
      },
      init(data) {
        if (this.columnsKey) {
          let localData = localStorage.getItem(this.columnsKey);
          this.custom_columns_options =
            (localData && localData.length && JSON.parse(localData)) || [];
          this.custom_columns_options = this.custom_columns_options.filter(
            (item) => item.version === process.env.VUE_APP_BASETABLE_VERSION,
          );
          localStorage.setItem(this.columnsKey, JSON.stringify(this.custom_columns_options));
          let bool = true
          this.custom_columns_options.forEach((element) => {
            if (element.isChecked) {
              bool = false
              this.$emit('columnsChange', element.columns);
            }
          });
          // 防止多次触发
          if (bool) this.$emit('columnsChange', data);
        }
      },
    },

    mounted() {
      this.init();
    },
  };
</script>

<style lang="scss" scoped>
  .checked_box {
    display: inline-block;
    width: 13px;
  }
</style>
