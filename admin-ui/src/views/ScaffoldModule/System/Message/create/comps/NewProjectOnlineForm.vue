<template>
  <div class="create-wrapper flex">
    <div class="left-wrapper create-wrapper-item">
      <el-form
        :label-width="labelWidth + 'px'"
        ref="innerForm"
        :model="innerForm"
        :rules="innerRules"
      >
        <el-form-item label="项目产品" prop="advertiser_type">
          <el-select v-model="innerForm.advertiser_type" clearable @change="advertiserTypeChange">
            <el-option
              v-for="item in adversiterOptions"
              :key="item.value"
              v-bind="item"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="结算方式" prop="settlement_ids">
          <el-select
            v-model="innerForm.settlement_ids"
            multiple
            clearable
            @change="settlementChange"
          >
            <el-option v-for="item in settlementList" :key="item.value" v-bind="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="结算单价" prop="settlement_list">
          <BaseTable
            class="baseTable-List"
            :columns="SETTLEMENTCOLUMNS"
            :data="innerForm.settlement_list"
            :pagination="false"
            :unFullscreen="true"
            :unRefresh="true"
            :unCustom="true"
            :height="250"
            :border="true"
          >
            <template #publish="{ row }">
              <el-input
                v-model="row.publish"
                placeholder="输入"
                size="mini"
                oninput="value=value.replace(/[^0-9.]/g,'')"
              >
                <span slot="append">{{ row.suffix }}</span>
              </el-input>
            </template>
            <template #service="{ row }">
              <el-input
                v-model="row.service"
                placeholder="输入"
                size="mini"
                oninput="value=value.replace(/[^0-9.]/g,'')"
              >
                <span slot="append">{{ row.suffix }}</span>
              </el-input>
            </template>
          </BaseTable>
        </el-form-item>
        <el-form-item label="预计上线时间" prop="uptime">
          <el-date-picker
            v-model="innerForm.uptime"
            type="datetime"
            placeholder="请选择上线时间"
            value-format="yyyy-MM-dd HH:mm"
            format="yyyy-MM-dd HH:mm"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="项目介绍" prop="describe">
          <div class="editor-wrapper">
            <Toolbar
              class="editor-toolbar"
              :editor="editor"
              :defaultConfig="$data._toolbarConfig"
              mode="default"
              ref="ref"
            />
            <Editor
              class="editor-editor"
              v-model="innerForm.describe"
              :defaultConfig="$data._editorConfig"
              mode="default"
              @onCreated="onCreated"
            />
          </div>
        </el-form-item>
      </el-form>
    </div>
    <div class="right-wrapper create-wrapper-item">
      <!-- 预览 -->
      <MessagePreviewCard :subType="messageType" :content="previewContent" />
    </div>
  </div>
</template>

<script>
  // 工具
  import moment from 'moment';
  import { getMethodList } from '@/api/business/public';
  import { SETTLE_MAPPER, SETTLEMENTCOLUMNS } from './config.js';
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
  import { registerMenu, editorUpload } from './config.js';
  import BaseTable from '@/components/BaseTable/index.vue';
  import MessagePreviewCard from './MessageCard.vue';

  export default {
    components: {
      Editor,
      Toolbar,
      BaseTable,
      MessagePreviewCard,
    },
    props: {
      adversiterOptions: {
        type: Array,
        default: () => [],
      },
      labelWidth: [String, Number],
      messageType: null,
    },
    data() {
      return {
        SETTLE_MAPPER,
        SETTLEMENTCOLUMNS,
        settlementList: [],
        innerForm: {
          advertiser_type: null,
          settlement_ids: null,
          settlement_list: [],
          uptime: null,
          describe: '',
        },
        innerRules: {
          advertiser_type: [{ required: true, message: '请选择项目产品', trigger: 'change' }],
          settlement_ids: [{ required: true, message: '请选择结算方式', trigger: 'change' }],
          settlement_list: [{ required: true, message: '请选择结算单价', trigger: 'change' }],
          uptime: [{ required: true, message: '请选择预计上线时间', trigger: 'change' }],
          describe: [{ required: true, message: '请输入项目介绍', trigger: ['change', 'blur'] }],
        },
        // 新项目上线通知
        previewMapper: {
          advertiser_type: '上新项目',
          settlement_ids: '结算方式',
          uptime: '预计上线时间',
          // settlement_list: '结算单价',
          // describe: '项目介绍',
        },
        previewContent: [],
        // 富文本
        editor: null,
        _toolbarConfig: {
          modalAppendToBody: true,
          //   insertKeys: {
          //     index: 999,
          //     keys: ['preview'],
          //   },
          excludeKeys: ['blockquote', 'todo', 'codeBlock', 'fullScreen'],
        },
        _editorConfig: {
          placeholder: '请输入内容...',
          autoFocus: false,
          MENU_CONF: {
            uploadImage: {
              customUpload(file, insertFn) {
                return editorUpload(file)
                  .then((data) => {
                    return insertFn(data.url);
                  })
                  .catch((err) => {
                    MessageBox.alert(err.message || err || '上传失败', { type: 'error' });
                  });
              },
            },
            uploadVideo: {
              customUpload(file, insertFn) {
                return editorUpload(file)
                  .then((data) => {
                    return insertFn(
                      data.url,
                      data.url + '?x-oss-process=video/snapshot,t_1000,f_jpg,m_fast',
                    );
                  })
                  .catch((err) => {
                    MessageBox.alert(err.message || err || '上传失败', { type: 'error' });
                  });
              },
            },
          },
        },
      };
    },
    watch: {
      innerForm: {
        handler(n, o) {
          let temp = [];
          Object.keys(n).forEach((key) => {
            // 筛选展示 字段 （没有就跳出本次循环）
            if (!this.previewMapper[key]) return;

            let tempItem = {
              label: this.previewMapper[key],
              prop: key,
              value: null,
            };

            if (key == 'advertiser_type') {
              tempItem.value = this.adversiterOptions.filter((it) => it.value == n[key])[0]?.label;
            } else if (key == 'settlement_ids') {
              let str = '';
              if (n[key] && n[key].length) {
                n[key].forEach((it, index) => {
                  this.settlementList.forEach((subit) => {
                    if (it == subit.value) {
                      if (index) {
                        str += `/${subit.label}`;
                      } else {
                        str += `${subit.label}`;
                      }
                    }
                  });
                });
              }
              tempItem.value = str;
            } else if (key == 'uptime') {
              if (n[key]) tempItem.value = moment(n[key]).format('YYYY年MM月DD日');
              else tempItem.value = '';
            } else {
              tempItem.value = n[key];
            }

            temp.push(tempItem);
          });
          this.previewContent = temp;
        },
        deep: true,
        immediate: true,
      },
    },
    methods: {
      resetInnerForm() {
        this.innerForm = this.$options.data().innerForm;
        this.settlementList = [];
      },
      //#region 数据处理
      /**
       * 动态 组件 下 渲染的form 表单 的验证函数---同时 满足验证的时候 返回所有的 form字段数据
       * @return {Boolean}
       */
      handleInnerFormValid(_innerParams) {
        let flag = true;

        this.validateField('settlement_list');
        this.$refs.innerForm.validate((valid) => {
          // 验证失败
          if (!valid) {
            flag = false;
          }
        });

        return flag;
      },
      /**
       * 返回当前的 innrform 字段
       * @return {Object}
       *
       */
      getInnerFormParams() {
        if (this.handleInnerFormValid()) {
          return {
            message: this.innerForm,
            show_message: this.previewContent,
          };
        } else {
          return null;
        }
      },
      /**
       * 父组件调用 设置编辑数据回显
       * @param {*} _data
       */
      setEditData(_data) {
        this.advertiserTypeChange(_data.message.advertiser_type);
        this.innerForm = _data.message;
        this.previewContent = _data.show_message;
      },

      // 获取 结算方式的 列表
      getSettlementList(val) {
        getMethodList({ ids: val }).then((res) => {
          if (res.code == 0) {
            this.settlementList = res.data;
            if (val) this.settlementChange(this.innerForm.settlement_ids);
          }
        });
      },
      // 结算方式的改变
      settlementChange(val) {
        val.forEach((t) => {
          let item = this.innerForm.settlement_list.find((k) => k.settlement_id == t);
          if (!item) {
            let obj = this.settlementList.find((k) => k.value == t);
            this.innerForm.settlement_list.push({
              settlement_id: obj.value,
              name: obj.label,
              service: null,
              publish: null,
              suffix: obj.suffix || '元',
            });
          }
        });
        for (let i = this.innerForm.settlement_list.length - 1; i >= 0; i--) {
          let item = this.innerForm.settlement_list[i];
          if (!val.includes(item.settlement_id)) this.innerForm.settlement_list.splice(i, 1);
        }
        this.validateField('settlement_list');
      },
      validateField(field) {
        this.$refs['innerForm'].validateField(field);
      },
      // 产品改变
      advertiserTypeChange(val) {
        let item = this.adversiterOptions.find((t) => t.value == val);
        if (!item) return this.resetInnerForm();
        // this.innerForm.promotion_type = item.promotion_type;
        this.innerForm.settlement_ids = item.settlement_ids;
        this.innerForm.settlement_list = [];
        this.getSettlementList(item.settlement_ids);
      },

      // 富文本
      onCreated(editor) {
        this.editor = Object.seal(editor);
        editor.on('modalOrPanelShow', this.onModalShow);
        // editor.on('preview', this.preview);
      },
      onModalShow(modalOrPanel) {
        if (modalOrPanel.type !== 'modal') return;
        const { $elem } = modalOrPanel;
        $elem[0].style.top = '200px';
        $elem[0].style.right = '300px';
        $elem[0].style.left = 'unset';
      },
    },
    created() {
      //init
      this.innerForm.uptime = moment().format('YYYY-MM-DD HH:MM');
    },
    beforeCreate() {
      registerMenu();
    },
    beforeDestroy() {
      const editor = this.editor;
      if (editor == null) return;
      editor.off('modalOrPanelShow', this.onModalShow);
      //   editor.off('preview', this.preview);
      editor.destroy();
    },
  };
</script>

<style lang="scss" scoped>
  .create-wrapper {
    // display: flex;
    justify-content: space-between;

    .create-wrapper-item {
      flex: 1 auto;
    }
    .left-wrapper {
      padding-top: 55px;
    }
    .right-wrapper {
      max-width: 555px !important;
    }
  }

  .editor-wrapper {
    border: 1px solid #ccc;
  }
  .editor-toolbar {
    border-bottom: 1px solid #ccc;
  }
  .editor-editor {
    height: 300px;
    overflow-y: hidden;
  }

  .baseTable-List,
  .editor-wrapper {
    width: 500px;
  }

  .baseTable-List {
    ::v-deep .el-input {
      width: unset;
    }
  }
</style>
