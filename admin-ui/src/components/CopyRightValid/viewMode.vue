<template>
  <BaseDrawer :visible.sync="visible" title="版权校正" size="50%" @close="onClose">
    <el-card v-loading="loading" shadow="never">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="剧集名称">{{ showName }}</el-descriptions-item>
        <el-descriptions-item label="内容类型">
          <el-tag>
            {{ copyright_content_mapper[model.content_type] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版权来源">
          <el-tag>{{ COPYRIGHT_ORIGIN_MAPPER[model.origin] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="授权方">
          <el-tag v-if="model.origin_type">
            {{ AUTHORIZER_TYPE_MAPPER[model.origin_type] }}
          </el-tag>
          <span v-else>--</span>
        </el-descriptions-item>
        <el-descriptions-item label="版权系统编码">{{ model.uid }}</el-descriptions-item>
        <el-descriptions-item label="版权名称">{{ model.name }}</el-descriptions-item>
        <el-descriptions-item label="作者笔名">{{ model.author }}</el-descriptions-item>
        <el-descriptions-item label="版权来源证明">
          <template v-if="visible && model.file.length > 0">
            <UploadFile
              ref="UploadFileRef"
              :show_upload="false"
              :file_list.sync="model.file"
              align="left"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled
            >
              <template #tip> 支持：jpg、png、jpeg、pdf格式</template>
            </UploadFile>
          </template>
          <span v-else>--</span>
        </el-descriptions-item>
        <el-descriptions-item label="版权终止日期">{{ model.end_date }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <template v-if="!view" #footer>
      <el-button @click="submitDrawer('refuse')">拒绝</el-button>
      <el-button @click="submitDrawer('accept')" type="primary">接受</el-button>
    </template>
    <template v-else #footer>
      <el-button type="primary" @click="onClose">关闭</el-button>
    </template>

    <BaseDialog :visible.sync="disalogVisible" width="400px" title="温馨提示">
      <div style="line-height: 30px">
        <p v-show="sceondDialogBtnType == 'accept'">{{
          `如果您对平台校正的版权信息确认无误，请您点击“继续接受校正”按钮，该操作将更新《${
            showName || '--'
          }》剧集关联的版权信息。`
        }}</p>
        <p v-show="sceondDialogBtnType == 'refuse'">{{
          `尊敬的承制方您好，如您对平台校正的版权信息有疑问，可联系商务或者客服同学进行沟通，如您直接拒接平台对《${
            showName || '--'
          }》关联的版权校正，您的剧集《${
            showName || '--'
          }》有被下架的风险，同时会影响到您的结算收入，请您谨慎操作！`
        }}</p>
      </div>
      <template slot="footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button
          v-show="sceondDialogBtnType == 'accept'"
          type="primary"
          :loading="secondDialogLoading"
          @click="submitDialog('accept')"
          >继续接受校正</el-button
        >
        <el-button
          v-show="sceondDialogBtnType == 'refuse'"
          type="primary"
          :loading="secondDialogLoading"
          @click="submitDialog('refuse')"
          >拒绝校正</el-button
        >
      </template>
    </BaseDialog>
  </BaseDrawer>
</template>

<script>
  import { contentTypeList } from '@/api/copyrightCenter/management/index.js';
  import { postAdjustApproval } from '@/api/copyrightCenter/drama/validLog.js';
  import BaseDrawer from '@/components/BaseDrawer/index.vue';
  import UploadFile from '@/components/Upload/v3UploadFile/uploadFile.vue';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import { mapperToOptions, objectToMapper, removeObjectEmpty } from '@/utils/tools';
  import { AUTHORIZER_TYPE_MAPPER, COPYRIGHT_ORIGIN_MAPPER } from '@/utils/mappers/copyright';
  import { def as authorizeDef } from '@/api/creatorPlatform/authorize/copyrightManagement/index.js';
  import { def as manageDef } from '@/api/copyrightCenter/management/index.js';
  export default {
    name: 'authValidView',
    props: {
      view: {
        type: Boolean,
        default: false,
      },
    },
    components: {
      BaseDrawer,
      UploadFile,
      BaseDialog,
    },
    data() {
      return {
        AUTHORIZER_TYPE_MAPPER,
        COPYRIGHT_ORIGIN_MAPPER,
        visible: false,
        loading: false,
        disalogVisible: false,
        currentRow: {},
        row_id: null,
        model: {
          copyright_id: null,
          content_type: null,
          origin: 2,
          origin_type: 'txg',
          uid: null,
          name: null,
          author: null,
          file: [],
          end_date: null,
        },
        copyright_content_mapper: {},
      };
    },
    methods: {
      open(row) {
        this.visible = true;
        this.currentRow = row;
        this.row_id = row.id;
        this.collection_id = row.id;
        this.queryContentType();
        this.queryDef();
        this.showName = row.showName;
      },

      onClose() {
        this.visible = false;
        this.currentRow = {};
        this.model = this.$options.data().model;
      },

      queryDef() {
        this.loading = true;
        let func = this.$route.name == 'accountDrama' ? authorizeDef : manageDef;
        func({ id: this.currentRow.copyright_id })
          .then((res) => {
            if (res.code == 0) {
              this.currentRow = res.data;
              Object.keys(this.model).forEach((el) => {
                this.model[el] = res.data[el];
              });
            }
          })
          .catch((error) => {
            this.$notify.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
      },

      queryContentType() {
        contentTypeList()
          .then((res) => {
            if (res && res.code === 0) {
              this.copyright_content_opts = res.data.map((it) => {
                return { label: it?.label || it?.name, value: it?.value || it?.id };
              });
              this.copyright_content_mapper = objectToMapper(this.copyright_content_opts);
            } else {
              throw res;
            }
          })
          .catch((err) => {
            this.$notify.error(err?.message || err);
          });
      },

      closeDialog() {
        this.disalogVisible = false;
      },

      submitDrawer(type) {
        let params = {
          ids: [this.row_id],
        };
        switch (type) {
          case 'accept':
            params.verify_status = 3;
            postAdjustApproval(params)
              .then((res) => {
                if (res.code == 0) {
                  this.$notify.success('操作成功');
                }
              })
              .catch((error) => {
                this.$notify.error(error || '操作失败');
              })
              .finally(() => {
                this.dialogVisible = false;
                this.visible = false;
                this.$emit('refresh');
              });
            break;
          case 'refuse':
            this.$prompt('请输入拒绝原因', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
            }).then(({ value }) => {
              params.verify_status = 4;
              params.verify_suggest = value;
              postAdjustApproval(params)
                .then((res) => {
                  if (res.code == 0) {
                    this.$notify.success('操作成功');
                  }
                })
                .catch((error) => {
                  this.$notify.error(error || '操作失败');
                })
                .finally(() => {
                  this.dialogVisible = false;
                  this.visible = false;
                  this.$emit('refresh');
                });
            });
            break;
        }
      },
    },
  };
</script>

<style lang="scss" scoped></style>
