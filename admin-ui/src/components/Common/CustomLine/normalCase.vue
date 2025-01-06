<template>
  <div class="inline-button custom-line">
    <el-dropdown
      ref="CUSTOM_COLUMNS_DROPDOWN"
      trigger="click"
      placement="bottom"
      :hide-on-click="false"
      @command="handleCommandCustim"
    >
      <!-- el-dropdown-link -->
      <!-- search_nav_btn -->
      <template v-if="btnType == 'tencent'">
        <el-link :underline="false" class="search_nav_btn" @click.stop>
          <div class="flex flex_center" @click.stop="customBtn">
            <svg-icon iconName="shuanglie"></svg-icon>
            <div>自定义列</div>
          </div>
        </el-link>
      </template>
      <template v-else>
        <el-tooltip content="自定义列" placement="top">
          <el-button size="small" @click.stop>
            <div class="flex" @click.stop="customBtn">
              <!-- icon ic-shuanglie -->
              <div class="el-icon-edit"></div>
              <!-- <div>自定义列</div> -->
            </div>
          </el-button>
        </el-tooltip>
      </template>
      <el-dropdown-menu slot="dropdown">
        <div class="dis_flex" v-loading="loading" element-loading-spinner="el-icon-loading">
          <template>
            <div class="dropdown_box">
              <div class="dropdown_screen_title">常用自定义列</div>
              <div class="dropdown_item_box">
                <el-scrollbar>
                  <template v-for="(item, index) in custom_columns_options">
                    <el-dropdown-item
                      :icon="item.icon"
                      :key="index"
                      :command="composeValue(item)"
                      :style="{ '--theme': theme }"
                      :class="[item.isChecked ? 'isChecked' : '']"
                    >
                      <div class="flex flex_between">
                        <div class="flex">
                          <div
                            :class="[item.isChecked ? 'el-icon-check' : '', 'checked_box']"
                          ></div>
                          <div class="text_ellipsis" :title="item.name">
                            {{ item.name }}
                          </div>
                        </div>
                        <div class="edit_box flex">
                          <div
                            class="el-icon-edit-outline edit_box_item"
                            @click.stop="edit_custom(item)"
                          ></div>
                          <div
                            class="el-icon-delete edit_box_item"
                            @click.stop="delete_custom(item)"
                          ></div>
                        </div>
                      </div>
                    </el-dropdown-item>
                  </template>
                </el-scrollbar>
              </div>
              <el-dropdown-item command="custom">
                <div class="flex top-boder">
                  <div class="checked_box el-icon-circle-plus-outline"></div>
                  <div>自定义</div>
                </div>
              </el-dropdown-item>
            </div>
          </template>
        </div>
      </el-dropdown-menu>
    </el-dropdown>
    <!-- 自定义列 -->
    <CustomLineDia
      ref="CUSTOM_COLUMNS"
      v-bind="$attrs"
      v-on="$listeners"
      @configLocal="configLocal"
    >
    </CustomLineDia>
  </div>
</template>
<script>
  export default {
    props: {
      btnType: {
        type: String,
        default: 'normal',
      },
      type: {
        type: String,
        default: 'localStorage',
      },
      localName: {
        type: String,
      },
      asyncMethod: {
        type: Function,
      },
    },
    data() {
      return {
        custom_columns_options: [],
        local: null,
        loading: false,
      };
    },
    computed: {
      theme() {
        return this.$store.getters.effectSettings.theme;
      },
    },
    components: {
      CustomLineDia: () => import('./index'),
    },
    created() {
      this.syncLocal();
    },
    methods: {
      openCustom(type, data, name) {
        this.$refs.CUSTOM_COLUMNS && this.$refs.CUSTOM_COLUMNS.openDia(type, data, name);
      },
      composeValue(obj) {
        return obj;
      },
      handleCommandCustim(command, msg = true) {
        if (command == 'custom') {
          this.openCustom('custom');
        } else {
          if (!command.isChecked) {
            //清除别的checked
            for (const key in this.custom_columns_options) {
              this.custom_columns_options[key].isChecked = false;
            }
            this.$set(command, 'isChecked', true);
            if (msg) {
              this.$notify.success(`${command.name}--->>>应用成功！`);
            }
            let sendData = JSON.parse(command.data);
            this.openCustom('checked', sendData);
            this.local.forEach((v) => {
              v.isChecked = false;
              v.name == command.name && (v.isChecked = true);
            });
            this.saveLocal(JSON.stringify(this.local));
          }
        }
      },
      async customBtn() {
        this.syncLocal();
        if (this.type == 'localStorage') {
          if (this.local && this.local.length) {
            this.$refs.CUSTOM_COLUMNS_DROPDOWN && this.$refs.CUSTOM_COLUMNS_DROPDOWN.handleClick();
          } else {
            this.openCustom();
          }
        } else if (this.type == 'async') {
          //这种模式数据的交互太麻烦了 后续没写 主要应用local模式
          if (this.asyncMethod) {
            let el = this.$refs.CUSTOM_COLUMNS_DROPDOWN;
            try {
              el.handleClick();
              this.loading = true;
              let res = await this.asyncMethod();
              this.loading = false;
              if (!res) {
                el.handleClick();
                // this.$emit("openCustom");
                this.openCustom();
              } else {
                this.custom_columns_options = res;
              }
            } catch (error) {
              el.handleClick();
              this.loading = false;
            }
          }
        }
      },
      syncLocal() {
        if (this.type == 'localStorage') {
          localStorage.getItem(this.localName) &&
            (this.local = JSON.parse(localStorage.getItem(this.localName)));
          if (this.local && this.local.length) {
            this.custom_columns_options = this.local;
          } else {
            this.local = [];
          }
        }
      },
      configLocal(type, res, name) {
        let back = JSON.parse(res);
        if (type == 'custom') {
          this.local.forEach((v) => (v.isChecked = false));
          let res = back.filter((v) => v.show).map((k) => k.prop);
          //新增
          this.local.push({
            name,
            data: JSON.stringify(res),
            isChecked: true,
          });
          this.saveLocal(JSON.stringify(this.local));
        } else if (type == 'edit') {
          let propArr = back.filter((v) => v.show).map((k) => k.prop);
          this.local.forEach((v) => {
            if (v.name == name) {
              //更新他的data值
              v.data = JSON.stringify(propArr);
            }
          });
          this.saveLocal(JSON.stringify(this.local));
        } else if (type == 'init') {
          if (this.local && this.local.length) {
            let data = this.local.filter((v) => v.isChecked == true)[0];
            //有缓存 处理下用缓存的参数show
            if (data && data.data) {
              let arr = JSON.parse(data.data);
              back.forEach((v) => {
                if (arr.includes(v.prop)) {
                  v.show = true;
                } else {
                  v.show = false;
                }
              });
            }
          }
        }
        this.$emit('cloumChange', back);
      },
      saveLocal(data) {
        localStorage.setItem(this.localName, data);
      },
      delete_custom(data) {
        let index = this.local.findIndex((v) => v.name == data.name);
        this.local.splice(index, 1);
        this.saveLocal(JSON.stringify(this.local));
        this.$notify.success(`${data.name},删除成功`);
        this.syncLocal();
      },
      edit_custom(data) {
        this.openCustom('edit', JSON.parse(data.data), data.name);
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
