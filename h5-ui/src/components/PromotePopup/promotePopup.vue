<template>
  <div v-if="show">
    <van-popup duration="0.2" v-model:show="visiable" position="bottom" round>
      <div class="promote-box pt-[60px] pb-[40px]">
        <div v-if="props.showQr" class="text-center">
          <vue-qr
            @click="preview"
            class="rounded"
            ref="qrRef"
            :text="props.schemaUrl"
            :size="100"
            :margin="10"
          ></vue-qr>
          <div class="text-black font-bold text-[14px]">扫码推广</div>
          <div class="text-grey-400 text-[12px] mt-[5px]">点击预览二维码</div>
        </div>
        <div class="text-center">
          <van-image
            width="100px"
            height="100px"
            :src="tiktokPromoteIcon"
            @click="jump"
          ></van-image>
          <div class="text-black font-bold text-[14px]">{{
            platformText[props?.platformId]?.title
          }}</div>
          <div class="text-grey-400 text-[12px] mt-[5px]">{{
            platformText[props?.platformId]?.content
          }}</div>
        </div>
      </div>
    </van-popup>
    <van-dialog v-model:show="previewShow" @close="closePreview" :style="{width:'70%'}">
      <div class="flex flex-col justify-center items-center mt-[14px]">
        <span class="text-grey-400 text-[12px] mt-[5px]">请使用抖音/快手扫描二维码</span>
        <vue-qr @click="download" ref="qrRef" :text="props.schemaUrl" :size="200"></vue-qr>
      </div>
    </van-dialog>
    <van-dialog style="width: 100%" v-model:show="notifyShow" :showConfirmButton="false">
      <div class="p-[20px]"> <van-progress :percentage="percentage" :stroke-width="8" /></div>
    </van-dialog>
    <QrDialog v-model:show="qrDialogShow" :schemaUrl="schemaUrl"/>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import vueQr from 'vue-qr/src/packages/vue-qr.vue';
  import tiktokPromoteIcon from '@/assets/image/tiktok-promote.png';
  import QrDialog from './qrDialog.vue';
  import { mediaH5Publish, downLoadUrlSave, validPlatform } from '@/utils/tools/tools.js';
  import { douyinH5Share } from '@/api/public.js';
  import { getMd5, aliOssUpload } from '@/utils/tools/upload.js';
  import { showNotify } from 'vant';

  const qrRef = ref();
  const props = defineProps({
    schemaUrl: {
      type: String,
      default: '',
    },
    planId: {
      type: Number,
      default: null,
    },
    showQr: {
      type: Boolean,
      default: false,
    },
    platformId: {
      type: Number,
      default: null,
    },
  });
  const platformText = {
    1: {
      title: '拍抖音推广',
      content: '调起抖音直接推广',
    },
    2: {
      title: '拍快手推广',
      content: '调起快手直接推广',
    },
    4: {
      title: '拍微信推广',
      content: '调起微信直接推广',
    },
  };

  const visiable = ref(false);
  const qrDialogShow = ref(false);
  const show = ref(false);
  const notifyShow = ref(false);
  const previewShow = ref(false);
  const schemaUrl = ref('');
  const qrUrl = ref('');
  const percentage = ref(0);

  const preview = () => {
    previewShow.value = true;
    visiable.value = false;
    qrUrl.value = qrRef.value.$el.src;
  };

  const download = () => {
    downLoadUrlSave({ url: qrUrl.value });
  };

  const jump = () => {
    if (['wechat', 'qq'].includes(validPlatform())) {
      schemaUrl.value = props.schemaUrl
      visiable.value = false
      qrDialogShow.value = true
    } else {  
      mediaH5Publish({ schema_url: props.schemaUrl });
    }
  };

  const close = () => {
    show.value = false;
    visiable.value = false;
  };

  const closePreview = () => {
    previewShow.value = false;
    visiable.value = true;
  };

  const open = () => {
    show.value = true;
    visiable.value = true;
  };

  const afterRead = async (file) => {
    file.status = 'uploading';
    const config = await getMd5(file.file);
    notifyShow.value = true;
    config.onprogress = (t) => {
      percentage.value = t ? parseInt(t * 100) : 0;
    };

    await aliOssUpload(config).then(({ url }) => {
      notifyShow.value = false;
      file.status = 'success';

      let parma = {
        video_path: url,
        plan_id: props.planId,
        share_to_publish: 2,
      };
      douyinH5Share(parma)
        .then((res) => {
          if (!res.code) mediaH5Publish({ schema_url: res.data });
        })
        .catch((error) => {
          showNotify({
            type: 'danger',
            message: error,
          });
        });
    });
  };

  const onOversize = (file) => {
    showNotify('视频大小不能超过 128M');
  };

  defineExpose({ open });
</script>

<style lang="scss" scoped>
  .promote-box {
    display: flex;
    justify-content: space-around;
    background: #f9f9f9 linear-gradient(180deg, #f6f2fe 0%, #f9f9f9 100%);
  }
</style>
