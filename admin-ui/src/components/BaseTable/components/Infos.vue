<script>
  import { Message, Notification } from 'element-ui';
  import { checkPermi } from '@/utils/permission';
  import { copyText } from '@/utils/common/tools';
  // interface InfosItem {
  //   prop: string;
  //   lable: string;
  //   tooltip: boolean;
  //   event: string;
  //   auth: string | string[],
  //   className: string | string[]
  //   render: Function: (store) => string
  // }

  export default {
    functional: true,
    props: {
      store: Object,
      infos: Array, // InfosItem[]
    },
    render(h, context) {
      const childrens = [];
      const { props } = context;
      const { store, infos } = props;
      infos.forEach((info) => {
        const { prop, label, tooltip, event, auth, render, className, zeroNoshow = false } = info;
        let value;
        if (typeof render == 'function') {
          value = render(store);
        } else {
          value = store[prop];
        }
        if (Array.isArray(value)) {
          value = value.join('，');
        }
        let permission = auth;
        if (permission?.length) {
          if (!Array.isArray(permission)) {
            permission = [permission];
          }
          if (!checkPermi(permission)) return;
        }
        // 当值为 0 或 '0' 时不展示
        if (zeroNoshow && value == '0') {
          return;
        }
        if (!!value || value == '0') {
          const itemChilds = [];
          if (label) {
            itemChilds.push(h('span', label));
          }
          const valueOpts = {};
          if (event) {
            valueOpts.on = {
              click: () => handleEvent(event, value, context),
            };
            valueOpts.class = ['theme-color', 'pointer'];
          }
          itemChilds.push(h('span', valueOpts, value));
          const opts = {
            class: ['inhert-ellipsis'],
          };
          if (className) {
            if (Array.isArray(className)) {
              opts.class.push(...className);
            } else {
              opts.class.push(className);
            }
          }
          if (tooltip) {
            opts.domProps = { title: value };
            opts.class.push('help-cursor');
          }
          childrens.push(h('div', opts, itemChilds));
        }
      });
      return h('div', childrens);
    },
  };

  function handleEvent(event, value, context) {
    switch (event) {
      case 'link':
        return openLink(value);
      case 'copy':
        return copyTextWithTip(value);
      default:
        return context.listeners[event]?.(context.props.store);
    }
  }

  function openLink(url) {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    }
  }

  function copyTextWithTip(text) {
    const success = copyText(text);
    success &&
      Notification.success({
        duration: 2000,
        title: '复制成功！',
        showClose: true,
      });
  }
</script>
