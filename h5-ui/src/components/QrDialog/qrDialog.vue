<template>
  <van-dialog v-model:show="previewShow" @confirm="confirm" width="80%">
    <div class="flex flex-col justify-center items-center mt-[14px]">
      <span class="text-grey text-[12px] mt-[5px]">{{ props.note }}</span>
      <vue-qr @click="download" ref="qrRef" :text="props.schemaUrl" :size="200"></vue-qr>
    </div>
  </van-dialog>
</template>

<script setup>
import { ref } from 'vue';
import vueQr from 'vue-qr/src/packages/vue-qr.vue';
import { downLoadUrlSave } from '@/utils/tools/tools.js';
const emits = defineEmits(['update:show'])
const props = defineProps({
  schemaUrl: {
    type: String,
    default: '',
    required: true
  },
  note: {
    type: String,
    default: '请使用抖音/快手扫描二维码'
  }
})

const previewShow = ref(false)
const qrRef = ref()

const download = () => {
  downLoadUrlSave({ url: qrRef.value.$el.src });
};

const confirm = () => {
  emits('update:show', false)
}
</script>

<style lang="scss" scoped></style>
