<template>
  <div class="mx-[14px] rounded overflow-hidden">
    <van-collapse v-model="activeNames">
      <van-collapse-item title="推广说明" title-class="font-bold text-black" icon="comment-o" lazy-render
        name="instruction">
        <Editor style="height: 100%; width: 100%" v-model="valueHtml" :defaultConfig="editorConfig" mode="default"
          @onCreated="handleCreated" />
      </van-collapse-item>
    </van-collapse>
  </div>
</template>
  
<script setup>
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue';
import { Editor } from '@wangeditor/editor-for-vue';

const editorConfig = { placeholder: '敬请期待...', readOnly: true };
const editorRef = shallowRef();
// 内容 HTML
const valueHtml = ref(null);
const activeNames = ref([]);
const open = (val) => {
  valueHtml.value = val;
  activeNames.value.push('instruction');
}

const getHtml = (val) => {
  valueHtml.value = val;
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const handleCreated = (editor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
};


defineExpose({ open, getHtml });
</script>
  
<style lang="scss" scoped></style>
  