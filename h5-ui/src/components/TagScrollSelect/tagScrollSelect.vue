<template>
  <van-skeleton title :row="1" :loading="loading">
    <div class="tag-container flex relative my-[14px]">
      <div
        v-for="item in contentTagList"
        :key="item.id"
        class="tag-item rounded py-[4px] px-[10px] bg-white text-gray-400 text-[12px] mr-[10px]"
        :class="{ active: tags.includes(item.id) }"
        @click="handleTag(item)"
      >{{ item.name }}</div>
    </div>
  </van-skeleton>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { getTagList } from '@/api/public';
  const emits = defineEmits(['tagSelected']);
  const props = defineProps({
    businessType: {
      type: Number,
    },
  });

  const businessType = ref(props.businessType);
  const contentTagList = ref([]);
  const tags = ref([]);
  const loading = ref(false);

  // 获取标签列表
  const queryTagList = async () => {
    loading.value = true;
    try {
      const res = await getTagList({ businessType: businessType.value });
      if (res && res.code === 0) {
        contentTagList.value = res.data;
        contentTagList.value.unshift({
          name: '全部',
          id: 'all',
        });
        tags.value = [res.data[0].id];
      }
      loading.value = false;
    } catch (error) {
      loading.value = false;
      showNotify({
        type: 'danger',
        message: error.message || error,
      });
    }
  };

  // 点击标签
  const handleTag = (data) => {
    tags.value = [data.id];
    emits('tagSelected', tags.value);
  };

  onMounted(() => {
    queryTagList();
  });
</script>

<style lang="scss" scoped>
  .tag-container {
    overflow-x: auto;
    .tag-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .tag-item {
      flex-shrink: 0;
      border: 1px solid transparent;
    }
    .active {
      background: #E6F2FF;
      color: #3183ff;
    }
  }
</style>
