<template>
  <div class="login-page min-h-screen p-[14px] bg-blue-100">
    <div class="login-card bg-[#f1f7fe] rounded shadow-md mt-10 py-[14px] grid justify-center">
      <p class="text-xs text-center">登 录</p>
      <p class="text-slate-400 text-[14px] mt-2 text-center">登录你的账号</p>
      <van-form class="mt-2" @submit="onSubmit" @failed="onFailed">
        <van-cell-group inset>
          <van-field
            v-model="model.email"
            name="手机号"
            placeholder="手机号"
            :rules="[{ required: true, message: '请填写手机号' }]"
          />
          <van-field
            v-model="model.password"
            type="password"
            name="密码"
            placeholder="密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
          <div class="flex gap-[10px] items-center">
            <van-field
              v-model="model.captcha_code"
              name="验证码"
              placeholder="验证码"
              :rules="[{ required: true, message: '请填写验证码' }]"
            />
            <van-button class="w-[240px]" style="border: none" @click="getImgCode">
              <van-count-down
                v-if="gettingCode"
                :disabled="gettingCode"
                :time="smgCodeTime"
                @finish="countFinish"
              >
                <template #default="timeDate">
                  <span>{{ timeDate.minutes * 60 + timeDate.seconds + 's' }}</span>
                </template>
              </van-count-down>
              <span v-else class="text-less-black">获取验证码</span>
            </van-button>
          </div>
        </van-cell-group>
        <div class="m-[16px]">
          <van-button round block type="primary" native-type="submit"> 登 录 </van-button>
        </div>
      </van-form>
      <div class="login-card--botom">
        <p class="text-center text-[16px]"
          >还没有账号?
          <span class="text-blue-500 cursor-pointer" @click="router.push({ name: 'Register' })"
            >去注册</span
          >
        </p>
      </div>
    </div>

    <div
      class="slider-verify-container bg-slate-100 p-2 mt-2 shadow-md rounded flex flex-col items-center"
    >
      <p class="text-1 text-center mb-1">滑动验证</p>
      <SlideVerify ref="verifyRef" @diff="getDiff" />
    </div>

    <van-dialog
      v-model:show="showImgCode"
      title="图形验证码"
      :showCancelButton="false"
      :showConfirmButton="false"
    >
      <div class="captcha_code-container relative flex flex-col items-center gap-[20px] p-[20px]">
        <div class="captcha_code-container--top flex items-center gap-[10px]">
          <van-field
            v-model="model.captcha_code"
            :formatter="formatter"
            format-trigger="onBlur"
            name="captcha_code"
            placeholder="请输入验证码"
          />
          <img class="flex items-center w-[120px]" :src="imgSmgCodeUrl" @click="getImgCode" />
        </div>
        <van-button class="w-full" type="primary" @click="confirmImgCodeDialog">确认</van-button>
        <van-icon
          color="#111111"
          size="30"
          name="close"
          class="captcha_code-close"
          @click="closeImgCodeDialog"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
  import { ref, getCurrentInstance, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { sendSms, getCodeImg, getSlideCode, kocLogin } from '@/api/login.js';
  import { sleep } from '@/utils/tools/tools';
  import SlideVerify from '@/components/SlideVerify/slideVerify.vue';
  import { useUserStore } from '@/store/modules/user.js';
  const router = useRouter();
  const { proxy } = getCurrentInstance();
  const store = useUserStore();

  const smgCodeTime = ref(120 * 1000);
  const gettingCode = ref(false);
  const imgSmgCodeUrl = ref('');
  const showImgCode = ref(false);
  const model = ref({
    email: null,
    password: '',
    captcha_code: '',
    captchaDiff: 0,
  });

  // 倒计时结束
  const countFinish = () => {
    smgCodeTime.value = 120 * 1000;
    gettingCode.value = false;
    sessionStorage.removeItem('getSmgCodeTime');
  };

  const getImgCode = () => {
    // if (!model.value.telephone || !/^1[0-9]{10}$/.test(model.value.telephone)) {
    //   proxy.$notify({
    //     type: 'danger',
    //     message: '请输入正确格式的手机号!',
    //   });
    //   return;
    // }
    if (!model.value.email) {
      proxy.$notify({
        type: 'danger',
        message: '请输入正确格式的手机号!',
      });
      return;
    }
    getCodeImg({ type: 'png' })
      .then((res) => {
        if (res && res.code == 0) {
          showImgCode.value = true;
          imgSmgCodeUrl.value = res.data;
        }
      })
      .catch((error) => {
        proxy.$notify({
          type: 'danger',
          message: String(error?.message || error || ''),
        });
      });
  };

  const getSms = async () => {
    const params = {
      sms_type: 5,
      telephone: model.value.email,
    };
  };

  // 确认图像验证码
  const confirmImgCodeDialog = () => {
    if (model.value.captcha_code) {
      gettingCode.value = true;
      sessionStorage.setItem('getSmgCodeTime', new Date().getTime());
      getSms(); // 获取短信
      showImgCode.value = false;
    } else {
      showNotify({
        type: 'danger',
        message: '请输入验证码!',
      });
    }
  };

  // 关闭图像验证码
  const closeImgCodeDialog = () => {
    model.value.captcha_code = null;
    showImgCode.value = false;
  };

  const onSubmit = async() => {
    const { captchaDiff, ...params } = model.value;
    let fp = await store.GET_FINGERPRINT()
    kocLogin({ 
      ...params,
      fingerprint: { fingerprint: fp.finger_print, score: fp.score }
    })
      .then((res) => {
        if (res.code == 0) {
          store.AFTER_LOGIN(res)
          router.push({ name: 'Home' });
        }
      })
      .catch((error) => {
        proxy.$notify({
          type: 'danger',
          message: String(error?.message || error || ''),
        });
      });
  };

  const onFailed = (errorInfo) => {
    console.log('failed', errorInfo);
  };

  const getDiff = async (diff) => {
    model.value.captchaDiff = diff;
    console.log('diff', diff);
    await sleep(1000);
    verifyRef.value._refresh();
  };

  const verifyRef = ref(null);
  onMounted(() => {
    verifyRef.value._open();
  });
</script>

<style lang="scss" scoped>
  .captcha_code-close {
    position: absolute;
    top: -40px;
    right: 10px;
  }
</style>
