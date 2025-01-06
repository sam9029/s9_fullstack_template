<template>
  <draggable
    v-model="sort_list"
    chosenClass="chosen"
    forceFallback="true"
    animation="1000"
    @start="onStart"
    @end="onEnd"
  >
    <transition-group>
      <div class="max-width-view" v-for="(element, index) in sort_list" :key="element.id">
        <slot :element="element" :index="index + 1">{{ element.name }}</slot>
      </div>
    </transition-group>
  </draggable>
</template>

<script>
  import draggable from 'vuedraggable';
  export default {
    components: { draggable },
    props: {
      value: {
        type: Array,
        default: () => [],
      },
    },
    computed: {
      sort_list: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('input', value);
        },
      },
    },
    data() {
      return {
        drag: false,
      };
    },
    methods: {
      //开始拖拽事件
      onStart() {
        this.drag = true;
      },
      //拖拽结束事件
      onEnd() {
        this.drag = false;
      },
    },
  };
</script>

<style lang="scss" scoped>
  .max-width-view {
    width: 100%;
    max-width: 600px;
    cursor: move;
  }
</style>
