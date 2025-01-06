import { mapGetters } from "vuex";
/**
 * pay_info 包含keys
 * custom_timestamp
 * cagent
 * cparam
 */
const shareMixins = {
	computed: {
		...mapGetters(["pay_info", "share_image"]),
	},
	onShareAppMessage(shareInfo) {
		let { from, type } = shareInfo;
		let path = "";
		let base_path = uni.$u.page().substring(1)
		let title = '';
		// #ifdef MP-TOUTIAO
		type = type || from
		// #endif
		let query = {}
		switch (type) {
			case 'videoPublish'://拍快手
			case 'share'://分享
			case 'menu'://抖音分享
			case 'live'://快手直播挂载
			case 'plc'://快手配置到左下角视频挂载
			// #ifdef MP-TOUTIAO
			case 'button':
			// #endif
				if (this.pay_info?.cagent >= 0) query = { cagent: this.pay_info?.cagent, cparam: this.pay_info?.cparam || '' }
				if (base_path?.includes(`play/index`)) {
					title = this.detailObj?.name || '';
					title = title?.length > 7 ? String(title).slice(0, 7) + '...' : title;
					if (this.currentPlayId) query.id = this.currentPlayId
					// #ifdef MP-KUAISHOU
					if (this?.currentThirdId) query.ks_third_id = this.currentThirdId
					// #endif
					if (this.id) query.cid = this.id
				}
				path = base_path + uni.$u.queryParams(query)
				return {
					title,
					// #ifdef MP-TOUTIAO
					imMsgType: 0,
					// #endif
					imageUrl: this.share_image,
					path
				}

			default:
				if (base_path?.includes(`play/index`)) {
					title = this.detailObj?.name || '';
					title = title?.length > 7 ? String(title).slice(0, 7) + '...' : title;
					if (this.currentPlayId) query.id = this.currentPlayId
					// #ifdef MP-KUAISHOU
					if (this?.currentThirdId) query.ks_third_id = this.currentThirdId
					// #endif
					if (this.id) query.cid = this.id
				}
				path = base_path + uni.$u.queryParams(query)
				// console.log(`path--plc-:`, path);
				return {
					title,
					imageUrl: this.share_image,
					path,
				}
		}
	},
	onShareTimeline() {
		return {
			title: '快速注册，优质任务等你赚',
			imageUrl: this.share_image
		}
	},
	onAddToFavorites() {
		return {
			title: '快速注册，优质任务等你赚',
			imageUrl: this.share_image
		}
	}
}

export default shareMixins;
