<template>
  <div class="head-tabs-view">
    <el-tabs v-model="activeName">
      <el-tab-pane v-for="item in tabPanes" :key="item.name" :label="item.label" :name="item.name">
      </el-tab-pane>
    </el-tabs>

    <PC v-if="activeName == 1"></PC>
    <Applet v-if="activeName == 2"></Applet>
  </div>
</template>

<script>
  export default {
    name: 'Menu',
    components: {
      PC: () => import('./pc'),
      Applet: () => import('./applet'),
    },
    data() {
      return {
        activeName: '1',
        tabPanes: [
          {
            name: '1',
            label: 'PC端',
          },
          {
            name: '2',
            label: '小程序',
          },
        ],
      };
    },
  };
</script>
