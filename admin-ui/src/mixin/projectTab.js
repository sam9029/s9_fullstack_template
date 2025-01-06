import { adverDownList } from '@/api/account/advertiser/advertiser.js'

export default {
  data() {
    return {
      interface_id: 0,
      project_ad_type: 0,
      ad_list: [],
    }
  },
  methods: {
    getCurrAdvertiser() {
      return this.project_ad_type;
    },
    setAdvertiser(ad_type) {
      this.project_ad_type = ad_type;
    },
    getAdvertiserList() {
      return adverDownList({ interface_id: this.interface_id }).then(data => {
        this.ad_list = data.data;
        if (this.ad_list.length > 0) {
          const ad_type = this.ad_list[0].value;
          this.setAdvertiser(ad_type);
        } else {
          this.handleNoPermi();
        }
      })
    },
    adtyeChange() {
      const ad = this.getCurrAdvertiser();
      this.setAdvertiser(0)
      this.$nextTick(() => {
        this.setAdvertiser(ad)
      })
    },
    // change(val) {
    //   const ad = val;
    //   this.setAdvertiser(0)
    //   this.$nextTick(() => {
    //     this.setAdvertiser(ad)
    //   })
    // },
    handleNoPermi() {
      this.$notify.error('暂无权限！');
      if (this.$route.path != '/401') {
        this.$router.replace({
          path: '/401',
        });
      }
    }
  },
  mounted() {
    // this.getAdvertiserList();
  },
}