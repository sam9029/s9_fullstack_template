<script>
  export default {
    name: 'render',
    props: ['data'],
    render(h, context) {
      return this.data;
    },
  };
</script>
