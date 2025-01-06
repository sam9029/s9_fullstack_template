const tabPageJumpGateMixin = {
  data() {
    return {};
  },
  computed: {
    has_login() {
      return this.$store.getters.has_login;
    },
  },
  methods: {
    jumpGate() {
      if (!this.has_login) {
        uni.showModal({
          title: "系统提示",
          content: "请先登录",
          showCancel: false,
          confirmText: "跳转登录",
          confirmColor: this.$store.getters.theme_color,
          success: (res) => {
            this.$store.dispatch("LogOut");
          },
        });
        return false;
      }
      return true;
    },
  },
};

export default tabPageJumpGateMixin;
