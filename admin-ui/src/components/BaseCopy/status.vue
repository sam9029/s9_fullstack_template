<script>
  import { STATUS_MAPPER } from '@/utils/mapper';
  export default {
    // functional: true,
    data() {
      return {
        STATUS_MAPPER,
      };
    },
    props: {
      status: {
        type: [Number, String],
        default: 1,
      },
      label: {
        type: String,
        default: '',
      },
      mapper: Object,
      iconClass: [String, Function],
      reason: String,
      placeholder: {
        type: String,
        default: '',
      },
    },
    render(h, context) {
      // const vm = this;
      // const { props, data, listeners } = context;
      const props = this.$props;
      const childrens = [];
      if (props.label) {
        childrens.push(h('span', props.label));
      }
      const iClassList = ['icon-dot'];
      if (props.iconClass) {
        if (typeof props.iconClass == 'function') {
          const cls = props.iconClass(props.status);
          if (Array.isArray(cls)) {
            iClassList.concat(cls);
          } else {
            iClassList.push(cls);
          }
        } else {
          iClassList.push(props.iconClass);
        }
      } else {
        // defalut class
        if (props.status == 1) {
          iClassList.push('text-success');
        } else if (props.status == 2) {
          iClassList.push('text-warning');
        } else if (props.status == 3) {
          iClassList.push('text-danger');
        }
      }
      childrens.push(h('i', { class: iClassList }));
      const mapper = props.mapper || STATUS_MAPPER;
      childrens.push(h('span', mapper[props.status] || props.placeholder));
      if (props.reason) {
        const popover = h(
          'el-tooltip',
          {
            props: {
              placement: 'top',
              trigger: 'hover',
              content: props.reason,
            },
          },
          [h('svg-icon', { props:{iconName:'wenhao'}, class: ['pl5 icon'], style:{fontSize:'15px'} }), null],
        );
        childrens.push(popover);
      }

      return h('div', childrens);
    },
  };
</script>

<style lang="scss" scoped>
  .status-view {
    font-size: inherit;
  }
  .icon-dot {
    display: inline-block;
    height: 6px;
    width: 6px;
    border-radius: 50%;
    vertical-align: middle;
    margin-bottom: 3px;
    margin-right: 6px;
  }
  .text-primary {
    background-color: var(--theme-default);
  }
  .text-info {
    background-color: #909399;
  }
  .text-success {
    background-color: #67c23a;
  }

  .text-warning {
    background-color: #f8ac59;
  }
  
  .text-danger {
    background-color: #ed5565;
  }
  .text-discard {
    background-color: #3f3b3b;
  }
  .text-process {
    background-color: #d859f8;
  }
  .icon {
    cursor: pointer;
  }
</style>
