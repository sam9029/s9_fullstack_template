import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';
const userStore = useUserStore();
const router = computed(() => userStore.router);
const mapper = computed(() => {
    let m = {}
    userStore.router.forEach(i => {
        if (i?.perms) m[i?.perms] = true
    })
    return m
})

// 权限判断
export const checkAuthority = (_perms = null) => {
    if (!_perms) return false
    if (mapper.value[_perms]) return true
    return false
};