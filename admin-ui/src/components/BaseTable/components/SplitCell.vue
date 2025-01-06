<script>
  function defaultCellRender(h, content, prop) {
    let children = content;
    if (typeof content != 'string') {
      children = content[prop];
    }
    return h('span', children);
  }

  export default {
    functional: true,
    props: {
      data: Array, // string[] | any[]
      prop: String,
      event: String,
      auth: String,
    },
    render(h, context) {
      const { props } = context;
      const { data = [] } = props;

      const subCells = data.map((v) => {
        const opt = {
          class: ['sub-cell'],
        };
        let cellNode = null;
        if (context.scopedSlots.default) {
          cellNode = context.scopedSlots.default(v);
        } else {
          cellNode = defaultCellRender(h, v, props.prop);
        }

        return h('div', opt, [cellNode]);
      });

      return h('div', { class: 'sub-cell-wrapper' }, subCells);
    },
  };
</script>

<style lang="scss" scoped>
  .sub-cell-wrapper {
    margin: 0 -10px;
    & > :last-child {
      border-bottom: none;
    }
  }
  .sub-cell {
    height: 32px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #dfe6ec;
    > span {
      display: inline;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
</style>
