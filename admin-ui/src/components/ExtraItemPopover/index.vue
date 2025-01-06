<template>
  <div>
    <template v-if="render_data.length">
      <!-- 渲染数据 多余 最大展示 值 -->
      <template v-if="extra_show_flag">
        <el-popover placement="right-start" width="300" trigger="hover">
          <div slot="reference">
            <template v-for="item in render_data">
              <el-tag :key="item">{{ item.label }}</el-tag>
            </template>
          </div>
          <div>
            <template v-for="item in local_source_data">
              <el-tag :key="item">{{ item.label }}</el-tag>
            </template>
          </div>
        </el-popover>
      </template>
      <!-- 渲染数据 小于 最大展示值  -->
      <template v-else v-for="item in render_data">
        <el-tag :key="item">{{ item.label }}</el-tag>
      </template>
    </template>
    <template v-else>
      <!-- slot默认内容的语法兼容 -->
      <slot v-if="$slots.empty" name="empty"></slot>
      <template v-else>
        <div> 不限 </div>
      </template>
    </template>
  </div>
</template>

<script>
  const MAX = 6;
  export default {
    props: {
      // 接受类型 string[] || number[] || {}[]
      source_data: { type: Array, default: () => [] },
      max_show_num: { type: [String, Number], default: MAX },
    },

    computed: {
      local_source_data() {
        if (this.source_data.length) return this.preDealItem(this.source_data);
        else return [];
      },

      render_data() {
        if (this.source_data.length) return this.dealItem(this.local_source_data);
        else return [];
      },
    },

    data() {
      return {
        extra_show_flag: false,
      };
    },

    methods: {
      /**
       * 预处理，将传入的数据统一处理为 {label:null,value:null}
       * @param {Array} _list
       * @type { _list } string[] || number[] || {}[]
       *
       */
      preDealItem(_list) {
        let temp = [];
        if (Object.prototype.toString.call(_list[0]) == '[object Object]') {
          _list.forEach((item) => {
            temp.push({
              label: item?.label || item?.name,
              value: item?.value || item?.id,
            });
          });
        }
        if (
          Object.prototype.toString.call(_list[0]) == '[object Number]' ||
          Object.prototype.toString.call(_list[0]) == '[object String]'
        ) {
          _list.forEach((item) => {
            temp.push({
              label: item,
              value: item,
            });
          });
        }
        return temp;
      },
      /**
         * @param item Object
         * 使用 source_data_copy
         // 处理过多 项目类型  （可能会有很多个）
        */
      dealItem(_list) {
        //  真正渲染 的 项目类型数组
        let temp = [];
        //  设定 最大展示 值
        let maxShowTagNum = this.max_show_num;
        //  拷贝 原始数据
        let list_copy = JSON.parse(JSON.stringify(_list));
        _list.forEach(() => {
          //  提取 最大展示
          temp = list_copy.slice(0, maxShowTagNum);
          // 数据 大于 最大展示 处理
          if (list_copy.length > maxShowTagNum) {
            //  处理 剩余的数量 展示在末尾
            let residue = `+${list_copy.length - maxShowTagNum}`;

            temp.push({ label: residue });
            // 需要额外的展示标识
            this.extra_show_flag = true;
          }
        });
        // 返回渲染数据
        return temp;
      },
    },
  };
</script>

<style lang="scss" scoped></style>
