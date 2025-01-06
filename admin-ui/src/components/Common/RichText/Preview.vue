<template>
  <div v-show="show" ref="preview" class="preview-modal" @click.self="$emit('update:show', false)">
    <div class="el-popover el-popper el-popover--plain preview-popover">
      <div class="demo-content">
        <Editor
          class="editor-editor model-content"
          :value="describe"
          :defaultConfig="defaultConfig"
          mode="default"
          @onCreated="onCreated"
        />
      </div>

      <div class="el-dialog__headerbtn close-btn" @click.stop="$emit('update:show', false)">
        <i class="el-dialog__close el-icon el-icon-close"></i>
      </div>
    </div>
  </div>
</template>

<script>
// comps
import { Editor } from '@wangeditor/editor-for-vue';

export default {
  components: {
    Editor,
  },
  props: ['describe', 'show'],
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
    // closeClickHandler(event) {
    //   if (!this.preShow) return;
    //   const ev = event || window.event;
    //   if (!this.$el.contains(ev.target)) {
        
    //   }
    // },
  },
};
</script>

<style lang="scss" scoped>
.preview-popover {
  position: absolute;
  // left: 50%;
  top: 50%;
  right: 10px;
  transform: translate(-50%, -50%);
  z-index: 10;
}
.demo-content {
  background-image: url('https://koc-img.lizhibj.cn/manage/iPhone13.png');
  background-repeat: round;
  background-size: 100%;
  border-radius: 8px;
  padding: 30px 12px 15px;
  box-sizing: border-box;
  width: 258px;
  height: 516px;
  overflow-y: auto;
  z-index: 10;
  .model-content {
    box-sizing: border-box;
    z-index: 1;
    height: 100%;
    border-radius: 0px 30px 0px;
    overflow-y: auto;
    background: transparent;
  }
  ::v-deep.w-e-scroll::-webkit-scrollbar {
    display: none;
  }
}
.close-btn {
  right: 10px;
  top: 10px;
}
</style>