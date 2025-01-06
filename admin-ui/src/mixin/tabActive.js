export default {
  data() {
    return {
      activeName: '',
      tabPanes: [],
      authTabPanes: [],
    };
  },
  created() {
    this.authTabPanes = this.tabPanes.filter((v) => !v.permi || this.$checkPermi(v.permi));
    this.activeName = this.authTabPanes[0]?.name;
    let query = this.$route.query;
    if (query && query.activeTabName) this.activeName = query.activeTabName;
    if (!this.activeName) {
      this.handleNoPermi();
    }
  },
  mounted() {
    this.checkRouterSetActiveTab();
  },
  methods: {
    checkRouterSetActiveTab() {
      if (!this.authTabPanes.some((v) => v.name === this.activeName)) {
        this.handleNoPermi();
      }
    },
    TabClickToRouter(tab) {
      if (tab.name == this.$route.query?.activeTabName) return;
      let query = JSON.parse(JSON.stringify(this.$route.query));
      if (tab.name) query.activeTabName = tab.name;
      this.$router.replace({ query });
    },
    handleNoPermi() {
      this.$notify.error('暂无权限！');
      if (this.$route.path != '/401') {
        this.$router.replace({
          path: '/401',
        });
      }
    },
  },
};
