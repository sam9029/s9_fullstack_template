<template>
  <div>
    <BaseDialog
      :ok-loading="bool.ok_loading"
      :visible="bool.dialog_visible"
      ref="CustomColumnPanel"
      title="自定义列"
      width="996px"
      @visible-change="visibleChange"
    >
      <template>
        <div class="main">
          <div class="left">
            <div class="header">
              <div>可添加的列</div>
            </div>
            <div class="content">
              <div style="flex: 1" class="categoryContainer">
                <div v-for="(item, index) in new_columnsGroup" :key="index" class="categoryTitle">
                  {{ item.name }}
                </div>
              </div>
              <div style="flex: 3; border: none" class="categoryContainer">
                <div
                  v-for="(item, index) in initColumns"
                  :key="item.key || index"
                  class="checkList"
                >
                  <div class="check-lable">
                    <el-checkbox
                      :indeterminate="item.isIndeterminate"
                      v-model="item.isCheckAll"
                      @change="checkedAll($event, item)"
                      >{{ item.name }}</el-checkbox
                    >
                  </div>

                  <div style="padding: 0 0 0 18px">
                    <template v-for="item1 in item.children">
                      <el-checkbox
                        :disabled="item1.disabled"
                        :key="item1.prop"
                        :label="item1.prop"
                        @change="selectionChange(item, item1)"
                        style="width: 40%; margin-top: 8px"
                        v-model="item1.show"
                        >{{ item1.label }}</el-checkbox
                      >
                      <template v-if="item1.children && item1.children.length > 1">
                        <el-checkbox
                          :disabled="item2.disabled"
                          :key="item2.prop"
                          :label="item2.prop"
                          @change="selectionChange(item1, item2, true)"
                          style="width: 40%; margin-top: 8px"
                          v-model="item2.show"
                          v-for="item2 in item1.children"
                          >{{ item2.label }}</el-checkbox
                        >
                      </template>
                        
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="width: 20px"></div>
          <div class="right">
            <div class="header">
              <div>已选 {{ selectColumns.length }} 列</div>
              <el-link :underline="false" type="primary" class="fontWeight" @click="empty"
                >清空</el-link
              >
            </div>
            <div class="content">
              <div style="flex: 1">
                <el-divider>
                  <span class="ft12">固定列</span>
                </el-divider>
                <draggable
                  v-model="fixedColumns"
                  chosenClass="chosen"
                  forceFallback="true"
                  group="people"
                  :scroll="true"
                  animation="1000"
                  handle=".mover"
                  @start="onStart"
                  @end="onEnd"
                >
                  <transition-group>
                    <div v-for="item in fixedColumns" :key="item.prop" class="item">
                      <span>
                        <span class="mover bg">
                          <i class="el-icon-rank"></i>
                        </span>
                        <span class="bg">
                          <i
                            class="el-icon-download"
                            style="transform: rotate(90deg)"
                            :style="{
                              color: item.fixed == 'left' ? 'var(--theme-default)' : '',
                            }"
                            @click.stop="fixed(item, 'left', false)"
                          ></i>
                        </span>
                        <span class="bg">
                          <i
                            class="el-icon-download"
                            style="transform: rotate(270deg)"
                            :style="{
                              color: item.fixed == 'right' ? 'var(--theme-default)' : '',
                            }"
                            @click.stop="fixed(item, 'right', false)"
                          ></i>
                        </span>
                        {{ item.label }}
                      </span>
                      <span class="bg">
                        <i class="el-icon-close" @click="deleteSelect(item)"></i>
                      </span>
                    </div>
                  </transition-group>
                </draggable>
                <el-divider>
                  <span class="ft12">可拖动列</span>
                </el-divider>
                <draggable
                  v-model="ordinaryColumns"
                  chosenClass="chosen"
                  forceFallback="true"
                  group="people"
                  animation="1000"
                  handle=".mover"
                  @start="onStart"
                  @end="onEnd"
                >
                  <transition-group>
                    <div v-for="item in ordinaryColumns" :key="item.prop" class="item">
                      <span>
                        <span class="mover bg">
                          <i class="el-icon-rank"></i>
                        </span>
                        <span class="bg">
                          <i
                            class="el-icon-download"
                            style="transform: rotate(90deg)"
                            @click.stop="fixed(item, 'left', true)"
                          ></i>
                        </span>
                        <span class="bg">
                          <i
                            class="el-icon-download"
                            style="transform: rotate(270deg)"
                            @click.stop="fixed(item, 'right', true)"
                          ></i>
                        </span>
                        {{ item.label }}
                      </span>
                      <span class="bg">
                        <i class="el-icon-close" @click="deleteSelect(item)"></i>
                      </span>
                    </div>
                  </transition-group>
                </draggable>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex">
          <div class="flex">
            <template v-if="columnsKey">
              <el-checkbox v-model="bool.save_visible">保存为常用自定义列</el-checkbox>
              <el-form ref="elform" :model="form" :rules="rules" v-if="bool.save_visible">
                <el-form-item prop="save_name">
                  <el-input
                    placeholder="请输入自定义列名称"
                    type="text"
                    autofocus
                    maxlength="10"
                    show-word-limit
                    v-model="form.save_name"
                  ></el-input>
                </el-form-item>
              </el-form>
            </template>
          </div>
          <div>
            <el-button @click="bool.dialog_visible = false">取消</el-button>
            <el-button type="primary" @click="handleOk" :loading="bool.ok_loading">应用</el-button>
          </div>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import draggable from 'vuedraggable';
  import { cloneDeep } from 'lodash';
  export default {
    components: {
      BaseDialog,
      draggable,
    },
    props: {
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
        bool: {
          dialog_visible: false,
          ok_loading: false,
          save_visible: false,
        },
        form: {
          save_name: '',
        },
        rules: {
          save_name: [{ required: true, message: '名称必填', trigger: 'blur' }],
        },
        initColumns: [],
        selectColumns: [],
        ordinaryColumns: [],
        fixedColumns: [],

        new_columns: [],
        new_columnsGroup: [],
      };
    },
    created() {
      // this.init();
    },
    methods: {
      empty() {
        this.initColumns = this.initColumns.map((item) => {
          item.isCheckAll = false;
          item.isIndeterminate = false;
          item.children = item.children.map((el) => {
            delete el.show;
            delete el.fixed;
            return el;
          });
          return item;
        });
        this.selectColumns = [];
        this.ordinaryColumns = [];
        this.fixedColumns = [];
      },
      fixed(item, location, flag) {
        if (flag) {
          this.selectColumns = this.selectColumns.map((val) => {
            if (val.prop == item.prop) val.fixed = location;
            return val;
          });
        } else {
          this.selectColumns = this.selectColumns.map((val) => {
            if (val.prop == item.prop) delete item.fixed;
            return val;
          });
        }
        this.fixedColumns = this.selectColumns.filter((item) => item.fixed);
        this.ordinaryColumns = this.selectColumns.filter((item) => !item.fixed);
      },
      init() {
        let obj = { 0: [] };
        this.initColumns = [];
        this.new_columns.forEach((item) => {
          if (!item.hasOwnProperty('groupLevel')) {
            obj[0].push(item);
          } else {
            !obj[item.groupLevel] && (obj[item.groupLevel] = []);
            obj[item.groupLevel].push(item);
          }
        });

        if (this.columnsGroup && this.columnsGroup.length) {
          this.new_columnsGroup.forEach((item) => {
            this.initColumns.push({
              ...item,
              isCheckAll: false,
              isIndeterminate: false,
              children: obj[item.key],
            });
          });
        } else {
          this.initColumns.push({
            key: 0,
            name: '其他',
            isCheckAll: false,
            isIndeterminate: false,
            children: this.new_columns,
          });
        }
        let flag = false;
        this.initColumns = this.initColumns.filter((item) => {
          let a_flag = true;
          let b_flag = false;

          if (item.children && item.children.length) {
            item.children &&
              item.children.forEach((el) => {
                !el.disabled && el.show == false && (a_flag = false);
                !el.disabled && el.show == true && (b_flag = true);
              });

            item.isCheckAll = a_flag;
            item.isIndeterminate = !a_flag && b_flag;
            return item;
          } else {
            flag = true;
          }

          if (flag) {
            this.new_columnsGroup = this.new_columnsGroup.filter((item) => item.key != 0);
          }
        });

        // console.log(this.initColumns, this.new_columns, this.new_columnsGroup, obj)
      },
      checkedAll(e, item) {
        this.initColumns.forEach((el) => {
          if (el.key == item.key) {
            el.isCheckAll = e;
            el.isIndeterminate = false;
          }
          if (item.key == el.key) {
            el.children = el.children.map((val) => {
              !val.disabled && (val.show = e);
              return val;
            });
          }
        });
      },
      selectionChange(data, val_b, childCol = false) {
        // 复杂表结构父一级列表控制子一级列表显隐
        data.children.forEach((col) => {
          if (col.children && col.children.length && col.label == val_b.label) {
            col.children.forEach((el) => el.show = val_b.show);
          }
        });
        // 复杂表结构子一级列表控制父一级列表显隐
        if (childCol) {
          let flag = 0;
          data.children.forEach((el) => {
            if(el.show) flag++;
            flag > 0 ? data.show = true : data.show = false;
          });
        }
        if (data.children.every((item) => item.show == true || item.disabled)) {
          data.isCheckAll = true;
          data.isIndeterminate = false;
        } else if (data.children.every((item) => item.show == false || item.disabled)) {
          data.isCheckAll = false;
          data.isIndeterminate = false;
        } else {
          data.isCheckAll = false;
          data.isIndeterminate = true;
        }
      },

      handleClose() {
        this.bool.dialog_visible = false;
      },
      handleOpen() {
        this.bool.dialog_visible = true;
        this.form.save_name = '';
      },
      handleOk() {
        this.bool.ok_loading = true;
        if (this.bool.save_visible && !this.valid()) {
          this.bool.ok_loading = false;
          return;
        }

        let localData = (this.columnsKey && localStorage.getItem(this.columnsKey)) || [];
        let da = (localData && localData.length && JSON.parse(localData)) || [];
        let hasNot = -1,
          repeat = false;

        let obj = {
          name: this.form.save_name || '未命名',
          isChecked: true,
          user_id: this.$store.getters.userInfo.accountId,
          create_time: new Date(),
          columns: this.selectColumns,
          version: process.env.VUE_APP_BASETABLE_VERSION,
          // columns: [...this.ordinaryColumns, ...this.fixedColumns],
        };

        da = da.map((item, index) => {
          item.isChecked = false;
          if (
            !this.bool.save_visible &&
            item.name == '未命名' &&
            item.user_id == this.$store.getters.userInfo.accountId
          ) {
            hasNot = index;
            // item.isChecked = true;
            item = obj;
          }
          if (
            this.bool.save_visible &&
            item.name == this.form.save_name &&
            item.user_id == this.$store.getters.userInfo.accountId
          ) {
            repeat = true;
          }
          return item;
        });

        if (repeat) {
          this.$notify.error('自定义列名称重复');
          this.bool.ok_loading = false;
          return;
        }

        hasNot == -1 && da.push(obj);

        this.columnsKey && localStorage.setItem(this.columnsKey, JSON.stringify(da));

        setTimeout(() => {
          // this.$emit("app", [...this.ordinaryColumns, ...this.fixedColumns]);
          this.$emit('app', this.selectColumns);
          this.bool.ok_loading = false;
          this.bool.save_visible = false;
          this.bool.dialog_visible = false;
        }, 1000);
      },
      valid() {
        let flag = true;
        this.$refs.CustomColumnPanel.$slots.footer[0].context.$refs.elform.validate((valid) => {
          if (valid) {
            return true;
          } else {
            flag = false;
            return false;
          }
        });
        return flag;
      },
      onStart() {
        this.drag = true;
      },
      onEnd() {
        this.drag = false;
      },
      deleteSelect(data) {
        this.initColumns = this.initColumns.map((item) => {
          item.children = item.children.map((val) => {
            if (val.prop == data.prop) {
              val.show = false;
            }
            return val;
          });
          return item;
        });
      },
      visibleChange(val, type) {
        this.bool.dialog_visible = val;
      },
    },
    watch: {
      columns: {
        handler(val) {
          this.new_columns = cloneDeep(
            val.map((item) => {
              if (!item.hasOwnProperty('show')) item.show = true;
              if (!item.hasOwnProperty('fixed')) item.fixed = false;
              return item;
            }),
          );
          this.new_columnsGroup = cloneDeep(this.columnsGroup);
          this.new_columnsGroup.push({ key: 0, name: '其他' });
          this.init();
        },
        immediate: true,
        deep: true,
      },
      initColumns: {
        handler(val) {
          let arr = [];
          // val.forEach((item) => {
          //   item.children &&
          //     item.children.length &&
          //     item.children.forEach((val) => {
          //       val.show && arr.push(val);
          //     });
          // });
          val.forEach((item) => {
            arr.push(...item.children);
          });
          this.selectColumns = arr;
          this.fixedColumns = this.selectColumns.filter((item) => item.show && item.fixed);
          this.ordinaryColumns = this.selectColumns.filter((item) => item.show && !item.fixed);
        },
        immediate: true,
        deep: true,
      },
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep .el-dialog__header {
    border-bottom: 1px solid #dedede;
    ::v-deep .el-dialog__title {
      height: 20px;
    }
  }
  ::v-deep .el-dialog__footer {
    border-top: 1px solid #dedede;
  }
  .flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  ::v-deep .el-form-item {
    margin: 0 0 0 8px;
  }

  .main {
    display: flex;
    height: 500px;
    min-width: 888px;
    .left {
      flex: 4;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      flex-direction: column;
      .content {
        border-top: 1px solid #e0e0e0;
        display: flex;
        height: 100%;
        width: 100%;
        overflow: scroll;
      }
    }

    .right {
      // align-items: center;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      display: flex;
      flex: 2;
      justify-content: space-between;
      flex-direction: column;
      .content {
        border-top: 1px solid #e0e0e0;
        display: flex;
        width: 100%;
        height: 100%;
        overflow: scroll;
      }
    }

    .header {
      align-items: center;
      background-color: #f9fafd;
      border-radius: 5px;
      color: #000;
      display: flex;
      font-weight: bold;
      justify-content: space-between;
      padding: 8px 12px;
      width: 100%;
      height: 44px;
      .wid50 {
        width: 30%;
        transition: all 0.3s;
        &:hover {
          width: 40%;
        }
      }
    }
  }

  .categoryContainer {
    padding: 10px 10px 0;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    border-right: 1px solid #e0e0e0;
    .categoryTitle {
      background-color: #f1f1f1;
      border: solid 1px #eee;
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;

      & + .categoryTitle {
        border-top: none;
        margin-top: 6px;
      }
    }

    .categoryContent {
      padding-left: 10px;
      margin-bottom: 10px;
    }
  }

  .item {
    background-color: #f1f1f1;
    border: solid 1px #eee;
    display: flex;
    justify-content: space-between;
    margin: 0px 10px 0px 10px;
    padding: 6px 12px;
    .mover {
      cursor: move !important;
    }
    .bg {
      background-color: #fdfdfd;
      cursor: pointer;
      padding: 3px 6px;
      margin-right: 4px;
      &:hover {
        color: #000000;
        background-color: #accef8;
      }
    }
    & + .item {
      border-top: none;
      margin-top: 6px;
    }
  }

  .checkList {
    & + .checkList {
      border-top: none;
      margin-top: 24px;
    }
  }
  .check-lable {
    font-size: 14px;
    font-weight: 700;
    border-top: 1px solid #e0e0e0;
    line-height: 30px;
    background-color: #f5f5f5;
    border-radius: 5px;
    padding-left: 10px;
  }
</style>
