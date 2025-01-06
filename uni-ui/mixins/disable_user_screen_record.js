const disable_user_screen_record = {
	data() {
		return {
			screencap_flag: false,
		};
	},
	computed: {},
	methods: {
		noScreencap() {
			ks?.disableUserScreenRecord();
			ks?.onUserScreenRecord((e) => {
				// console.log(`e-开始--:`, e);
				if (e.state == 'start') {
					this.screencap_flag = true;
					// console.log(`开始录屏`);
				} else if (e.state == 'end') {
					this.screencap_flag = false;
					// console.log(`结束录屏`);
				}
			})
		},
		endNoScreencap() {
			ks?.enableUserScreenRecord();
			ks?.offUserScreenRecord((e) => {
				this.screencap_flag = false;
			});
		},
    ttNoScreencap(){
      tt.disableUserScreenRecord();
      tt?.onUserScreenRecord((e) => {
				// console.log(`e-开始--:`, e);
				if (e.state == 'start') {
					this.screencap_flag = true;
					// console.log(`开始录屏`);
				} else if (e.state == 'stop') {
					this.screencap_flag = false;
					// console.log(`结束录屏`);
				}
			})
    },
    ttEnScreencap(){
      tt.enableUserScreenRecord();
      tt?.offUserScreenRecord((e) => {
				this.screencap_flag = false;
			});
    }
	},
	onShow() {
		// #ifdef MP-KUAISHOU
		this.noScreencap();
		// #endif
    // #ifdef MP-TOUTIAO
		this.ttNoScreencap();
		// #endif
	},
	onHide() {
		// #ifdef MP-KUAISHOU
		this.endNoScreencap();
		// #endif
    // #ifdef MP-TOUTIAO
		this.ttEnScreencap();
		// #endif
	},
	onUnload() {
		// #ifdef MP-KUAISHOU
		this.endNoScreencap();
		// #endif
    // #ifdef MP-TOUTIAO
		this.ttEnScreencap();
		// #endif
	},
};

export default disable_user_screen_record;