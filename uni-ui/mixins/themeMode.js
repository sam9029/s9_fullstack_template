import { setThemeColor } from "@/utils/tools.js";
import { mapGetters } from "vuex";

const themeModeMixin = {
  data() {
    return {}
  },
  computed: {
    ...mapGetters(['theme_mode'])
  },
  onLoad() {
    setThemeColor(this.theme_mode);
  },
  onShow() {
    setThemeColor(this.theme_mode);
  },
}

export default themeModeMixin;