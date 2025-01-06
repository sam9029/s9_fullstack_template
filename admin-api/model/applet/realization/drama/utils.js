const { SETTLE_METHOD_DESC } = require("../../../../enum/finance");
const { renderPrice } = require("../../../../utils/tools");
const { version_before_mount_cpm } = require("../../../../utils/version_control");


const FormatSmtFn = {
  compat_format($platform, $version) {
    // if (version_before_mount_cpm($platform, $version)) {
    //   return FormatSmtFn.format_old;
    // } else {
    //   return FormatSmtFn.format
    // }
    return FormatSmtFn.format
  },
  format(policys, relat_type, userinfo, item) {
    const matched_policys = FormatSmtFn.match_policys(policys, relat_type, userinfo);

    const arr = [];
    matched_policys.forEach(p => {
      const arr_item = {
        id: p.id,
        desc: FormatSmtFn.get_settle_desc(p.id, p.value),
        name: SETTLE_METHOD_DESC[p.id] || '',
        name_desc: FormatSmtFn.get_name_desc(p.id, relat_type),
        value: p.value,
        value_desc: FormatSmtFn.get_value_desc(p.id, p.value),
        value_format: FormatSmtFn.get_value_format(p.id, p.value, p.suffix)
      }
      arr.push(arr_item);
    })

    item.settle_mothods = arr;
  },
  format_old(policys, relat_type, userinfo, item) {
    const matched_policys = FormatSmtFn.match_policys(policys, relat_type, userinfo);

    const value_desc = [];
    const name_desc = [];
    const applet_desc = [];

    const OLD_SETTLE_DESC = {
      1: `每拉新赚`,
      2: `每订单赚`,
      3: `CPS分成比例`,
      4: `CPM分成比例`,
    }
    matched_policys.forEach(v => {
      v.show_value = v.suffix ? renderPrice(v.value, null, v.suffix) : renderPrice(v.value)
      v.value_desc = OLD_SETTLE_DESC[v.id] || "";
      name_desc.push(FormatSmtFn.get_name_desc(v.id, relat_type));
      value_desc.push(FormatSmtFn.get_value_desc(v.id, v.value));

      if(relat_type == 4) {
        applet_desc.push(FormatSmtFn.get_name_desc(v.id, relat_type));
      }
    })

    item.settlement_list = matched_policys;
    item.settlement_list_desc = value_desc.filter(v => !!v);
    item.settlement_method_desc = name_desc.filter(v => !!v);
    if (relat_type == 4) {
      item.settlement_list_cn_desc = applet_desc.filter(v => !!v);
    }
  },
  match_policys(policys = [], relat_type, userinfo) {
    const policy_arr = [];
    const id_set = new Set();
    policys.forEach(p => {
      let is_match = p.promotion_type == relat_type;
      // 没有渠道取0的政策 // 已orderby channel_id desc
      is_match &&= (p.channel_id == userinfo.channel_id || p.channel_id == 0);
      if (is_match && !id_set.has(p.id)) {
        policy_arr.push(p);
        id_set.add(p.id);
      }
    })
    return policy_arr
  },
  // 对方式的描述
  get_name_desc(smt_id, relat_type) {
    switch (smt_id) {
      case 1:
        return `按拉新结算`;
      case 2:
        return `按订单结算`;
      case 3:
        return relat_type == 4 ? '支付分成': `按充值结算`;
      case 4:
        return relat_type == 4 ? '广告分成': `按广告结算`;
      case 9:
        return `按拉活结算`;
      default:
        return ''
    }
  },
  // 对价格的描述
  get_value_desc(smt_id, value) {
    switch (smt_id) {
      case 1:
        return `每单赚${renderPrice(value, false, '元')}`;
      case 2:
        return `每单赚${renderPrice(value, false, '元')}`;
      case 3:
        return `支付分成${renderPrice(value, false, '%')}`;
      case 4:
        return `广告分成${renderPrice(value, false, '%')}`;
      case 9:
        return `每单赚${renderPrice(value, false, '元')}`;
      default:
        return ''
    }
  },
  get_value_format(smt_id, value, suffix) {
    suffix = suffix || '元';
    return renderPrice(value, false, suffix);
  },
  // 方式+价格描述
  get_settle_desc(smt_id, value) {
    switch (smt_id) {
      case 1:
        return `拉新${renderPrice(value, false, '元')}`;
      case 2:
        return `订单${renderPrice(value, false, '元')}`;
      case 3:
        return `支付分成${renderPrice(value, false, '%')}`;
      case 4:
        return `广告分成${renderPrice(value, false, '%')}`;
      case 9:
        return `拉活${renderPrice(value, false, '元')}`;
      default:
        return ''
    }
  },
}



module.exports = {
  FormatSmtFn,
}