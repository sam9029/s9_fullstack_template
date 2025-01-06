const validateEmail = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请正确填写邮箱'));
  } else {
    if (value !== '') {
      var reg = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
      if (!reg.test(value)) {
        callback(new Error('请输入有效的邮箱'));
      }
    }
    callback();
  }
};

const validateMobilePhone = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('手机号不可为空'));
  } else {
    if (value !== '') {
      var reg = /^1[3456789]\d{9}$/;
      if (!reg.test(value)) {
        callback(new Error('请输入有效的手机号码'));
      }
    }
    callback();
  }
};

export { validateEmail, validateMobilePhone };
