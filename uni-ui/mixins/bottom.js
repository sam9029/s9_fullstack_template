const MescrollBottomMixin = {
    data() {
        return {
            mescrollHeight: "0px",
        }
    },
    computed: {

    },
    methods: {
        mescrollHeightChange(val) {
            this.mescrollHeight = val + 'px'
        },
    }
}

export default MescrollBottomMixin;