<template>
  <div class="back-button flex items-center" @click="goBack">
    <van-image class="w-[25px] h-[22px]" :src="returnIcon" />
    <span class="font-bold">{{ text }}</span>
  </div>
</template>

<script setup>
  import returnIcon from '@/assets/image/back_arrow.png';
  import { useRouter } from 'vue-router';
  import { ref } from 'vue';

  const router = useRouter();

  const props = defineProps({
    backType: { type: String, default: '' },
    backPath: { type: String, default: '' },
    backQuery: { type: Object, default: {} },
    text: { type: String, default: '' },
  });

  const text = ref(props.text);

  const goBack = () => {
    if (props.backType == 'url') {
      router.replace({
        path: props.backPath,
        query: props.backQuery,
      });
    }
    if (props.backType == '-1') {
      router.go(-1);
    }
  };
</script>

<style lang="scss" scoped>
  :deep(.van-icon) {
    font-size: 20px;
  }
</style>
