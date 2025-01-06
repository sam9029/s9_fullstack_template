<template>
  <el-form ref="form" :model="form" :rules="rules" label-width="80px">
    <el-row :gutter="8">
      <el-col :span="24">
        <el-form-item label="菜单类型" @change="getOptions" prop="menu_type">
          <el-radio-group :disabled="form.id ? true : false" v-model="form.menu_type">
            <el-radio label="M">主菜单</el-radio>
            <el-radio label="C">子菜单</el-radio>
            <el-radio label="T">选项卡</el-radio>
            <el-radio label="F">页面按钮</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col v-show="form.menu_type != 'M'" :span="24">
        <el-form-item label="上级菜单">
          <treeselect
            v-model="form.pid"
            :options="menuOptions"
            :normalizer="normalizer"
            :show-count="true"
            placeholder="选择上级菜单"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="菜单图标">
          <el-popover
            placement="bottom-start"
            width="550"
            trigger="click"
            @show="$refs['iconSelect'].reset()"
          >
            <IconSelect ref="iconSelect" @selected="selected" />
            <el-input slot="reference" v-model="form.icon" placeholder="点击选择图标" readonly>
              <svg-icon
                v-if="form.icon"
                slot="prefix"
                :icon-class="form.icon"
                class="el-input__icon"
                style="height: 32px; width: 16px"
              />
              <i v-else slot="prefix" class="el-icon-search el-input__icon" />
            </el-input>
          </el-popover>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="显示排序" prop="order">
          <el-input-number v-model="form.order" controls-position="right" :min="0" />
        </el-form-item>
      </el-col>
      <el-col :span="12" style="height: 50px">
        <el-form-item
          label="路由地址"
          prop="path"
          :rules="!['F', 'T'].includes(form.menu_type) ? rules.path : [{ required: false }]"
        >
          <el-input v-model="form.path" placeholder="请输入路由地址" />
        </el-form-item>
      </el-col>
      <el-col v-if="['C', 'F', 'T'].includes(form.menu_type)" :span="12">
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件路径" />
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="form.menu_type != 'M'">
        <el-form-item label="权限标识">
          <el-input v-model="form.perms" placeholder="请输入权限标识" maxlength="100" />
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="form.menu_type != 'M'">
        <el-form-item label="重定向">
          <el-input v-model="form.redirect" placeholder="请输入重定向的path" maxlength="100" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="显示状态">
          <el-radio-group v-model="form.hidden">
            <el-radio label="2">隐藏</el-radio>
            <el-radio label="1">展示</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="菜单状态">
          <el-radio-group v-model="form.status">
            <el-radio label="2">关闭</el-radio>
            <el-radio label="1">开启</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <!-- v-if="['M','C'].includes(form.menu_type)" -->
        <el-form-item label="侧边栏">
          <el-radio-group v-model="form.show_sidebar">
            <el-radio label="2">隐藏</el-radio>
            <el-radio label="1">显示</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="['C', 'F'].includes(form.menu_type)">
        <el-form-item label="是否缓存">
          <el-radio-group v-model="form.isCache">
            <el-radio label="1">缓存</el-radio>
            <el-radio label="2">不缓存</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script>
  import Treeselect from '@riophae/vue-treeselect';
  import IconSelect from '@/components/IconSelect';
  import { listMenu } from '@/api/system/menu';
  export default {
    model: {
      prop: 'value',
      event: 'input',
    },
    components: { Treeselect, IconSelect },
    props: {
      value: {
        type: Object,
        default: () => {},
      },
      menuOptions: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        form: {
          id: undefined,
          pid: 0,
          name: undefined,
          icon: undefined,
          menu_type: 'M',
          order: undefined,
          is_frame: '2',
          isCache: '1',
          hidden: '1',
          status: '1',
          show_sidebar: '1',
        },
        rules: {
          name: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
          order: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
          path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
        },
      };
    },
    methods: {
      setData(val) {
        this.form = val;
        this.getOptions(this.form.menu_type);
      },
      getOptions(menu_type) {
        // listMenu({ type: "tree", menu_type }).then((res) => {
        //   this.menuOptions = [];
        //   const menu = { id: 0, name: "主菜单", children: [] };
        //   res.data.forEach((element) => {
        //     element.name = element.meta.title;
        //   });
        //   menu.children = this.handleTree(res.data, "id", "pid");
        //   this.menuOptions.push(menu);
        // });
      },
      normalizer(node) {
        if (node.children && !node.children.length) {
          delete node.children;
        }
        return {
          id: node.id,
          label: node.name,
          children: node.children,
        };
      },
      // 选择图标
      selected(name) {
        this.form.icon = name;
      },
    },
    created() {
      this.form = this.value;
    },
    watch: {
      form: {
        handler(val) {
          this.$emit('input', val);
        },
        deep: true,
      },
      value: {
        handler(val) {
          this.form = val;
        },
        deep: true,
      },
    },
  };
</script>
