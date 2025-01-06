<template>
  <div class="head-tabs-view">
    <el-tabs v-model="activeName" @tab-click="TabClickToRouter">
      <el-tab-pane
        v-for="item in authTabPanes"
        :key="item.name"
        :label="item.label"
        :name="item.name"
      >
      </el-tab-pane>
    </el-tabs>

    <!-- 模板配置 -->
    <Template v-if="activeName == 1"></Template>
    <!-- 平台配置 -->
    <Platform v-if="activeName == 2"></Platform>
    <!-- 作品品类 -->
    <Category v-if="activeName == 3"></Category>
    <!-- 素材配置 -->
    <Material v-if="activeName == 4"></Material>
    <!-- 账号标签 -->
    <Tag v-if="activeName == 5"></Tag>
    <!-- 服务商主体 -->
    <RecivingCompany v-if="activeName == 6"></RecivingCompany>
    <!--  -->
  </div>
</template>

<script>
  import tabMixin from '@/mixin/tabActive';

  export default {
    name: 'sysConfig',
    mixins: [tabMixin],

    components: {
      Template: () => import('./Template'),
      Platform: () => import('./Platform'),
      Category: () => import('./Category'),
      Material: () => import('./Material'),
      Tag: () => import('./Tag'),
      RecivingCompany: () => import('./RecivingCompany'),
    },

    data() {
      return {
        activeName: '1',
        tabPanes: [
          { name: '1', label: '模板配置', permi: ['sys:config:template'] },
          { name: '2', label: '平台配置', permi: ['sys:config:platform'] },
          { name: '3', label: '作品品类', permi: ['sys:config:category'] },
          { name: '4', label: '素材配置', permi: ['sys:config:material'] },
          { name: '5', label: '账号标签', permi: ['sys:config:tag'] },
          { name: '6', label: '服务商主体', permi: ['sys:config:reciving_company'] },
        ],
      };
    },
  };
</script>
