<template>
  <div class="base-upload__wrapper">
    <LightModeUpload v-if="mode === 'light'" v-bind="$attrs" v-on="$listeners">
      <template v-if="$slots.tip" #tip> <slot name="tip"></slot> </template>
    </LightModeUpload>
  </div>
</template>

<script>
  import LightModeUpload from './LightMode/index.vue';

  export default {
    props: {
      mode: {
        type: String,
        default: 'light',
        validator: function (value) {
          return ['light', 'main'].includes(value);
        },
      },
    },
    components: { LightModeUpload },
  };
</script>
