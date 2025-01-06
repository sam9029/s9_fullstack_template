var express = require('express');
var router = express.Router();
const controller = require('../../controller/marking/user');


router.get('/info', controller.info);
router.get('/router', controller.router);
router.get('/list', controller.list); //账户列表
router.get('/def', controller.def); //获取单条路由详情
router.post('/add', controller.add);
router.post('/edit', controller.edit); //修改
router.post('/del', controller.del); //删除
router.get('/perms_mapper', controller.permsMapper);//权限标识mapper
router.get('/upper_user', controller.upperUser); //直属上级下拉
router.get('/role_auth_tree', controller.roleAuthTree); //获取多角色菜单权限、数据权限
router.get('/koc_tree', controller.kocTree);//koc商务树形
router.get('/sub_user', controller.subUser); //下级下拉
router.get('/down_list', controller.downList); //账户列表
router.get('/blog_leader', controller.blogLeader); //博主对接人
router.get('/role_user', controller.roleUser); //角色分组下拉
router.post('/update_bank_info', controller.updateBankInfo); // 修改银行卡信息（投顾 or 博主)
router.post('/update_password', controller.updatePassword); // 修改密码
router.post('/avatar', controller.avatar); // 修改、设置头像
router.post('/set_openid', controller.setOpenId); // 修改、设置头像
router.post('/fingerprint', controller.fingerprint); //收集浏览器指纹

exports.router = router; 