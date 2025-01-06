<template>
  <div class="tag-list-edit">
    <el-popover>
      <div class="tag-popover-select">
        <el-select
          v-bind="$attrs"
          v-on="$listeners"
          multiple
          filterable
          clearable
          :remote="remote"
          :remote-method="innerCallRemote"
        >
          <el-option
            v-for="item in localSource"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          ></el-option>
        </el-select>
        <!-- slot默认内容的语法兼容 -->
        <slot v-if="$slots.button" name="button"></slot>
        <template v-else>
          <el-button size="mini" type="primary" :loading="loading" @click="submit"
            >提交</el-button
          >
        </template>
      </div>
      
      <span slot="reference" @click="showPopper">
        <!-- slot默认内容的语法兼容 -->
        <slot v-if="$slots.reference" name="reference"></slot>
        <template v-else>
          <i class="el-icon-edit pointer ml-5 mt-5"></i>
        </template>
      </span>
    </el-popover>
  </div>
</template>



<script>
  export default {
    props: {
      remote: Boolean,
      remoteMethod: Function,
    },
    data() {
      return {
        localSource: [],
        loading: false,
      };
    },
    methods: {
      showPopper() {
        this.innerCallRemote()
      },
      async submit() {
        const listener = this.$listeners.submit;
        if (listener && typeof listener == "function") {
          if (this.loading) return;
          this.loading = true;
          await listener(this.$attrs.value);
          this.loading = false;
        }
      },
      async innerCallRemote(keyword) {
        try {
          this.localSource = await this.remoteMethod(keyword);
        } catch (error) {
          this.$notify.error(error)
        }
      }
    },
  };
</script>