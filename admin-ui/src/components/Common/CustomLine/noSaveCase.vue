<template>
  <div class="inline-button custom-line">
    <el-button size="small" @click.stop="btnClick">
      <div class="flex">
        <!-- icon ic-shuanglie -->
        <div class="el-icon-edit"></div>
        <!-- <div>自定义列</div> -->
      </div>
    </el-button>
    <!-- 自定义列 -->
    <CustomLineDia
      ref="CUSTOM_COLUMNS"
      :showSave="false"
      v-bind="$attrs"
      v-on="$listeners"
      @configLocal="configLocal"
    >
    </CustomLineDia>
  </div>
</template>
<script>
  export default {
    props: {},
    data() {
      return {
        //
      };
    },
    components: {
      CustomLineDia: () => import('./index'),
    },
    created() {
      //
    },
    methods: {
      btnClick() {
        this.openCustom('custom');
      },
      openCustom(type, data, name) {
        this.$refs.CUSTOM_COLUMNS && this.$refs.CUSTOM_COLUMNS.openDia(type, data, name);
      },
      configLocal(type, res, name) {
        let back = JSON.parse(res);
        this.$emit('cloumChange', back);
      },
    },
  };
</script>
<style lang="scss" scoped>
  .inline-button {
    display: inline-block;
  }
  .mr10 {
    margin-right: 10px;
  }
  .flex {
    display: flex;
    align-items: center;
  }
  .dis_flex {
    display: flex;
  }
  .dropdown_box {
    min-width: 130px;
  }
  .dropdown_screen_title {
    font-weight: bold;
    padding-left: 32px;
    font-size: 12px;
    position: sticky;
    line-height: 30px;
    border-bottom: 1px solid #d7dbe1;
  }
  .dropdown_item_box {
    max-height: 150px;
    ::v-deep .el-scrollbar {
      height: 100%;
      .el-scrollbar__wrap {
        overflow-x: hidden;
        max-height: 150px;
        margin-bottom: 0 !important;
      }
    }
  }
  .isChecked {
    color: #{'var(--theme)'};
    &:not(.is-disabled):hover,
    &:focus {
      // background-color: #f6f8f9;
      color: #{'var(--theme)'};
    }
  }
  .checked_box {
    display: inline-block;
    width: 32px;
    line-height: 19px;
    height: 19px;
    text-align: center;
    font-weight: bolder;
    font-size: 16px;
  }
  .text_ellipsis {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .flex_between {
    justify-content: space-between;
  }
  .edit_box {
    width: 45px;
    height: 36px;
    margin-left: 5px;
    .edit_box_item {
      display: none;
      padding: 4px;
      &:hover {
        background-color: #9999;
      }
    }
  }
  .el-dropdown-menu--medium .el-dropdown-menu__item {
    padding: 0;
    &:hover {
      .edit_box_item {
        display: block;
      }
    }
  }
  .top-boder {
    border-top: 1px solid #d7dbe1;
  }
  .noPad {
    padding: 0;
  }
  .fillBtn {
    line-height: 32px;
    padding: 0 20px;
  }
  .mr14 {
    margin-right: 14px;
  }
  .search_nav_btn {
    color: #333;
    // padding: 0 12px;
    width: 86px;
    display: inline-block;
    text-align: center;
    line-height: 36px;
    &:hover {
      background: #f6f8f9;
    }
  }
  .flex_center {
    justify-content: center;
  }
</style>
