<template>
  <!-- 自定义列弹窗 -->
  <el-dialog
    title="自定义列"
    :visible.sync="dialogDiyColumnVisible"
    class="set-cloum-dia"
    append-to-body
  >
    <div class="Border">
      <el-row :gutter="20">
        <el-col :span="18" class="checkGroup checkColBox">
          <div class="dialogTi">
            <div>可添加的列</div>
            <el-input
              v-model="searchKeyword"
              placeholder="可搜索"
              size="mini"
              class="wid50"
              clearable
              prefix-icon="el-icon-search"
            ></el-input>
          </div>
          <el-row class="flex_1 searchContent" type="flex">
            <template v-if="!isSearchKeyword">
              <el-col :span="5" class="categoryContainer">
                <template v-for="(item, index) in nameMapper">
                  <div :key="index">
                    <div class="categoryTitle" :title="item.name">
                      {{ item.name }}
                    </div>
                    <div class="categoryContent">
                      <el-link
                        v-for="(item1, index1) in item.children"
                        :key="index1"
                        :underline="false"
                        @click="toId(item1)"
                        :title="item1.name"
                      >
                        {{ item1.name }}
                      </el-link>
                    </div>
                  </div>
                </template></el-col
              >
              <el-col :span="19">
                <div class="checkGroup1">
                  <template v-for="(item, index) in columnCol">
                    <div :key="index" class="pad10">
                      <div class="groupTitle" :title="item.name">
                        {{ item.name }}
                      </div>
                      <template v-for="(item1, index1) in item.children">
                        <div :key="index1">
                          <div class="check-lable" :id="item1.id">
                            <el-checkbox
                              :indeterminate="item1.isIndeterminate"
                              v-model="item1.isCheckAll"
                              @change="checkedAll(item1)"
                            ></el-checkbox
                            >{{ item1.name }}
                          </div>
                          <div class="OptionS">
                            <template v-for="(item2, index2) in item1.children">
                              <el-checkbox
                                :key="item1.name + index2"
                                v-model="item2.show"
                                :disabled="checkDisable(item2)"
                                @change="selectionChange(item1, item2)"
                                :title="item2.label"
                                >{{ item2.label }}</el-checkbox
                              >
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </el-col>
            </template>
            <!-- 搜索结果 -->
            <template v-else>
              <template v-if="columnColFilter.length">
                <el-col :span="5" class="categoryContainer">
                  <template v-for="(item, index) in columnColFilter">
                    <div :key="index">
                      <div class="categoryTitle" :title="item.name">
                        {{ item.name }}
                      </div>
                      <div class="categoryContent">
                        <el-link
                          v-for="(item1, index1) in item.children"
                          :key="index1"
                          :underline="false"
                          @click="toId(item1)"
                          :title="item1.name"
                        >
                          {{ item1.name }}
                        </el-link>
                      </div>
                    </div>
                  </template>
                </el-col>
                <el-col :span="19">
                  <div class="checkGroup1">
                    <template v-for="(item, index) in columnColFilter">
                      <div :key="index" class="pad10">
                        <div class="groupTitle" :title="item.name">
                          {{ item.name }}
                        </div>
                        <template v-for="(item1, index1) in item.children">
                          <div :key="index1">
                            <div class="check-lable" :id="item1.id">
                              <el-checkbox
                                :indeterminate="item1.isIndeterminate"
                                v-model="item1.isCheckAll"
                                @change="checkedAll(item1)"
                              ></el-checkbox
                              >{{ item1.name }}
                            </div>
                            <div class="OptionS">
                              <template v-for="(item2, index2) in item1.children">
                                <el-checkbox
                                  :key="item1.name + index2"
                                  v-model="item2.show"
                                  :disabled="checkDisable(item2)"
                                  @change="selectionChange(item1, item2)"
                                  :title="item2.label"
                                  >{{ item2.label }}</el-checkbox
                                >
                              </template>
                            </div>
                          </div>
                        </template>
                      </div>
                    </template>
                  </div>
                </el-col>
              </template>
              <template v-else>
                <div class="noData">
                  <!-- iconfont 没有引入 -->
                  <svg-icon class="meiyoushuju" iconName="meiyoushuju"></svg-icon>
                  <div>暂无数据</div>
                </div>
              </template>
            </template>
          </el-row>
        </el-col>
        <el-col :span="6" class="checkGroup">
          <div class="checkColBox">
            <div class="dialogTi">
              <div>已选{{ countCol }}列</div>
              <el-link :underline="false" type="primary" @click="cleanAll" class="fontWeight"
                >清空</el-link
              >
            </div>
            <div class="scroll flex_1">
              <el-divider><span class="ft12">固定列</span></el-divider>
              <ul class="right-cont">
                <template v-for="(item, index) in customDataCopy">
                  <li
                    class="column-item"
                    v-if="item.fixed && item.show"
                    :id="index"
                    :key="index"
                    draggable="false"
                  >
                    <span class="flex" style="width: 100%" :title="item.label">
                      <svg-icon iconName="menu"></svg-icon>
                      <div class="ml5">{{ item.label }}</div>
                    </span>
                  </li>
                </template>
              </ul>
              <el-divider><span class="ft12">可拖动列</span></el-divider>
              <ul class="right-cont">
                <template v-for="(item, index) in customDataCopy">
                  <li
                    class="column-item column-item-hover"
                    :id="index"
                    v-if="!item.fixed && item.show"
                    :key="index"
                    draggable="true"
                    @dragstart="dragStart($event)"
                    @dragenter="dragEnter($event)"
                    @dragend="dragEnd($event)"
                    @mouseover="getCurId($event)"
                  >
                    <span class="item-text" style="width: 100%" :title="item.label">
                      <svg-icon iconName="menu"></svg-icon>
                      <div class="ml5">{{ item.label }}</div>
                    </span>
                    <i
                      class="el-icon-close"
                      v-if="index == curActiveCheckedIndex && !checkDisable(item)"
                      @click="deleteCol(item)"
                    ></i>
                  </li>
                </template>
              </ul>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="flex_between" slot="footer">
      <div class="flex">
        <el-checkbox v-show="showSave" v-model="is_save_list" :disabled="save_check">
          保存为常用自定义列
        </el-checkbox>
        <template v-if="is_save_list">
          <el-form ref="elform" :model="form" class="ml10">
            <el-form-item
              prop="save_list_name"
              :rules="[
                {
                  required: true,
                  message: '名称必填',
                  trigger: 'blur',
                },
              ]"
            >
              <el-input
                :readonly="save_input"
                v-model="form.save_list_name"
                maxlength="10"
                :disabled="save_check"
                show-word-limit
                autofocus
              ></el-input>
            </el-form-item>
          </el-form>
        </template>
      </div>
      <div>
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="changeCol" :disabled="submitDisabled"> 应用 </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
  export default {
    props: {
      showSave: {
        type: Boolean,
        default: true,
      },
      customData: {
        require: true,
        type: Array,
        default: () => [],
      },
      reactMethod: {
        //联动方法
        type: Function,
      },
      //2层  对于添加列分组和目录定制顺序
      nameMapper: {
        type: Array,
        default: () => {
          return [
            {
              name: '账户设置',
              children: [
                {
                  name: '账户设置',
                  id: 'CL-ACT-SET', //如果有目录必传
                },
              ],
            },
            {
              name: '广告计划设置',
              children: [
                {
                  name: '广告计划设置',
                  id: 'CL-ADPL-SET',
                },
              ],
            },
            {
              name: '展现数据',
              children: [
                {
                  name: '展现数据',
                  id: 'CL-DIS-DATA',
                },
              ],
            },
            {
              name: '转化数据',
              children: [
                {
                  name: '转化数据',
                  id: 'CL-CV-DATA',
                },
              ],
            },
          ];
        },
      },
    },
    created() {
      this.$emit('configLocal', 'init', JSON.stringify(this.customData));
    },
    data() {
      return {
        is_save_list: false,
        save_check: false,
        save_input: false,
        submitDisabled: false,
        form: {
          save_list_name: '',
        },
        columnCol: [],
        customDataCopy: [],
        columnColFilter: [],
        searchKeyword: '',
        dialogDiyColumnVisible: false,
        accountArray: [
          'ad_account',
          'ad_account_name',
          'optimizer_id',
          'optimizer_name',
          'designated_sale_id',
          'designated_sale_name',
        ],
        cur_index: '',
        end_index: '',
        curActiveCheckedIndex: '',
        type: '',
        local: null,
      };
    },
    watch: {
      searchKeyword: {
        handler(newVal, oldVal) {
          if (newVal.replace(/^\s*|\s*$/g, '')) this.debounce(this.filterColumnCol, 200);
        },
      },
    },
    computed: {
      isSearchKeyword() {
        return this.searchKeyword.replace(/^\s*|\s*$/g, '');
      },
      countCol() {
        return this.customDataCopy.filter((v) => v.show == true).length;
      },
    },
    methods: {
      debounce(fn, wait) {
        if (this.timer !== null) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(fn, wait);
      },
      filterColumnCol() {
        let res = this.customDataCopy.filter((v) => v.label.includes(this.searchKeyword));
        //分组模式
        let back = JSON.parse(JSON.stringify(this.nameMapper));
        res.forEach((v) => {
          if (!v.groupLevel) throw new Error(`${v.label}'groupLevel' is Required`);
          let groupLevel = v.groupLevel;
          let ft = Number(groupLevel.split('.')[0]) - 1;
          let sd = Number(groupLevel.split('.')[1]) - 1;
          //初始化
          if (back[ft].children[sd].children) {
            back[ft].children[sd].children.push(v);
          } else {
            back[ft].children[sd].children = [v];
          }
        });
        //去掉back中第二层没有children的大组
        back = back.filter((v, index) => {
          back[index].children = v.children.filter((k) => k.children && k.children.length);
          return v.children && v.children.length;
        });
        //申明全选、半选状态
        back.forEach((v) => {
          v.children.forEach((k) => {
            this.asyncAllCheckStatus(k);
          });
        });
        this.columnColFilter = back;
      },
      checkedAll(data) {
        if (data.children.some((v) => this.checkDisable(v))) {
          data.isIndeterminate = !data.isCheckAll;
          data.children.forEach((v) => {
            const disabled = this.checkDisable(v);
            !disabled && (v.show = data.isCheckAll);
          });
        } else {
          data.isIndeterminate = false;
          data.children.forEach((v) => (v.show = data.isCheckAll));
        }
      },
      cancel() {
        this.dialogDiyColumnVisible = false;
      },
      changeLocation(cur, end) {
        const temp = this.customDataCopy[cur];
        this.removeItem(this.customDataCopy, temp);
        this.customDataCopy.splice(end, 0, temp);
      },
      removeItem(arr, item) {
        const index = arr.findIndex((_item) => _item === item);
        if (index < 0) return;
        arr.splice(index, 1);
      },
      getCurId(e) {
        this.curActiveCheckedIndex = e.currentTarget.id;
      },
      dragStart(e) {
        this.cur_index = e.currentTarget.id;
      },
      dragEnter(e) {
        this.end_index = e.currentTarget.id;
      },
      dragEnd(e) {
        if (this.cur_index == this.end_index) return;
        this.changeLocation(this.cur_index, this.end_index);
      },
      changeCol() {
        if (this.type == 'custom') {
          if (this.is_save_list) {
            this.$refs.elform.validate((vaild) => {
              if (vaild) {
                this.sendData();
                this.dialogDiyColumnVisible = false;
              }
            });
          } else {
            this.$emit('cloumChange', JSON.parse(JSON.stringify(this.customDataCopy)));
            this.dialogDiyColumnVisible = false;
          }
        } else if (this.type == 'edit') {
          this.$refs.elform.validate((vaild) => {
            if (vaild) {
              this.sendData();
              this.dialogDiyColumnVisible = false;
            }
          });
        }
      },
      openDia(type = 'custom', data, old_name) {
        //先拷贝一份data
        //基本数据:customDataCopy
        this.customDataCopy = JSON.parse(JSON.stringify(this.customData));
        this.type = type;
        //打开重置参数
        this.submitDisabled = false;
        this.searchKeyword = '';
        this.is_save_list = false;
        this.save_check = false;
        this.form.save_list_name = '';
        if (data) {
          this.customDataCopy.forEach((v) => {
            //不确定考不考虑操作和fixed列
            if (data.includes(v.prop)) {
              v.show = true;
            } else {
              v.show = false;
            }
          });
          if (type == 'checked') {
            this.$emit('cloumChange', JSON.parse(JSON.stringify(this.customDataCopy)));
          } else if (type == 'edit') {
            this.init();
            this.form.save_list_name = old_name;
            this.is_save_list = true;
            this.save_check = true;
            this.dialogDiyColumnVisible = true;
          }
        } else {
          this.init();
          this.dialogDiyColumnVisible = true;
        }
      },
      init() {
        //重置
        this.columnCol = JSON.parse(JSON.stringify(this.nameMapper));
        //分组
        //分组形式:columnCol
        this.customDataCopy.forEach((v) => {
          if (!v.groupLevel) throw new Error(`${v.label}'groupLevel' is Required`);
          let groupLevel = v.groupLevel;
          let ft = Number(groupLevel.split('.')[0]) - 1;
          let sd = Number(groupLevel.split('.')[1]) - 1;
          //初始化
          if (this.columnCol[ft].children[sd].children) {
            this.columnCol[ft].children[sd].children.push(v);
          } else {
            this.columnCol[ft].children[sd].children = [v];
          }
        });
        //申明全选、半选状态
        this.columnCol.forEach((v) => {
          v.children.forEach((k) => {
            this.asyncAllCheckStatus(k);
          });
        });
      },
      sendData() {
        this.submitDisabled = true;
        this.$emit(
          'configLocal',
          this.type,
          JSON.stringify(this.customDataCopy),
          this.form.save_list_name,
        );
        this.$notify({
          message: '应用成功',
          type: 'success',
        });
      },
      selectionChange(fath, child) {
        //处理单个联动事件
        if (this.reactMethod) {
          this.reactMethod(this.customDataCopy, child);
        }
        //更新全选状态
        this.asyncAllCheckStatus(fath);
      },
      asyncAllCheckStatus(data) {
        if (data.children.every((item) => item.show == true)) {
          data.isCheckAll = true;
          data.isIndeterminate = false;
        } else if (data.children.every((item) => item.show == false)) {
          data.isCheckAll = false;
          data.isIndeterminate = false;
        } else {
          data.isCheckAll = false;
          data.isIndeterminate = true;
        }
      },
      deleteCol(item) {
        item.show = false;
      },
      cleanAll() {
        this.customDataCopy.forEach((v) => {
          const disabled = this.checkDisable(v);
          !disabled && this.$set(v, 'show', false);
        });
        if (this.searchKeyword.replace(/^\s*|\s*$/g, '')) {
          this.columnColFilter.forEach((v) => {
            v.children.forEach((k) => {
              this.asyncAllCheckStatus(k);
            });
          });
        }
        this.columnCol.forEach((v) => {
          v.children.forEach((k) => {
            this.asyncAllCheckStatus(k);
          });
        });
      },
      toId(item) {
        if (!item.id) return;
        this.$el.querySelector(`#${item.id}`).scrollIntoView({
          behavior: 'smooth', // 平滑过渡
          block: 'start', // 上边框与视窗顶部平齐。默认值
        });
      },
      checkDisable(item) {
        return !!item.fixed || item.prop == 'operate' || item.disabled;
      },
    },
  };
</script>
<style lang="scss" scoped>
  ::v-deep .el-dialog {
    width: 1000px;
  }
  .set-cloum-dia {
    .pad10 {
      padding: 0 10px 10px;
    }
    .check-lable {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      border-top: 1px solid #e0e0e0;
      line-height: 30px;
      background-color: #f5f5f5;
      border-radius: 5px;
      padding-left: 10px;
      // &:first-child {
      //   padding: 0;
      //   margin-top: 0;
      //   border: none;
      // }
    }
    .flex {
      display: flex;
      align-items: center;
    }
    .column-item {
      color: #333;
      font-size: 14px;
      height: 32px;
      line-height: 32px;
      padding: 0 25px 0 10px;
      margin: 0 5px 8px;
      box-sizing: border-box;
      background-color: #fafafa;
      border-radius: 5px;
      position: relative;
      .item-text {
        display: flex;
        align-items: center;
        cursor: move;
        max-width: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .el-icon-close {
        position: absolute;
        right: 10px;
        top: 10px;
        cursor: pointer;
        border-radius: 50%;
        transition: all 0.3s;
        &:hover {
          color: #fff;
          transform: rotate(180deg);
        }
      }
    }
    .column-item-hover {
      &:hover {
        background: var(--theme-default);
        color: #fff;
      }
    }
    .checkBox {
      width: 400px;
      height: 500px;
    }
    .checkColBox {
      height: 500px;
      display: flex;
      flex-direction: column;
    }
    .scroll {
      overflow-y: auto;
      overflow-x: hidden;
      border: 1px solid #e0e0e0;
      border-top: none;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }
    .flex_1 {
      flex: 1;
    }
    .searchContent {
      height: calc(100% - 48px);
      border: 1px solid #e0e0e0;
      border-top: none;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }
    .dialogTi {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e0e0e0;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      font-size: 14px;
      line-height: 30px;
      background-color: #f9fafd;
      padding: 8px 12px;
      color: #000;
      font-weight: bold;
      .wid50 {
        width: 30%;
        transition: all 0.3s;
        &:hover {
          width: 40%;
        }
      }
    }

    .checkGroup1 {
      position: relative;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      padding-top: 10px;
      .el-checkbox {
        margin-right: 10px;
        ::v-deep .el-checkbox__label {
          vertical-align: top;
          // width: 130px;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
    .OptionS {
      margin: 0 10px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      .el-checkbox {
        width: 45%;
        margin-bottom: 10px;
      }
    }
    .IconS {
      line-height: 28px;
    }
    .IconHover:hover {
      cursor: pointer;
    }
    ::v-deep .el-scrollbar__bar.is-horizontal {
      display: none;
    }
    .cardTitle {
      height: 36px;
      line-height: 36px;
      font-size: 16px;
      font-weight: bolder;
    }
    .el-pager li {
      background: white;
      color: #666666;
    }
    ::v-deep .el-tabs__item {
      font-size: 16px;
    }
    ::v-deep element.style {
      width: 90px;
    }
    .cardFlex {
      display: flex;
      flex-wrap: no-wrap;
      justify-content: space-between;
    }
    .chartCard {
      flex: 1;
    }
    ::v-deep .el-tabs__content {
      overflow: visible;
    }
    ::v-deep .el-card {
      overflow: visible;
    }
    .ft12 {
      font-size: 12px;
      color: #999;
    }
    .ml5 {
      margin-left: 5px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .flex_between {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mb22 {
      margin-bottom: 22px;
    }
    .mt10 {
      margin-top: 15px;
    }
  }
  .el-divider--horizontal {
    margin: 12px 0;
    .el-divider__text {
      padding: 0;
    }
  }
  .fontWeight {
    font-weight: bold;
  }
  ::v-deep .el-dialog__title {
    font-weight: bolder;
  }
  ::v-deep .el-dialog__body {
    padding: 20px 20px;
  }
  .groupTitle {
    margin-bottom: 10px;
    font-weight: bolder;
    color: #333;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .categoryContainer {
    padding: 10px 10px 0;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    border-right: 1px solid #e0e0e0;
    .categoryTitle {
      font-weight: bold;
      color: #333;
      padding-bottom: 10px;
    }
    .categoryContent {
      padding-left: 10px;
      margin-bottom: 10px;
    }
  }
  .noData {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    .icon-meiyoushuju {
      font-size: 60px;
    }
  }
  .ml10 {
    margin-left: 10px;
  }

  ::v-deep .el-dialog__body {
    border-top: 1px solid #e8e8e8;
    border-bottom: 1px solid #e8e8e8;
  }
</style>
