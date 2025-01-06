import {
	mapGetters
} from 'vuex';
const InfoMixin = {
	data() {
		return {}
	},
	computed: {
		...mapGetters(['tabar', 'blogger_id', 'consultant_id', 'tabbar_height', 'navbar_height', 'has_login',
			'account_id', 'image', 'token'
		]),
	},
	methods: {}
}

export default InfoMixin;
