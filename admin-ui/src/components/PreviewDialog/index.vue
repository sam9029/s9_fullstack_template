<template>
  <BaseDialog
    title="预览"
    width="700px"
    append-to-body
    modal-append-to-body
    destroy-on-close
    v-on="$listeners"
    v-bind="$attrs"
    :showFooter="false"
  >
    <div class="demo-content">
      <Editor
        class="editor-editor model-content"
        :value="describe"
        :defaultConfig="defaultConfig"
        mode="default"
        @onCreated="onCreated"
      />
    </div>
  </BaseDialog>
</template>

<script>
// comps
import { Editor } from '@wangeditor/editor-for-vue';
import BaseDialog from '@/components/BaseDialog/index.vue';

export default {
  components: {
    Editor,
    BaseDialog,
  },
  props: ['describe'],
  data() {
    return {
      editor: null,
      defaultConfig: {
        readOnly: true,
      },
    };
  },
  beforeDestroy() {
    const editor = this.editor;
    if (editor == null) return;
    editor.destroy();
  },
  methods: {
    onCreated(editor) {
      this.editor = Object.seal(editor);
    },
    // open(describe) {
    //   this.describe = describe;
    //   this.visible = true;
    // },
    // close() {
    //   this.describe = '';
    //   this.visible = false;
    // }
  },
};
</script>


<style lang="scss" scoped>
.demo-content {
  background-image: url('https://koc-img.lizhibj.cn/manage/iPhone13.png');
  background-repeat: no-repeat;
  background-size: 100%;
  border-radius: 30px;
  padding: 48px 13px 25px;
  box-sizing: border-box;
  width: 360px;
  height: 729.13963px;
  overflow-y: auto;
  z-index: 10;
  zoom: 0.66;
  margin: 0 auto;
  .model-content {
    box-sizing: border-box;
    z-index: 1;
    height: 100%;
    border-bottom-left-radius: 30px;
    border-bottom-right-radius: 30px;
    overflow-y: auto;
  }
  ::v-deep.w-e-scroll::-webkit-scrollbar {
    display: none;
  }
}
</style>