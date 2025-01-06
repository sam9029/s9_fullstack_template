/**
 * @typedef { 'String' | 'Number' | 'Boolean' | 'Function' | 'Symbol' | 'BigInt' | 'URL' } CtorTypes
 */

/**
 * @typedef {Object} KeyConfig
 * @property  {string} key
 * @property  {*} [type]
 * @property  {boolean} [required]
 * @property { Array | Object } [enums] 枚举范围
 * @property  {Function} [default]
 * @property  {(val) => boolean} [validator] 自定义校验方法
 * @property {(val) => String} [format] 格式化值，返回格式化的数据
 */
const Validator = require('validator').default

function is_empty(value, can_object_empty = false) {
  if (is_object(value)) {
    if (can_object_empty) return is_object_empty(value);
  };
  return value === undefined || value === null || value === ''
}

function is_object_empty(obj) {
  if (Array.isArray(obj)) return obj.length == 0;
  return Reflect.ownKeys(obj).length == 0;
}

/**
 * @returns { string }
 */
function get_type(constructor) {
  const match = constructor && constructor.toString().match(/^\s*(function|class) (\w+)/)
  return match ? match[2] : constructor === null ? 'null' : '';
}

let _simple_types = ['String', 'Number', 'Boolean', 'Function', 'Symbol', 'BigInt'];
function is_simple_type(ctor_name) {
  return _simple_types.includes(ctor_name)
}

function is_array(val) {
  return Array.isArray(val)
}

function is_object(val) {
  return val !== null && typeof val === 'object'
}

const ErrorType = {
  Required: 1,
  TypeError: 2,
  Validator: 3
}
class CheckKeyError extends Error {
  prop = "";
  type = 0;
  custom_message = "";

  constructor(prop, type, custom_message) {
    super();
    this.prop = prop;
    this.type = type;
    if (custom_message) {
      this.custom_message = custom_message;
    }
  }

  toString() {
    switch (this.type) {
      case ErrorType.Required:
        return `参数${this.prop}缺失！`;
      case ErrorType.TypeError:
        return this.custom_message || `参数${this.prop}类型错误！`;
      case ErrorType.Validator:
        return this.custom_message || `参数${this.prop}未能通过自定义校验！`;
      default:
        return `参数${this.prop}不符合要求！`;
    }
  }
}

/**
 * 检查data中是否含有key_configs中的key  
 * 如果item为string：结尾为?表示可选key，否则表示必传key  
 * 如果item为KeyConfig：按传入配置处理  
 * 返回值仅包含key_configs包含的key值
 * @param {Object} data 
 * @param {(KeyConfig | string)[]} key_configs 
 * @param { boolean } set_empty 是否保留空值 default false
 * 
 * @example
 * ```js
 * checkKeys([
 *   "required_key",
 *   "option_key?"
 *   { key: "key1", type: Number, required: false, default: 1, validator: val => [1,2,3].includes(val) }
 * ])
 * ```
 */
function check_keys(data, key_configs, set_empty = false) {
  const obj = {};
  for (const config of key_configs) {
    const {
      key,
      type,
      required,
      enums,
      default: _default,
      validator,
      format
    } = _format_check_key(config);

    let val = format && data[key] ? format(data[key]) : data[key]
    if (is_empty(val, false)) {
      // default不校验type、required
      if (!is_empty(_default)) {
        if (typeof _default == 'function') {
          obj[key] = _default();
        } else {
          obj[key] = _default;
        }
        continue;
      }

      if (required) throw new CheckKeyError(key, ErrorType.Required);

      if (set_empty && Reflect.has(data, key)) {
        obj[key] = val;
      }
      // 非required 空值不继续校验
      continue;
    }
    if (type) {
      if (type === Number) {
        let num_val = Number(val);
        if (!isNaN(num_val)) {
          val = num_val;
        }
      }
      _check_type(key, val, type);
    }

    if (enums) {
      const enum_error = _enums_validator(key, val, enums);
      if (enum_error) {
        throw enum_error;
      }
    }
    if (validator) {
      const validate_error = _custom_validator(validator, key, val);
      if (validate_error) {
        throw validate_error;
      }
    }
    obj[key] = val;
  }
  return obj
}

/**
 * @returns { KeyConfig }
 */
function _format_check_key(key = '') {
  if (typeof key == 'string') {
    let required = true;
    if (key.endsWith('?')) {
      key = key.substring(0, key.length - 1);
      required = false;
    }
    return { key, required }
  }
  return key
}
function _check_type(key, val, types) {
  if (!is_array(types)) {
    types = [types]
  }
  let pass = false;
  const expected_types = [];
  for (let i = 0; i < types.length; i++) {
    const ctor = types[i];
    const { valid, ctor_name } = assert_type(val, ctor);
    expected_types.push(ctor_name);
    if (valid) {
      pass = true;
      break;
    }
  }
  if (!pass) {
    throw new _type_error(key, expected_types);
  }
}
function _type_error(key, expected_types) {
  const msg = `参数${key}类型错误, 请传入${expected_types.join(' | ')}类型！`;
  return new CheckKeyError(key, ErrorType.TypeError, msg);
}
function _enums_validator(key, val, enums) {
  const error = new CheckKeyError(key, ErrorType.Validator);
  error.custom_message = `参数${key}校验配置错误！`;

  let arr_enums = [];
  let stringfiy_val = false;
  if (is_array(enums)) {
    arr_enums = enums;
  } else {
    if (typeof enums != 'object') {
      return error;
    }
    arr_enums = Reflect.ownKeys(enums);
    stringfiy_val = true;
  }

  if (arr_enums.length == 0) {
    error.custom_message = `参数${key}无有效枚举配置！`;
    return error;
  }

  error.custom_message = `参数${key}值无效，有效值${arr_enums.join(' | ')}！`;
  const val_not_match_enums = (v) => {
    if (stringfiy_val) {
      return !enums.includes(String(v));
    }
    return !enums.includes(v)
  }
  if (is_array(val)) {
    if (val.some(val_not_match_enums)) {
      return error;
    }
  } else {
    if (val_not_match_enums(val)) {
      return error;
    }
  }
}
function _custom_validator(validator, key, val) {
  // if validator throw an error, controller will catch and format it.
  const validate = validator(val);
  if (validate === true || validate === undefined) { return; }
  const error = new CheckKeyError(key, ErrorType.Validator);
  if (validate === false) {
    error.custom_message = `参数${key}未能通过自定义校验！`;
  } else {
    if (typeof validate == "string") {
      error.custom_message = validate;
    } else {
      error.custom_message = String(validate);
    }
  }
  return error;
}

/**
 * 检查val是否为ctor_name类型
 * @param { any } val 
 */
function assert_type(val, ctor) {
  let valid = false;

  const ctor_name = get_type(ctor)
  // check type
  if (is_simple_type(ctor_name)) {
    const type_name = typeof val;
    valid = type_name == ctor_name.toLowerCase();
    if (type_name == 'object') {
      valid = val instanceof ctor;
    }
  } else if (ctor_name === 'Object') {
    valid = is_object(val)
  } else if (ctor_name === 'Array') {
    valid = is_array(val)
  } else if (ctor_name === 'null') {
    valid = val === null
  } else if (ctor_name === 'URL') {
    valid = Validator.isURL(val, { protocols: ['http', 'https'], validate_length: true })
  } else {
    valid = val instanceof ctor
  }

  return { valid, ctor_name }
}

/**
 * @param {[]} array 
 */
function is_array_has(array, val) {
  return array.includes(val)
}

module.exports = {
  checkKeys: check_keys,
  assertType: assert_type,
  isEmpty: is_empty,
  isObject: is_object,
  isArray: is_array,
  isArrayHas: is_array_has
}