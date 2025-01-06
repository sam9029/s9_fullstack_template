<template>
  <div class="table-transfer">
    <span class="note text-danger">最后数据顺序为字段添加顺序</span>
    <div class="transfer-container">
      <div
        class="left-table"
        :class="{
          disabled: field === 'PublishTansfer' || (status === 1 && field === 'ContentTansfer'),
        }"
      >
        <div class="left-header">
          <div class="info">
            <span class="top-note">未选字段</span>
            <span class="length-num">
              {{ `${leftSelect.length}/${leftTable.length}` }}
            </span>
          </div>
          <!-- <el-button type="text" @click="resetLeft" :disabled="status === 1 ? true : false"
          >清空</el-button
        > -->
        </div>
        <el-table
          ref="leftTableRef"
          :data="leftTable"
          height="300"
          border
          stripe
          @selection-change="handleLeftSelection"
        >
          <el-table-column type="selection" width="55" :selectable="() => status !== 1"></el-table-column>
          <el-table-column label="是否必选">
            <template slot-scope="{ row }">
              <el-switch v-model="row.required" :disabled="status === 1 ? true : false"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="字段名" prop="label"></el-table-column>
          <el-table-column width="100" label="字段属性">
            <template slot-scope="{ row }">
              <span>{{ COMP_TYPE_MAPPER[row.comp_type] }}</span>
            </template>
          </el-table-column>
          <el-table-column width="220" label="备注/选项">
            <template slot-scope="{ row, $index }">
              <el-input
                v-if="row.show && row.comp_type === 1"
                v-model.trim="row.remark"
                placeholder="请输入"
                :disabled="status === 1 ? true : false"
              ></el-input>

              <el-select
                v-else-if="row.show && row.comp_type === 2"
                :allow-create="row.configurable === 1 ? true : false"
                :filterable="row.configurable === 1 ? true : false"
                :default-first-option="row.configurable === 1 ? true : false"
                v-model="row.dict_ids"
                multiple
                placeholder="请选择"
                :disabled="status === 1 ? true : false"
                clearable
                @change="addSelect($event, row)"
              >
                <el-option
                  v-for="item in row.dicts"
                  :key="item"
                  :value="item.id"
                  :label="item.label"
                ></el-option>
              </el-select>

              <span v-else>——</span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot-scope="{ row, $index }">
              <div v-if="row.comp_type === 1" class="remark">
                <el-button
                  type="text"
                  @click="addConfig(row, $index)"
                  :disabled="status === 1 ? true : false"
                  >添加备注</el-button
                >
              </div>
              <div v-if="row.comp_type === 2" class="options">
                <el-button
                  type="text"
                  @click="addConfig(row, $index)"
                  :disabled="status === 1 ? true : false"
                  >新增选项</el-button
                >
              </div>
              <span v-if="row.comp_type === 3">——</span>
              <span v-if="row.comp_type === 4">——</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div
        class="btn"
        :class="{
          disabled: status === 1 && (field === 'ContentTansfer' || field === 'PublishTansfer'),
        }"
      >
        <div class="btn-add">
          <el-button
            type="primary"
            size="mini"
            @click="add"
            :disabled="leftSelect.length > 0 ? false : true"
            >添加 ></el-button
          >
        </div>
        <div class="btn-del">
          <el-button
            type="primary"
            size="mini"
            @click="del"
            :disabled="rightLength > 0 ? false : true"
            >移除 &lt</el-button
          >
        </div>
      </div>
      <div
        class="right-table"
        :class="{
          disabled: field === 'PublishTansfer' || (status === 1 && field === 'ContentTansfer'),
        }"
      >
        <div class="right-header">
          <div class="info">
            <span class="top-note">已选字段</span>
            <span class="length-num">
              {{ `${rightSelect.length}/${rightTable.length}` }}
            </span>
          </div>
          <el-button
            v-if="rightTable.length !== 0"
            type="text"
            @click="resetRight"
            :disabled="status === 1 ? true : false || field === 'PublishTansfer'"
            >清空</el-button
          >
        </div>
        <el-table
          :data="rightTable"
          height="300"
          border
          stripe
          @selection-change="handleRightSelection"
        >
          <el-table-column type="selection" width="55" :selectable="() => field !== 'PublishTansfer' && this.status !== 1"></el-table-column>
          <el-table-column width="100" label="是否必选">
            <template slot-scope="{ row }">
              <span>{{ row.required ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column width="100" label="字段名" prop="label"></el-table-column>
          <el-table-column label="备注/选项">
            <template slot-scope="{ row }">
              <div v-if="row.comp_type === 1">
                <el-popover
                  v-if="row.remark"
                  :title="row.label"
                  :content="row.remark"
                  :disabled="status === 1 ? true : false"
                >
                  <el-button slot="reference" type="text">查看</el-button>
                </el-popover>
                <span v-else>——</span>
              </div>

              <div v-else-if="row.comp_type === 2">
                <el-select
                  v-if="row.dict_ids"
                  v-model="row.dict_ids"
                  multiple
                  :disabled="status === 1 ? true : false"
                >
                  <el-option
                    v-for="item in row.dicts.filter((el) =>
                      row.dict_ids.some((item) => el.id == item),
                    )"
                    :key="item"
                    :value="item.id"
                    :label="item.label"
                  ></el-option>
                </el-select>
                <span v-else>全部</span>
              </div>

              <span v-else>——</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
  /**
   * @description: comp_type = 3时 不给el-select/el-input
   * @description: comp_type = 2时 el-select需要循环接口中dicts数组
   * @description: configurable = 1时 可以自定义新增options选项
   * @description: isEdit用来判断是否是编辑操作，从而展示表格右侧数据
   * @description: remoteOpts是所有需要从接口获取的下拉list
   * @return {*}
   */
  import { COMP_TYPE_MAPPER } from '@/utils/mappers/keywordConfig.js';
  import { configDictAdd } from '@/api/popularize/projectConfig/index.js';
  import { cloneDeep } from 'lodash';
  export default {
    props: {
      field: {
        type: String,
        default: '',
      },
      isEdit: {
        type: Boolean,
        default: false,
      },
      remoteOpts: {
        type: Object,
        default: () => {},
      },
      status: {
        type: Number,
        default: 2, // 1:正常 2; 停用 3:删除
      },
    },
    data() {
      return {
        originData: [],
        leftTable: [],
        rightTable: [],
        leftSelect: [],
        rightSelect: [],
        inputValue: [],
        selectValue: [],
        COMP_TYPE_MAPPER,
        leftRemoteSelect: {},
        rightLength: null,
        isEdit: false,
        leftLoading: true,
        rightLoading: true,
        originConfigData: [],
      };
    },
    watch: {
      // 默认发布回填全选并不允许编辑
      field: {
        handler(newVal) {
          if(newVal === 'PublishTansfer') {
            setTimeout(() => {
              this.$refs.leftTableRef.toggleAllSelection()
            }, 500)
          }
        },
        immediate: true
      }
    },
    methods: {
      // 打开
      open(data, type, originData) {
        // 初始数据赋值注意深拷贝
        this.originConfigData = cloneDeep(originData);
        if (type == 'create') {
          this.leftTable = data;
        } else {
          this.rightTable = data;
          // 编辑时，如果没有右侧数据则显示左侧初始数据
          if (data.length === 0) {
            this.leftTable = this.originConfigData;
          } else if (data.length !== this.originConfigData.length) {
            this.leftTable = this.originConfigData.filter((el) =>
              data.every((item) => item.prop_id !== el.prop_id),
            );
          }
        }
      },

      // 获取移除select下拉
      getDelSelect(prop_id) {
        let obj = this.originConfigData.filter((el) => el.prop_id == prop_id)[0];
        return obj.dicts;
      },

      // 将选中的元素从源数组中移除，并添加到目标数组中
      moveItems(type, sourceArray, destinationArray, selectedItems) {
        for (let item of selectedItems) {
          const index = sourceArray.indexOf(item);
          if (index !== -1) {
            sourceArray.splice(index, 1);
            if (type === 'del') {
              let obj = { ...item, show: true, dicts: this.getDelSelect(item.prop_id) };
              destinationArray.push(obj);
            } else {
              destinationArray.push(item);
            }
          }
        }
      },

      // 清除空字段
      delField() {
        this.rightTable = this.rightTable.map((el) => {
          let obj;
          if (el.dict_ids && el.dict_ids.length === 0) {
            let { dict_ids, ...opts } = el;
            obj = opts;
          } else if (!el.remark) {
            let { remark, ...opts } = el;
            obj = opts;
          } else {
            obj = el;
          }
          return obj;
        });
      },

      // 添加
      add() {
        if (this.leftSelect.length > 0) {
          this.moveItems('add', this.leftTable, this.rightTable, this.leftSelect);
          this.delField();
          this.$emit('rightTable', this.rightTable); // 同步新增params数据
        }
      },

      // 移除
      del() {
        if (this.rightSelect.length > 0) {
          this.moveItems('del', this.rightTable, this.leftTable, this.rightSelect);
          this.$emit('rightTable', this.rightTable); // 同步编辑params数据
        }
      },

      addConfig(row, index) {
        this.leftTable.forEach((i, j) => {
          if (index == j) {
            i['show'] = true;
          }
        });
      },

      // 选中左边table
      handleLeftSelection(val) {
        this.leftSelect = val;
        // 只有新增时发布回填默认全选并不允编辑
        if(this.field == 'PublishTansfer' && !this.isEdit) {
          this.add()
        }
      },

      // 选中右边table
      handleRightSelection(val) {
        if (val.length > 0) {
          this.rightSelect = val;
          this.rightLength = val.length;
        } else {
          this.rightLength = 0;
        }
      },

      // 清空
      reset() {
        this.leftTable = [];
        this.rightTable = [];
        this.leftSelect = [];
        this.rightSelect = [];
        this.leftRemoteSelect = Object.create(null);
        this.$refs.leftTableRef.clearSelection(); // 清空el-transfer
      },

      // 清空右侧
      resetRight() {
        this.rightTable = [];
        this.rightSelect = [];
        this.leftTable = cloneDeep(this.originConfigData);
      },

      // 清空左侧
      resetLeft() {
        this.leftTable = this.originConfigData.map((el) => {
          return {
            ...el,
            show: false,
          };
        });
      },

      handleSelectValue(str) {
        return str.split(',');
      },

      // 接口获取options时右侧显示label处理
      // chooseRemoteSelect(val, id) {
      //   let list = [];
      //   val.forEach((key) => {
      //     let { value, label } = this.remoteOpts[id].find((item) => item.value == key);
      //     list.push({ value, label });
      //   });
      //   this.leftRemoteSelect[id] = list;
      // },

      // change事件，监听自定义添加options
      addSelect(val, row) {
        if (row.configurable === 1) {
          let params = {
            prop_id: row.prop_id,
            label: val[0],
          };
          let flag = row.dicts.some((el) => el.label == val[0]);
          if (params.label && !flag && typeof params.label !== 'number') {
            this.createSelectOption(params);
          }
        }
      },

      // 新增options
      async createSelectOption(params) {
        try {
          const res = await configDictAdd(params);
          if (res && res.code === 0) {
            this.$notify.success('新增字典成功');
          }
        } catch (error) {
          this.$notify.error(error || '新增字典失败');
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  .transfer-container {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 650px 70px 450px;
    grid-gap: 10px;
    .btn {
      display: grid;
      align-content: center;
      grid-gap: 10px;
    }
    .left-header,
    .right-header {
      height: 40px;
      padding: 0 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f5f7fa;
      border-top: 1px solid #eee;
      border-left: 1px solid #eee;
      border-right: 1px solid #eee;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      .top-note {
        font-size: 16px;
      }
      .length-num {
        margin-left: 5px;
        color: #909399;
      }
    }
  }
  .disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  ::v-deep .el-date-editor.el-input,
  .el-date-editor.el-input__inner {
    width: 200px;
  }
</style>
