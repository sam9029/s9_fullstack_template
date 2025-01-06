<template>
  <div class="register-page min-h-screen p-[14px] bg-blue-100">
    <div class="register-card bg-[#f1f7fe] rounded shadow-md mt-10 py-[14px] grid justify-center">
      <p class="text-xs text-center">注 册</p>
      <p class="text-slate-400 text-[14px] mt-2 text-center">注册你的账号</p>
      <van-form class="mt-2" @submit="onSubmit" @failed="onFailed">
        <van-cell-group inset>
          <van-field
            v-model="model.phone"
            name="电话号码"
            label="电话号码"
            placeholder="请输入电话号码"
            :rules="[{ required: true, message: '请填写电话号码' }]"
          />
          <van-field
            v-model="model.username"
            name="用户名"
            label="用户名"
            placeholder="用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <van-field
            v-model="model.password"
            type="password"
            name="密码"
            label="密码"
            placeholder="密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </van-cell-group>
        <div class="m-[16px]">
          <van-button round block type="primary" native-type="submit"> 注 册 </van-button>
        </div>
      </van-form>
      <div class="register-card--bottom">
        <p class="text-center text-[16px]"
          >已经有账号? <span class="text-blue-500 cursor-pointer" @click="router.push({ name: 'Login' })">去登录</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();

  const model = ref({
    phone: '',
    username: '',
    password: '',
  });

  const onSubmit = () => {
    router.push({ name: 'Home' });
  };

  const onFailed = (errorInfo) => {
    console.log('failed', errorInfo);
  };
</script>

<style lang="scss" scoped></style>
