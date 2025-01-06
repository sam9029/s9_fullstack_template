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
          <el-select v-model="innerForm.advertiser_type" clearable>
            <el-option
              v-for="item in adversiterOptions"
              :key="item.value"
              v-bind="item"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="活动主题" prop="activityTheme">
          <el-input v-model.lazy.trim="innerForm.activityTheme"></el-input>
        </el-form-item>
        <el-form-item label="活动周期" prop="activityCycle">
          <el-date-picker
            v-model="innerForm.activityCycle"
            type="daterange"
            value-format="yyyy-MM-dd"
            format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="活动详情" prop="describe">
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
          activityTheme: null,
          activityCycle: [],
          describe: '',
        },
        innerRules: {
          advertiser_type: [{ required: true, message: '请选择项目产品', trigger: 'change' }],
          activityTheme: [{ required: true, message: '请输入活动主题', trigger: 'blur' }],
          activityCycle: [{ required: true, message: '请选择活动周期', trigger: 'change' }],
          describe: [{ required: true, message: '请输入活动详情', trigger: ['change', 'blur'] }],
        },
        // 激励政策
        previewMapper: {
          advertiser_type: '推广项目',
          activityTheme: '活动主题',
          activityCycle: '活动周期',
          // describe: '活动详情',
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
            } else if (key == 'activityCycle') {
              if (n[key]?.length > 0) {
                let start = moment(n[key][0]).format('YYYY年MM月DD日');
                let end = moment(n[key][1]).format('YYYY年MM月DD日');
                tempItem.value = start + '-' + end;
              } else {
                tempItem.value = '';
              }
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
      //#region 数据处理
      /**
       * 动态 组件 下 渲染的form 表单 的验证函数---同时 满足验证的时候 返回所有的 form字段数据
       * @return {Boolean}
       */
      handleInnerFormValid(_innerParams) {
        let flag = true;

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
        this.innerForm = _data.message;
        this.previewContent = _data.show_message;
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
    created() {},
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
</style>
