<!-- 
  使用 记得加 .sync
  <RichText :value.sync="form.describe"></RichText>
 -->

 <template>
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
      :style="{ height: height }"
      v-model="curValue"
      @input="$emit('input', $event)"
      :defaultConfig="$data._editorConfig"
      mode="default"
      @onCreated="onCreated"
    />

    <Preview :show.sync="preShow" :describe="describe"></Preview>
  </div>
</template>

<script>
  // COMPONENTS
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
  import Preview from './Preview.vue';

  // KIT
  import { MessageBox } from 'element-ui';
  import { registerMenu, editorUpload } from './data';

  export default {
    components: {
      Editor,
      Toolbar,
      Preview,
    },

    props: {
      value: {
        type: String,
        default: '',
      },
      height: {
        type: String,
        default: '420px',
      },
    },

    data() {
      return {
        curValue: this.value,
        preShow: false,
        describe: '',
        editor: null,
        _toolbarConfig: {
          modalAppendToBody: true, // 将菜单弹出的 modal 添加到 body 下
          insertKeys: {
            index: 999, // 插入的位置，基于当前的 toolbarKeys
            keys: ['preview'], // menu1Conf 定义的 key name
          },
          excludeKeys: ['blockquote', 'todo', 'codeBlock', 'fullScreen'], // 排除按钮
        },
        _editorConfig: {
          placeholder: '请输入内容...',
          autoFocus: false,
          MENU_CONF: {
            uploadImage: {
              // customUpload 自定义-上传配置
              customUpload(file, insertFn) {
                return editorUpload(file)
                  .then((data) => {
                    return insertFn(data.url); //插入数据回调
                  })
                  .catch((err) => {
                    MessageBox.alert(err.message || err || '上传失败', { type: 'error' });
                  });
              },
            },
            uploadVideo: {
              // customUpload 自定义-上传配置
              customUpload(file, insertFn) {
                return editorUpload(file)
                  .then((data) => {
                    return insertFn(
                      data.url, // 视频地址链接
                      data.url + '?x-oss-process=video/snapshot,t_1000,f_jpg,m_fast', // 截图封面
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
      value(newVal, oldVal) {
        // 只有当新的 value 不等于 curValue 时才更新，避免死循环
        if (newVal !== this.curValue) {
          this.curValue = newVal;
        }
      },
      curValue(newVal, oldVal) {
        // 只有当新的 curValue 不等于 value 时才 emit，避免死循环
        if (newVal !== this.value) {
          this.handleUpdate(newVal);
        }
      },
    },

    beforeCreate() {
      registerMenu();
    },

    beforeDestroy() {
      const editor = this.editor;
      if (editor == null) return;
      editor.off('modalOrPanelShow', this.onModalShow); // 手动销毁挂载的自定义事件
      editor.off('preview', this.preview); // 手动销毁挂载的自定义事件
      editor.destroy(); // 组件销毁时，及时销毁编辑器
    },

    methods: {
      onCreated(editor) {
        this.editor = Object.seal(editor);
        editor.on('modalOrPanelShow', this.onModalShow); // 挂载modal弹出事件（modalOrPanelShow 是 wangeditor内置事件）
        editor.on('preview', this.preview); // 挂载预览按钮事件（preview 是 注册的自定义事件）
      },

      onModalShow(modalOrPanel) {
        if (modalOrPanel.type !== 'modal') return;
        const { $elem } = modalOrPanel;
        $elem[0].style.top = '200px';
        $elem[0].style.right = '300px';
        $elem[0].style.left = 'unset';
      },

      preview() {
        this.preShow = true;
        this.describe = this.curValue;
      },

      // 手动设置数据
      handleSet(_val) {
        if (_val && this.curValue != _val) {
          this.curValue = _val;
        }
      },

      // 更新数据
      handleUpdate(_val) {
        this.$emit('update:value', _val);
      },
    },
  };
</script>

<!-- wangeditor 样式 -->
<style src="@wangeditor/editor/dist/css/style.css"></style>
<style>
  .el-form-item.is-error .editor-wrapper {
    border-color: #f56c6c;
  }
  body .w-e-modal {
    z-index: 9999;
  }
</style>

<style lang="scss" scoped>
  .editor-wrapper {
    position: relative;
    border: 1px solid #ccc;
  }
  .editor-toolbar {
    border-bottom: 1px solid #ccc;
  }
  ::v-deep.editor-editor {
    height: 400px !important;
    overflow-y: hidden;
    a {
      color: var(--theme-default);
      cursor: pointer;
      text-decoration: underline;
    }
  }

  .preview-modal {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
