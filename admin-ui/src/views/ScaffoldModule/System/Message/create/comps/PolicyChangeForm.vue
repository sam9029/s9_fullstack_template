<template>
  <div class="create-wrapper flex">
    <div class="left-wrapper create-wrapper-item">
      <el-form
        :label-width="labelWidth + 'px'"
        ref="innerForm"
        :model="innerForm"
        :rules="innerRules"
      >
        <el-form-item label="政策类目" prop="policy_category">
          <el-select v-model="innerForm.policy_category" clearable>
            <el-option
              v-for="item in policyCategoryOpts"
              :key="item.value"
              v-bind="item"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="变更内容" prop="change_content">
          <el-input v-model.lazy.trim="innerForm.change_content"> </el-input>
        </el-form-item>
        <el-form-item label="生效日期" prop="effectuate_date">
          <el-date-picker
            v-model="innerForm.effectuate_date"
            type="date"
            placeholder="请选择上线时间"
            value-format="yyyy-MM-dd"
            format="yyyy-MM-dd"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="详细说明" prop="describe">
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
  import { mapperToOptions } from '@/utils/tools.js';
  import { SETTLE_MAPPER, SETTLEMENTCOLUMNS } from './config.js';
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
  import { registerMenu, editorUpload } from './config.js';
  import BaseTable from '@/components/BaseTable/index.vue';
  import MessagePreviewCard from './MessageCard.vue';
  import { POLICY_TYPE_MAPPER } from '@/utils/mapper';

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
        policyCategoryOpts: mapperToOptions(POLICY_TYPE_MAPPER),
        innerForm: {
          policy_category: null,
          change_content: null,
          effectuate_date: null,
          describe: '',
        },
        innerRules: {
          policy_category: [{ required: true, message: '请选择政策类目', trigger: 'change' }],
          change_content: [{ required: true, message: '请选择变更内容', trigger: 'blur' }],
          effectuate_date: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
          describe: [{ required: true, message: '请输入详细说明', trigger: ['change', 'blur'] }],
        },
        // 政策变更
        previewMapper: {
          policy_category: '政策类目',
          change_content: '变更内容',
          effectuate_date: '生效日期',
          // describe: '详细说明',
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
            } else if (key == 'policy_category') {
              tempItem.value = POLICY_TYPE_MAPPER[n[key]];
            } else if (key == 'effectuate_date') {
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
      //#region 数据处理
      /**
       * 动态 组件 下 渲染的form 表单 的验证函数---同时 满足验证的时候 返回所有的 form字段数据
       * @return {Boolean}
       */
      handleInnerFormValid(_innerParams) {
        let flag = true;

        this.$refs.innerForm.validate((valid) => {
          // 验证失败

          flag = valid;
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

      //#region API

      //#endregion

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
      this.innerForm.effectuate_date = moment().format('YYYY-MM-DD');
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
</style>
