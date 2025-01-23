import { APP_TITLE } from '@/utils/config/constants.js';

export const initDefaultUploadConfig = () => ({
  // 存储云厂商
  site: 'WANGSU',
  // 存储桶BUCKET
  bucket: 'duolai-img',
  // 存储文件夹
  folder: `${APP_TITLE.toLowerCase()}/public`,
  // 文件上传并发数量,
});

export const SITE_MAPPER = {
  WANGSU: '网宿云',
  ALIYUN: '阿里云',
};

export const BUCKET_MAPPER_FOR_WANGSU = {
  'duolai-img': 'duolai-img', // 须签名访问
};

export const BUCKET_MAPPER_FOR_ALIYUN = {
  'koc-img': 'koc-img', // 可公共访问
  'koc-material': 'koc-material', // 须签名访问
  'duolai-img': 'duolai-img', // 须签名访问
};
