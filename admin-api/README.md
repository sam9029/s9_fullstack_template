<a name="E77HA"></a>
# 项目运行及发版
<a name="j6VHz"></a>
## 运行
1、npm install--registry=https://registry.npm.taobao.org <br />2、npm run dev
<a name="cWTKh"></a>
## 发版
1、测试环境<br />make release-test<br />docker pull registry.cn-beijing.aliyuncs.com/yoboo/koc-task-node-api:test<br />systemctl restart jy-koc-task-node-api-test.service<br />2、正式环境<br />make release<br />docker pull registry.cn-beijing.aliyuncs.com/yoboo/koc-task-node-api:latest<br />systemctl restart jy-koc-task-node-api.service
<a name="rbXI0"></a>
# API注意事项
1、多表操作一定使用事务，敏感操作需要加入操作日志（事务方法已写入公共），示例如下：
```javascript
const { knexTransaction } = require('../../utils/tools')
let data = await knexTransaction(async (trx) => {
       let back_id = (await trx(AUTOMATIC_RULE).insert(newData))[0]
       await insertLog(trx, getLogData(back_id, 2054, newData, userInfo))
       return back_id
})
return { code: 0, data }
```
2、每日定时任务需要写到index.js 同级的production.js
```javascript
const schedule = require('node-schedule');
function scheduleJobs() {
    for (let time = 0; time < 24; time++) {
        if (time % 2 == 0) {
            console.log(`已创建定时任务，时间：每天${time}点`);
            schedule.scheduleJob(`0 0 ${time} * * *`, () => { //每两个小时创建定时任务
                console.log('scheduleCronstyle:' + new Date());
            })
        }
    }
}
exports.production = () => {
    if (process.env.NODE_ENV != "production") {
        scheduleJobs()
    }
}
```
服务端支持抛出自定义code错误
js 示例
  return Promise.reject({ code: 401, message: '暂无权限！' })
3、api查询接口需要调用 public/permission的getPermission方法校验数据权限，前端传对应的interface_id参数
<a name="AwPow"></a>
# 公共接口
<a name="GOIEA"></a>
## 登录注册接口
<a name="LtrpF"></a>
### 1、注册
[http://localhost:1024/dev-api/login/register](http://localhost:1024/dev-api/login/register)<br />POST
```json
{
    "telephone": 17396983034,
    "password": "159357..",
    "captcha_code": "",
    "sms_id": "",
    "phone_code": "",
    "login_code": "",
    "encryptedData": "",
    "iv": "",
    "uid": "",
    "avatar": "",
    "gender": "",
    "name": ""
}
```
<a name="e6G2C"></a>
### 2、登录
[http://localhost:1024/dev-api/login/login](http://localhost:1024/dev-api/login/login)<br />POST
```json
{
    "email": 17396983034,
    "password": "159357..",
    "captcha_code": "",
    "phone_code": "",
    "login_code": "",
    "encryptedData": "",
    "iv": ""
}
```
<a name="cihx2"></a>
## 获取/检测银行卡信息
[http://localhost:1024/dev-api/public/bank_info?bank_account=6217003800033593478&get_image=true](http://localhost:1024/dev-api/public/bank_info?bank_account=6217003800033593478&get_image=true)<br />GET   （get_image   返回银行图标   true  or false）
```json
{
  "code": 0,
  "data": {
    "bank_account": "6217003800033593478",
    "card_type": "DC",
    "card_type_name": "储蓄卡",
    "bank": "CCB",
    "bank_name": "中国建设银行",
    "bank_image": "https://apimg.alipay.com/combo.png?d=cashier&t=CCB"
  }
}
```
<a name="boBjA"></a>
## 个人银行信息管理
<a name="w49tr"></a>
### 1、获取所有银行信息列表
[http://localhost:1024/dev-api/public/bank/list?interface_id=349](http://localhost:1024/dev-api/public/bank/list?interface_id=349)<br />GET
```json
{
    "code": 0,
    "count": 0,
    "data": {
        "iv": "ab4d72c448a7f78c2bca819aa06abbde",
        "content": "d9b1"
    },
    "page": 1,
    "pagesize": 20
}
```
<a name="HRMcn"></a>
### 2、查询单个人的银行信息（根据优先级排序）
[http://localhost:1024/dev-api/public/bank/def?interface_id=349&account_id=10000008](http://localhost:1024/dev-api/public/bank/def?interface_id=349&account_id=10000008)<br />GET
```json
{
    "code": 0,
    "count": 0,
    "data": {
        "iv": "97ea3f0a633f16eb6b3a2cf997688093",
        "content": "c4a7"
    },
    "limit": 1
}
```
<a name="uG2dI"></a>
### 3、添加银行卡信息
[http://localhost:1024/dev-api/public/bank/add](http://localhost:1024/dev-api/public/bank/add)<br />POST
```json
{
    "account_id": 10000002,
    "bank_account": "1000000210000003",
    "id_card": "1000000210000002",
    "bank_name": "中国银行成都分行",
    "people_name": "段尧",
    "telephone": "1234566777"
}
//后面发送数据修改为加密数据。即body为
{ 
  "iv":"加密向量",
  "content": "加密后的字符串",
}
```
<a name="NYxRf"></a>
### 4、修改银行卡信息
[http://localhost:3012/public/bank/edit](http://localhost:3012/public/bank/edit)<br />POST
```json
{
    "id":2,
    "bank_account": "6217003800033593478",
    "id_card": "1000000210000002",
    "bank_name": "中国银行成都分行",
    "people_name": "段尧",
    "telephone": "1234566777"
}
//后面发送数据修改为加密数据。即body为
{ 
  "iv":"加密向量",
  "content": "加密后的字符串",
}
```
<a name="pGHKq"></a>
### 5、设置银行卡优先级
[http://localhost:3012/public/bank/sort](http://localhost:3012/public/bank/sort)<br />POST
```json
{
    "account_id":10007049,
    "sort": [1,2,4] //内部为排好序的银行卡ID
}
```
<a name="FpjSw"></a>
## 信息收集
[http://localhost/dev-api/login/concat_info](http://localhost/dev-api/login/concat_info)<br />POST
```javascript
{
    "phone": "17396983034",
    "name": "橘颂",
    "remark": "测试录入信息",
    "adress": "北京",
    "industry": "广告",
    "company": "力值科技"
}
```
<a name="eG316"></a>
## 文件上传
[http://localhost/dev-api/public/upload?md5=ce914921fd61220ba0f799a8ae542d47&name=ffmpeg.7z](http://localhost/dev-api/public/upload?md5=ce914921fd61220ba0f799a8ae542d47&name=ffmpeg.7z)<br />POST
```
curl --location 
--request POST 'http://localhost/dev-api/public/upload?md5=xxx&name=ffmpeg.7z' \
--header 'token: c3ffe07004e99cef8d3a6b77f14e13d3' \
--header 'Referer: http://localhost/koc/blogger_platform' \
--header 'Content-Type: application/octet-stream' \
--data-binary '@/C:/Users/EDZ/Downloads/ffmpeg.7z'
```
接口返回
```
{
    "code": 0,
    "data": {
        "identical": true, //false 第一次上传  true 重复上传
        "url": "https://koc-img.domain.cn/8B47B851B8374E259B623DEF1A7374CD.7z"
    }
}
```

<a name="LBZ65"></a>
## 获取账号平台
[http://localhost/dev-api/public/platform?page=1&pagesize=100&keyword=](http://localhost/dev-api/public/platform?page=1&pagesize=100&keyword=)抖音<br />GET
```
{
    "code": 0,
    "count": 1,
    "data": [
        {
            "id": 10001,
            "name": "KOC抖音",
            "icon": null,
            "remark": "测试平台",
            "create_time": "2021-12-20 18:26:40",
            "update_time": "2021-12-23 16:21:05",
            "create_user_id": null,
            "update_user_id": null,
            "oem_id": 0,
            "create_user_name": null
        }
    ],
    "page": 1,
    "pagesize": 100
}
```
<a name="B160b"></a>
## 获取账号品类
[http://localhost/dev-api/public/categroy?page=1&pagesize=100&keyword=](http://localhost/dev-api/public/categroy?page=1&pagesize=100&keyword=)小说<br />GET
```
{
    "code": 0,
    "count": 1,
    "data": [
        {
            "id": 10001,
            "name": "小说",
            "remark": "小说",
            "status": 1,
            "create_time": "2021-12-21 10:47:56",
            "update_time": "2021-12-21 10:47:56",
            "create_user_id": null,
            "update_user_id": null,
            "oem_id": 0,
            "create_user_name": null
        }
    ],
    "page": 1,
    "pagesize": 100
}
```
<a name="ApdlU"></a>
## 获取左侧用户树形
[http://localhost/dev-api/manage/marking/user/koc_tree?interface=16](http://localhost/dev-api/manage/marking/user/koc_tree?interface=16)<br />GET<br />传入当前页面的interface_id，<br />投顾列表传入type=consultant,博主列表传入type=blog
<a name="aDpVL"></a>
# 账户管理
<a name="ds9X3"></a>
## 部门管理
<a name="lCg6S"></a>
### 部门下拉
[http://localhost/dev-api/manage/marking/dept/tree](http://localhost/dev-api/manage/marking/dept/tree)<br />GET

<a name="NnLWD"></a>
### 部门列表
[http://localhost/dev-api/manage/marking/dept/list](http://localhost/dev-api/manage/marking/dept/list)<br />GET

<a name="VSMuH"></a>
### 新增部门
[http://localhost/dev-api/manage/marking/dept/add](http://localhost/dev-api/manage/marking/dept/add)<br />POST<br />{<br />    "dept_name": "测试"<br />}

<a name="UETH8"></a>
### 编辑部门
[http://localhost/dev-api/manage/marking/dept/edit](http://localhost/dev-api/manage/marking/dept/edit)<br />POST<br />{<br />    "id": 131,<br />    "dept_name": "测试",<br />    "remark": "test"<br />}

<a name="SFT9R"></a>
### 删除部门
[http://localhost/dev-api/manage/marking/dept/del](http://localhost/dev-api/manage/marking/dept/del)<br />POST<br />{<br />    "ids": [131]<br />}

<a name="BvZbm"></a>
### 部门详情
[http://localhost/dev-api/manage/marking/dept/def?id=131](http://localhost/dev-api/manage/marking/dept/def?id=131)<br />GET

<a name="u0qPk"></a>
## 角色管理
<br />
<a name="KeUf2"></a>
### 角色下拉
[http://localhost/dev-api/manage/marking/role/tree](http://localhost/dev-api/manage/marking/role/tree)<br />GET

<a name="wtOtN"></a>
### 角色列表
[http://localhost/dev-api/manage/marking/role/list](http://localhost/dev-api/manage/marking/role/list)<br />GET

<a name="fLWZR"></a>
### 新增角色
[http://localhost/dev-api/manage/marking/role/add](http://localhost/dev-api/manage/marking/role/add)<br />POST<br />{<br />    "role_name": "测试",<br />    "auth_router": [1],<br />    "auth_data":[1],<br />    "data_type": 1<br />}

<a name="uF1Di"></a>
### 编辑角色
[http://localhost/dev-api/manage/marking/role/edit](http://localhost:81/dev-api/manage/marking/role/edit)<br />POST<br />{<br />    "id": 135,<br />    "role_name": "测试",<br />    "auth_router": [1,2,3],<br />    "auth_data":[1,1],<br />    "data_type": 1<br />}

<a name="vhpn8"></a>
### 角色详情
[http://localhost/dev-api/manage/marking/role/def?id=135](http://localhost/dev-api/manage/marking/role/def?id=135)<br />GET

<a name="YUYMm"></a>
### 选择上级角色下拉
[http://localhost/dev-api/manage/marking/role/upper?id=1](http://localhost/dev-api/manage/marking/role/upper?id=1)<br />GET

<a name="NcwkA"></a>
## 用户管理
<a name="WBoPe"></a>
### 用户列表
[http://localhost/dev-api/manage/marking/user/list](http://localhost:81/dev-api/manage/marking/user/list)<br />GET

<a name="Gxy5H"></a>
### 新增用户
[http://localhost:81/dev-api/manage/marking/user/add](http://localhost:81/dev-api/manage/marking/user/add)<br />POST<br />{<br />    "name": "测试",<br />    "password": 123456,<br />    "auth_router": [1,2],<br />    "auth_data":[1,1],<br />    "data_type": 1,<br />    "role_ids": [1,2],<br />    "telphone": 123456<br />}<br />name(姓名)、password(密码)、role_ids(角色数组)、telphone(电话号码)必填

<a name="fFRkD"></a>
### 编辑用户
[http://localhost/dev-api/manage/marking/user/edit](http://localhost:81/dev-api/manage/marking/user/edit)<br />POST<br />{<br />    "id": 10006978,<br />    "password":242354325,<br />    "role_ids": [1,3,4],<br />    "auth_router":[1,2,3,4,5]<br />}

<a name="xtaTB"></a>
### 删除用户
[http://localhost/dev-api/manage/marking/user/del](http://localhost:81/dev-api/manage/marking/user/del)<br />POST<br />{<br />    "ids": [10006978]<br />}

<a name="kZldL"></a>
### 用户详情
[http://localhost/dev-api/manage/marking/user/def?id=10006978](http://localhost:81/dev-api/manage/marking/user/def?id=10006978)<br />GET

<a name="le35v"></a>
### 用户信息（登录、路由拦截使用）
[http://localhost/dev-api/manage/marking/user/info](http://localhost/dev-api/manage/marking/user/info)<br />GET

<a name="vuBUQ"></a>
### 用户路由
[http://localhost/dev-api/manage/marking/user/router](http://localhost/dev-api/manage/marking/user/router)<br />GET

<a name="QBP6A"></a>
### 路由标识mapper
[http://localhost/dev-api/manage/marking/user/perms_mapper](http://localhost/dev-api/manage/marking/user/perms_mapper)<br />GET

<a name="vhXzm"></a>
### 直属上级下拉
[http://localhost/dev-api/manage/marking/user/upper_user?role_ids[]=2](http://localhost/dev-api/manage/marking/user/upper_user?role_ids[]=2)<br />GET<br />传角色下拉框的role_ids数组，account_id 当前操作的用户id


<a name="bTHnF"></a>
### 用户下级下拉
[http://localhost/dev-api/manage/marking/user/sub_user?id=10007015&role_id=2](http://localhost/dev-api/manage/marking/user/sub_user?id=10007015&role_id=2)<br />GET<br />id为要查询账户的id，不传id默认查询当前用户下级<br />role_id为限制用户的角色


<a name="cjwUZ"></a>
### 切换角色回显菜单、数据权限
[http://localhost/dev-api/manage/marking/user/role_auth_tree?role_ids[]=4&role_ids[]=2](http://localhost/dev-api/manage/marking/user/role_auth_tree?role_ids[]=4&role_ids[]=2)<br />GET<br />传角色下拉框的role_ids数组

<a name="XOxpZ"></a>
### 用户下拉
[http://localhost/dev-api/manage/marking/user/down_list](http://localhost/dev-api/manage/marking/user/down_list)<br />GET<br />传入data_type=tree 返回树形数据<br />传koc_role=1 获取koc商务+投顾+博主<br />koc_role=2 获取非koc商务用户<br />koc_role=3 获取koc商务

<a name="dobjF"></a>
### 博主对接人
[http://localhost/dev-api/manage/marking/user/blog_leader](http://localhost/dev-api/manage/marking/user/blog_leader)<br />GET<br />type=3 投顾博主(只筛选投顾角色)<br />type=2  直营博主(只筛选koc商务角色)<br />不传type返回以上两种博主对接人

<a name="asThX"></a>
### 人员分角色下拉-审批流管理
[http://localhost/dev-api/manage/marking/user/role_user?koc_role=1](http://localhost/dev-api/manage/marking/user/role_user?koc_role=1)<br />GET<br />仅包含全职员工<br />一个人有多角色时返回两条数据
```
{
    "code": 0,
    "data": [
        {
            "id": 10007056,
            "name": "陈亮",
            "role_id": 149,
            "role_name": "主管"
        },
        {
            "id": 10007052,
            "name": "王虹宇",
            "role_id": 149,
            "role_name": "主管"
        },
        {
            "id": 10007052,
            "name": "王虹宇",
            "role_id": 150,
            "role_name": "组长"
        },
        {
            "id": 10007057,
            "name": "陈娟",
            "role_id": 150,
            "role_name": "组长"
        }
    ]
}
```
传入type=group 时返回分组的结构
```
{
    "code": 0,
    "data": [
        {
            "role_id": 149,
            "role_name": "主管",
            "people": [
                {
                    "id": 10007056,
                    "name": "陈亮"
                },
                {
                    "id": 10007052,
                    "name": "王虹宇"
                }
            ]
        },
        {
            "role_id": 150,
            "role_name": "组长",
            "people": [
                {
                    "id": 10007052,
                    "name": "王虹宇"
                },
                {
                    "id": 10007057,
                    "name": "陈娟"
                }
            ]
        }
    ]
}
```
<a name="LvsuP"></a>
### 修改收款信息
[http://localhost/dev-api/manage/marking/user/update_bank_info](http://localhost/dev-api/manage/marking/user/update_bank_info)
```javascript
{
    "name": "小张",
    "idCard": "1222",
    "bank": "111",
    "bankNo": "222",
    "account_id": 10007049,
    "type": 2  // 投顾 1, 博主 2
}

{
    "code": 0,
    "account_id": 10007049,
    "message": "更新成功"
}
```

<a name="Bhekq"></a>
## 修改密码
[http://localhost/dev-api/manage/marking/user/update_password](http://localhost/dev-api/manage/marking/user/update_password)<br />POST

<a name="kpQKF"></a>
## 机构管理
<a name="bsb0f"></a>
### 机构列表
[http://localhost/dev-api/manage/marking/company/list](http://localhost/dev-api/manage/marking/company/list)<br />GET

<a name="vAcvt"></a>
### 机构下拉
[http://localhost/dev-api/manage/marking/company/down_list](http://localhost/dev-api/manage/marking/company/down_list)<br />GET

<a name="Lt6k7"></a>
### 新增机构
[http://localhost/dev-api/manage/marking/company/add](http://localhost/dev-api/manage/marking/company/add)<br />POST<br />{<br />    "name": "测试",<br />    "company": "测试公司",<br />    "auth_router": [1,2,3],<br />    "password": 123456<br />}

<a name="TOWE6"></a>
### 编辑机构
[http://localhost/dev-api/manage/marking/company/edit](http://localhost/dev-api/manage/marking/company/edit)<br />POST<br />{<br />    "id": 8,<br />    "name": "测试1",<br />    "company": "测试公司",<br />    "auth_router": [1,2,3]<br />}

<a name="PCLIZ"></a>
### 删除机构
[http://localhost/dev-api/manage/marking/company/del](http://localhost/dev-api/manage/marking/company/del)<br />POST<br />{<br />    "ids": [8]<br />}

<a name="PKr7I"></a>
### 机构详情
[http://localhost/dev-api/manage/marking/company/def?id=8](http://localhost/dev-api/manage/marking/company/def?id=8)<br />GET


<a name="pQ9Bo"></a>
## 菜单管理
<a name="shUeH"></a>
### 菜单列表
[http://localhost/dev-api/manage/marking/router/list](http://localhost/dev-api/manage/marking/router/list)<br />GET

<a name="DC26O"></a>
### 新增菜单
[http://localhost/dev-api/manage/marking/router/add](http://localhost/dev-api/manage/marking/router/add)<br />POST

<a name="oK3NZ"></a>
### 编辑菜单
[http://localhost/dev-api/manage/marking/router/edit](http://localhost/dev-api/manage/marking/router/edit)<br />POST

<a name="dCR7W"></a>
### 删除菜单
[http://localhost/dev-api/manage/marking/router/del](http://localhost/dev-api/manage/marking/router/del)<br />POST

<a name="mdFCy"></a>
### 菜单详情
[http://localhost/dev-api/manage/marking/router/def?id=8](http://localhost/dev-api/manage/marking/router/def?id=8)<br />GET

<a name="M5kiA"></a>
### 菜单树形
[http://localhost/dev-api/manage/marking/router/tree](http://localhost/dev-api/manage/marking/router/tree)<br />GET
<a name="WLD2Z"></a>
# 推广
<a name="FXTvo"></a>
## 待审核词库
<a name="tsXHv"></a>
### 新增
[http://localhost/dev-api/manage/popularize/unverified_word/add](http://localhost/dev-api/manage/popularize/unverified_word/add)<br />method：POST
```javascript
body：
[{
    "keyword": "关键词000007",
    "content": "https://www.text.com",
    "advertiser_type": 1,
  	"book_name": "天龙八部" // QQ阅读必填
}]

return：
{
    "code": 0,
    "data": [
        20000096
    ],
    "message": "添加成功"
}
```
<a name="DcnbJ"></a>
### 列表
[http://localhost/dev-api/manage/popularize/unverified_word/list?advertiser_type=1&create_user_id=10000001&keyword=07&pagesize=20&count=2&page=1&status=1&start_date=2022-01-07&end_date=2022-01-07](http://localhost/dev-api/manage/popularize/unverified_word/list?advertiser_type=1&create_user_id=10000001&keyword=07&pagesize=20&count=2&page=1&status=1&start_date=2022-01-07&end_date=2022-01-07)&advertiser_type=1<br />GET
```javascript
require: {
  advertiser_type: 1;
}

{
    "code": 0,
    "data": [
        {
            "id": 20000097,
            "advertiser_type": 3,
            "keyword": "乔峰吃饭",
            "content": "https://www.tex.com",
            "create_user_id": 10000001,
            "verify_status": 4,
            "create_time": "2022-01-07 16:28:02",
            "verify_time": null,
            "verify_feedback_time": null,
            "verify_suggest": null,
            "status": 1,
            "content_type": null,
            "book_name": "天龙八部",
            "create_user_role_name": "超级管理员",
            "create_user_name": "超级管理员"
        }
    ],
    "page": 1,
    "pagesize": 20,
    "count": 1
}
```
<a name="o53Bf"></a>
### 提词人名单
[http://localhost/dev-api/manage/popularize/unverified_word/user?advertiser_type=1](http://localhost/dev-api/manage/popularize/unverified_word/user?advertiser_type=1)<br />GET
```javascript
{
    "code": 0,
    "data": [
        {
            "create_user_id": 10000001,
            "name": "超级管理员"
        },
        {
            "create_user_id": 10006973,
            "name": null
        },
        {
            "create_user_id": 10007016,
            "name": "投顾01"
        }
    ]
}
```
<a name="QpADN"></a>
### 详情
[http://localhost/dev-api/manage/popularize/unverified_word/def?id=20000000](http://localhost/dev-api/manage/popularize/unverified_word/def?id=20000000)<br />GET
```javascript
{
    "code": 0,
    "data": [
        {
            "keyword": "关键词111111",
            "content": "https://www.baidu.com",
            "create_user_id": 10000001,
            "verify_status": 2,
            "create_time": "2021-12-23 14:54:43",
            "verify_time": null,
            "verify_feedback_time": null,
            "verify_suggest": null,
            "book_name": null
        }
    ]
}
```
<a name="XDwWr"></a>
### 更新
[http://localhost/dev-api/manage/popularize/unverified_word/update](http://localhost/dev-api/manage/popularize/unverified_word/update)<br />POST
```javascript
body：{
    "keyword": "乔峰吃饭",
    "content": "https://www.tex.com",
    "advertiser_type": 3,
    "id": 20000097,
    "book_name":"天龙八部" // QQ阅读必填
}
return： {
    "code": 0,
    "data": 20000097,
    "message": "更新成功"
}
```

<a name="Vt4qs"></a>
### 修改关键词状态
[http://localhost/dev-api/manage/popularize/unverified_word/delete](http://localhost/dev-api/manage/popularize/unverified_word/delete)<br />POST
```javascript
body: {
    "advertiser_type": 1,
    "ids": [
        20000101
    ],
    "status": 1
}

return: {
    "code": 0,
    "data": [
        20000101
    ],
    "message": "更新成功"
}
```

<a name="Ta33b"></a>
### 批量导入关键词
[http://localhost/dev-api/manage/popularize/unverified_word/batch_add](http://localhost/dev-api/manage/popularize/unverified_word/batch_add)<br />POST
```javascript
body：{
    "url": "https://koc-img.domain.cn/EA6A5921D1994A858D111784578CA9D9.xlsx",
    "advertiser_id": 1
}


```

<a name="P1zZF"></a>
### 批量导入审核结果
[http://localhost/dev-api/manage/popularize/unverified_word/batch_update](http://localhost/dev-api/manage/popularize/unverified_word/batch_update)<br />POST
```javascript
body: {
    "url": "https://koc-img.domain.cn/A39851CE647542008641BB04D2268F97.xlsx",
    "advertiser_type": 1
}

return: {
    "code": 0,
    "message": "更新成功",
    "data": [
        20000087,
        20000088,
        20000089
    ]
}
```

<a name="yrLb0"></a>
## 通用词库
<a name="lhU0z"></a>
### 列表
[http://localhost/dev-api/manage/popularize/common_word/list](http://localhost/dev-api/manage/popularize/common_word/list)<br />GET<br />搜索条件：<br />来源source： 新关键词 new，发布过期词 overtime<br />通用词确定时间distribute_date_range（数组）：[开始日期，结束日期]<br />有效状态status<br />广告主类型advertiser_type：1：知乎，2：书旗，3：QQ阅读（默认知乎）<br />关键词 keyword
```
{
    "code": 0,
    "count": 5,
    "data": [
        {
            "id": 20000011,
            "keyword": "生了只小青龙2",
            "advertiser_type": 1,
            "content": "https://www.zhihu.com/market/paid_column/1350774263411064832/section/1403301555941011456",
            "content_type": 1,
            "create_user_id": 10000001,
            "create_time": "2021-12-24 17:06:30",
            "create_date": "2021-12-24",
            "update_time": "2021-12-30 09:45:30",
            "update_user_id": null,
            "verify_time": null,
            "verify_status": 2,
            "verify_suggest": null,
            "verify_feedback_time": null, //词审核反馈时间
            "distribute_time": "2021-12-30 04:00:00", //通用词确定时间
            "owner_user_id": 10000001,
            "status": 1,
            "configure_status": 1,
            "configure_feedback_time": null, //配置反馈时间
            "period": 4,
            "keyword_type": 2,
            "oem_id": 1,
            "feedback_deadline_date": null, //本期发布截止日
            "create_user_name": "超级管理员",
            "owner_user_name": "超级管理员",
            "create_user_role_name": [
                "投顾",
                "超级管理员"
            ],
            "owner_user_role_name": [
                "投顾",
                "超级管理员"
            ]
        },
}
```
<a name="ZNqY2"></a>
### 领取
同待发布词库的分配接口

<a name="BE4DY"></a>
### 删除/恢复
[http://localhost/dev-api/manage/popularize/common_word/update_status](http://localhost/dev-api/manage/popularize/common_word/update_status)<br />POST<br />{<br />    "status": 1, <br />    "ids": [20000011],<br />    "advertiser_type": 1<br />}
<a name="pU4LO"></a>
## 待发布词库
<a name="e5RoE"></a>
### 列表
[http://localhost/dev-api/manage/popularize/unpublish_word/list?advertiser_type=1&distribute_date_range[]=2021-12-25&distribute_date_range[]=2021-12-25](http://localhost/dev-api/manage/popularize/unpublish_word/list?advertiser_type=1&distribute_date_range[]=2021-12-25&distribute_date_range[]=2021-12-25)<br />GET
```
{
    "code": 0,
    "count": 1,
    "data": [
        {
            "id": 20000001,
            "keyword": "关键词2",
            "content": "内容2",
            "create_user_id": 10000001,
            "verify_status": 2,
            "verify_suggest": null,
            "verify_feedback_time": "2021-12-25 14:41:54",
            "create_time": "2021-12-23 18:08:07",
            "distribute_time": "2021-12-25 14:27:54",
            "owner_user_id": 10000001,
            "configure_status": 1,
            "period": 0,
            "keyword_type": 1,
            "feedback_date": null,
            "feedback_num": 0,
            "create_user_name": "超级管理员",
            "owner_user_name": "超级管理员",
            "create_user_role_name": [
                "博主",
                "投顾",
                "超级管理员"
            ],
            "owner_user_role_name": [
                "博主",
                "投顾",
                "超级管理员"
            ]
        }
    ],
    "page": 1,
    "pagesize": 20
}
```
<a name="o4z1r"></a>
### 分配关键词
[http://localhost/dev-api/manage/popularize/unpublish_word/distribute](http://localhost/dev-api/manage/popularize/unpublish_word/distribute)<br />POST<br />请求参数：
```
{
    "owner_user_id": 10000001,
    "keyword_ids": [
        20000000,
        20000001,
        20000003,
        20000004,
        20000009,
        20000010,
        20000011,
        20000012,
        20000013
    ]
}
```
返回数据
```
{
    "code": 0,
    "data": [
        20000001,
        20000003
    ],
    "fails": [
        20000000,
        20000004,
        20000009,
        20000010,
        20000011,
        20000012,
        20000013
    ]
}
```
<a name="J2CQv"></a>
### 关键词发布反馈
[http://localhost/dev-api/manage/popularize/unpublish_word/feedback](http://localhost/dev-api/manage/popularize/unpublish_word/feedback)<br />POST<br />请求数据及返回数据：
```
{
    "owner_user_id": 10000001,
    "keyword_id": 20000003,
    "period": 2,
    "configure_status": 2,
    "content_type": 2,
    "category_id": 10001,
    "details": [
        {
            "opus_type": 1,
            "opus_url": "https://knexjs.org/#-whereNotNull",
            "platform_account_id": 10,
            "platform_id": 10001
        },
        {
            "opus_type": 1,
            "opus_url": "https://knexjs.org/#Builder-",
            "platform_account_id": 10,
            "platform_id": 10001
        }
    ]
}

{
    "code": 0,
    "data": [ //返回创建成功的id
        30000016,
        30000017
    ]
}
```
<a name="rrukV"></a>
### 通用词规则创建
[http://localhost/dev-api/public/automatic_rule/add](http://localhost/dev-api/public/automatic_rule/add)<br />POST<br />请求参数及返回参数：
```javascript
//请求参数：
{
    "name": "测试执行规则",
    "advertiser_id": 3,
    "operation_object": 2,
    "operation_time": [2,4,6,8,10],
    "send_message": 2,
    "send_repeat": 1,
    "operation": 2,
    "rlues": [{
  							days: Number,//天数
  							condition: String, // >  >=
  							type: String // APPROVED_UNDISTRIBUTE DISTRIBUTED_UNPUBLISH EXPIRED_UNREPUBLISHED
						}]
}
//返回参数：
{
    "code": 0,
    "data": 6
}
```
<a name="UlfVI"></a>
### 通用词规则列表
[http://localhost/dev-api/public/automatic_rule/list](http://localhost/dev-api/public/automatic_rule/list)<br />GET
```javascript
{
    "code": 0,
    "count": 1,
    "data": [
        {
            "id": 9,
            "name": "知乎-待发布-规则",
            "advertiser_id": 1,
            "operation_object": 1,
            "status": 1,
            "rules": [
                {
                    "days": 14,
                    "type": "APPROVED_UNDISTRIBUTE",
                    "condition": ">="
                },
                {
                    "days": 1,
                    "type": "DISTRIBUTED_UNPUBLISH",
                    "condition": ">="
                }
            ],
            "operation": 1,
            "operation_time": [
                4,
                10,
                12
            ],
            "send_message": 1,
            "send_repeat": 2,
            "oem_id": 1,
            "create_time": "2021-12-28 18:34:14",
            "create_user_id": 10000001,
            "update_time": "2021-12-29 10:36:27",
            "update_user_id": 10000001,
            "create_user_name": "超级管理员"
        }
    ],
    "page": 1,
    "pagesize": 20
}
```
<a name="HyDIG"></a>
### 通用词规则修改
[http://localhost/dev-api/public/automatic_rule/save](http://localhost/dev-api/public/automatic_rule/save) <br />POST
```javascript
{
    "id":9,
    "name": "知乎-待发布-规则修改",
    "advertiser_id": 1,
    "operation_object": 1,
    "send_message": 1,
    "send_repeat": 2
}

{
    "code": 0,
    "data": [
        9
    ]
}
```
<a name="xevoS"></a>
### 批量导入作品链接
[http://localhost/dev-api/manage/popularize/unpublish_word/feedback_import](http://localhost/dev-api/manage/popularize/unpublish_word/feedback_import)<br />POST
```javascript
//请求参数
{
    "url": "https://koc-img.domain.cn/8DBD193FA38E45498C2F8C67B037E2E4.xlsx",
    "advertiser_type": 1
}
//返回参数
{
    "code": 0,
    "data": [],
    "unmatch_data": [
        {
            "关键词": "生了只小青龙1",
            "媒体平台": "KOC抖音",
            "平台账户": 290650257,
            "作品链接": "https://www.baidu.com/1",
            "reason": "作品链接重复！"
        },
        {
            "关键词": "生了只小青龙1",
            "媒体平台": "KOC抖音",
            "平台账户": 290650257,
            "作品链接": "https://www.baidu.com/1",
            "reason": "作品链接重复！"
        },
        {
            "关键词": "生了只小青龙1",
            "媒体平台": "KOC抖音",
            "平台账户": 290650257,
            "作品链接": "https://www.baidu.com/1",
            "reason": "作品链接重复！"
        },
        {
            "关键词": "生了只小青龙1",
            "媒体平台": "KOC抖音",
            "平台账户": 290650257,
            "作品链接": "https://www.baidu.com/1",
            "reason": "作品链接重复！"
        },
        {
            "关键词": "生了只小青龙1",
            "媒体平台": "KOC抖音",
            "平台账户": 290650257,
            "作品链接": "https://www.baidu.com/1",
            "reason": "作品链接重复！"
        }
    ]
}
```
<a name="mIs9R"></a>
## 总词库
<a name="HknT4"></a>
### 列表
[http://localhost/dev-api/manage/popularize/total_keyword/list?advertiser_type=1](http://localhost/dev-api/manage/popularize/total_keyword/list?advertiser_type=1)<br />GET
```javascript
{
            "id": 20000001,
            "keyword": "关键词2",
            "advertiser_type": 1,
            "content": "https://www.baidu.com",
            "content_type": null,
            "create_user_id": 10000001,
            "create_time": "2021-12-23 18:08:07",
            "create_date": "2021-12-25",
            "update_time": "2021-12-30 09:45:33",
            "update_user_id": null,
            "verify_time": "2021-12-25 13:41:34",
            "verify_status": 2,
            "verify_suggest": null,
            "verify_feedback_time": "2021-12-25 14:41:54",
            "distribute_time": null,
            "owner_user_id": 10000001,
            "status": 1,
            "configure_status": 1,
            "configure_feedback_time": null, //配置反馈时间
            "period": 5,//总期次
            "keyword_type": 2,
            "oem_id": 1,
            "min_feedback_date": null,//本期发布起始日
            "feedback_deadline_date": null,//本期发布截止日
            "effective_feedback_num": 0,//有效发布量
            "feedback_num": 0,//总发布量
            "create_user_name": "超级管理员",
            "owner_user_name": "超级管理员",
            "create_user_role_name": [
                "投顾",
                "超级管理员"
            ],
            "owner_user_role_name": [
                "投顾",
                "超级管理员"
            ]
        },
```
<a name="vait7"></a>
## 公共接口
<a name="dWFZJ"></a>
### 禁投作品
<a name="KLLlm"></a>
#### 1、新增禁投书籍
[http://localhost:1024/dev-api/manage/popularize/public/book/add](http://localhost:1024/dev-api/manage/popularize/public/book/add)<br />POST
```json
{
    "advertiser_type": 4,
    "data": [
        {
            "book_name": "测试书籍4",
            "start_date": "2022-03-02"
        },
        {
            "book_name": "测试书籍3"
        }
    ]
}
```
<a name="pHc76"></a>
#### 2、禁投书籍列表
[http://localhost:1024/dev-api/manage/popularize/public/book/list?advertiser_type=4&pagesize=20&page=1&status=1](http://localhost:1024/dev-api/manage/popularize/public/book/list?advertiser_type=4&pagesize=20&page=1&status=1)<br />GET
<a name="aIKvt"></a>
#### 3、导入禁投书籍
[http://localhost:1024/dev-api/manage/popularize/public/book/import](http://localhost:1024/dev-api/manage/popularize/public/book/import)<br />POST
```json
{
    "advertiser_type": 4,
    "url": "https://koc-img.domain.cn/EA6A5921D1994A858D111784578CA9D9.xlsx"
}
```
<a name="Gt651"></a>
#### 4、检查书籍是否禁投
[http://localhost:1024/dev-api/manage/popularize/public/book/check](http://localhost:1024/dev-api/manage/popularize/public/book/check)<br />POST
```json
{
    "advertiser_type": 4,
    "book_name": "测试书籍"
}
```
<a name="Vcxta"></a>
#### 5、批量修改禁投书籍
[http://localhost:3012/manage/popularize/public/book/edit](http://localhost:3012/manage/popularize/public/book/edit)<br />POST
```json
{
    "status": 2,
    "ids": [11,12,13] //为禁投书籍的ID
}
```
<a name="VSPms"></a>
### 业务品类
<a name="iheaG"></a>
#### 1、新增业务品类
[http://localhost:1024/dev-api/manage/popularize/public/business_type/add](http://localhost:1024/dev-api/manage/popularize/public/business_type/add)<br />POST
```json
{
    "name": "漫画",
    "advertiser_type": 4,
    "template": 1
}
```
<a name="b5Rak"></a>
#### 2、修改业务品类
[http://localhost:1024/dev-api/manage/popularize/public/business_type/edit](http://localhost:1024/dev-api/manage/popularize/public/business_type/edit)<br />POST
```json
{
    "ids":[1],
    "name": "漫画",
    "advertiser_type": 5,
    "template": 2
}
```
<a name="v4vdM"></a>
#### 3、获取业务品类列表
[http://localhost:1024/dev-api/manage/popularize/public/business_type/list?page=1&pagesize=20](http://localhost:1024/dev-api/manage/popularize/public/business_type/list?page=1&pagesize=20)<br />GET
<a name="ia5KL"></a>
# KOC管理
<a name="R4whM"></a>
## 投顾管理
<a name="iV8rc"></a>
### 新增投顾
[http://localhost/dev-api/manage/koc_manage/consultant/add](http://localhost/dev-api/manage/koc_manage/consultant/add)<br />POST
```javascript
body：[{
    "name": "投顾4-api",
    "telephone":13589890003,
    "password": "01ac8963f7c87f2d4a94a7c59908b923",
    "direct_leader": "100000001",
    "phone_verification": 1
}]
```
```javascript
{
    "code": 0,
    "data": [
        10007052
    ],
    "message": "添加成功"
}
```
<a name="SJijf"></a>
### 列表
[http://localhost/dev-api/manage/koc_manage/consultant/list?page=1&pagesize=20&keyword=](http://localhost/dev-api/manage/koc_manage/consultant/list?page=1&pagesize=20&keyword=)小红&status=1&direct_leader=10007033<br />GET
```javascript
{
    "code": 0,
    "data": [
        {
            "account_id": 10007057,
            "status": 1,
            "create_user_id": 10000001,
            "create_time": "2022-01-07 10:41:32",
            "update_user_id": 10000001,
            "update_time": "2022-01-07 10:46:22",
            "oem_id": 1,
            "applet_link": null,
            "applet_scheme": null,
            "expire_date": null,
            "name": "小红",
            "telephone": "136****0008",
            "phone_verification": 1,
            "direct_leader": 10007033,
            "uid": "AFA5692BF1844E588FA4F01DD1D8D208",
            "direct_leader_name": "投顾组长1",
            "create_user_name": "超级管理员",
            "receipt_name": "",
            "receipt_IDNumber": "",
            "receipt_bank": "",
            "receipt_banck_account": "",
            "bloggerCount": 0,
            "mediaAccountCount": 0
        }
    ],
    "count": 1,
    "page": 1,
    "pagesize": 20
}
```
<a name="KkXTg"></a>
### 更新
[http://localhost/dev-api/manage/koc_manage/consultant/update](http://localhost/dev-api/manage/koc_manage/consultant/update?status=2&account_id=10006982&type=3)<br />POST
```javascript
body: {
    "account_ids": [10006982],
    "type": 3,
    "status": 2,
    "password": '12345'
}

return: {
    "code": 0,
    "data": [
        10006982
    ],
    "message": "修改成功"
}
```

<a name="WIHE9"></a>
### 导入投顾
[http://localhost/dev-api/manage/popularize/consultant/batch_add](http://localhost/dev-api/manage/popularize/consultant/batch_add)<br />POST
```javascript
body: {
    url: "https://koc-img.domain.cn/EA6A5921D1994A858D111784578CA9D9.xlsx"
}
return: {
  code: 0, 
  data: [10007054, 10007055, 10007056, 10007057], 
  message: "添加成功"
}

```

<a name="Y5t5j"></a>
### 详情
[http://localhost/dev-api/manage/koc_manage/consultant/def?account_id=10007057](http://localhost/dev-api/manage/koc_manage/consultant/def?account_id=10007057)<br />GET
```javascript
{
    "code": 0,
    "data": [
        {
            "account_id": 10007057,
            "status": 1,
            "create_user_id": 10000001,
            "create_time": "2022-01-07 10:41:32",
            "update_user_id": 10000001,
            "update_time": "2022-01-07 10:46:22",
            "oem_id": 1,
            "applet_link": null,
            "applet_scheme": null,
            "expire_date": null,
            "name": "小红",
            "telephone": "13600090008",
            "phone_verification": 1,
            "direct_leader": 10007033,
            "uid": "AFA5692BF1844E588FA4F01DD1D8D208",
            "direct_leader_name": "投顾组长1",
            "create_user_name": "超级管理员",
            "receipt_name": "",
            "receipt_IDNumber": "",
            "receipt_bank": "",
            "receipt_banck_account": ""
        }
    ]
}
```
<a name="A7tyW"></a>
### 获取投顾分享链接
[http://localhost/dev-api/manage/koc_manage/consultant/share?account_id=10007036](http://localhost/dev-api/manage/koc_manage/consultant/share?account_id=10007036)<br />GET
```javascript
{
    "code": 0,
    "data": {
        "account_uid": "5C27E0332C5148688C8FB0FB3B2B0155",
        "account_avatar": "https://thirdwx.qlogo.cn/mmopen/vi_32/HAXmljXJiamnALc0RlFV89K9J1zKaUpST1tLuht1eXdTzqeHQ8PkbWh5We9LwkLXpriaqOOuq5EUmMlENSMVCXibQ/132",
        "account_id": 10007036,
        "applet_link": "https://wxaurl.cn/1usLVMQignd",
        "applet_scheme": "weixin://dl/business/?t=wjw7RFW6lyt",
        "expire_date": "2022-05-05",
        "qr_link": "http://koc-ui-test.domain.cn/share?cst=5C27E0332C5148688C8FB0FB3B2B0155"
    }
}
```

<a name="DuRG2"></a>
## 博主管理
<a name="pdPWD"></a>
## 博主平台
<a name="jC1KZ"></a>
### 列表
[http://localhost/dev-api/manage/koc_manage/blogger_platform/list?count=9&page=1&pagesize=20&category=&category_id=&blogger_counterpart_id=&keyword=&status=&platform_id=&push_channel=](http://localhost/dev-api/manage/koc_manage/blogger_platform/list?count=9&page=1&pagesize=20&category=&category_id=&blogger_counterpart_id=&keyword=&status=&platform_id=&push_channel=)<br />GET
```javascript
{
    "code": 0,
    "count": 9,
    "data": [
        {
            "id": 13,
            "blogger_id": 10007027,
            "category_id": 10001,
            "platform_id": 10001,
            "platform_account_id": "159357145",
            "platform_account_name": "我的抖音号",
            "fan_counts": 200,
            "home_page_url": "https://blog.csdn.net/notMine/article/details/103302371",
            "status": 1,
            "oem_id": 1,
            "create_date": "2022-01-04",
            "create_time": "2022-01-04 17:49:45",
            "update_time": "2022-01-04 17:49:45",
            "create_user_id": 10000001,
            "update_user_id": 10000001,
            "blogger_type": 3,
            "blogger_status": 1,
            "blogger_name": "测试博主账号",
            "blogger_counterpart_id": 10000001,
            "platform_name": "KOC抖音",
            "category_name": "小说",
            "create_user_name": "超级管理员",
            "opus_count": 0,
            "word_count": 0,
            "blogger_counterpart_name": "超级管理员"
        }
      ]
}
```
<a name="gbCOU"></a>
### 新增博主平台

[http://localhost/dev-api/manage/koc_manage/blogger_platform/add](http://localhost/dev-api/manage/koc_manage/blogger_platform/add)<br />POST
```javascript
//请求参数
{
    "blogger_id": 10000001,
    "platform_id": 10001,
    "platform_account_id": "61cfcdf000000000210362d4",
    "category_id": 10001,
    "platform_account_name": "测试小红书账号",
    "fan_counts": "200",
    "home_page_url": "https://www.xiaohongshu.com/discovery/item/61cfcdf000000000210362d4"
}
//应答数据
{"code":0,"data":14} //data为创建成功id
```
<a name="vRr8q"></a>
### 获取主页链接个人信息
[http://localhost/dev-api/public/platform_account_info](http://localhost/dev-api/public/platform_account_info)<br />POST
```javascript
//请求参数
{
    "platform_id": 10001,
    "home_page_url": "https://www.xiaohongshu.com/discovery/item/61cfcdf000000000210362d4"
}
//返回数据
{
    "code": 0,
    "data": {
        "platform_account_id": "61cfcdf000000000210362d4",
        "platform_account_name": "",
        "fan_counts": "",
        "avatar": ""
    }
}
```
<a name="LTgjP"></a>
### 修改（删除）博主平台
[http://localhost/dev-api/manage/koc_manage/blogger_platform/save](http://localhost/dev-api/manage/koc_manage/blogger_platform/save)<br />POST
```javascript
//请求参数
{"id":14,"status":2}
//返回数据
{"code":0,"data":[14]}
```
<a name="fl8K5"></a>
### 查询单个博主
[http://localhost/dev-api/manage/koc_manage/blogger_platform/def?id=14](http://localhost/dev-api/manage/koc_manage/blogger_platform/def?id=14)   （id必传）<br />GET
```javascript
//返回数据
{
    "code": 0,
    "data": {
        "id": 14,
        "blogger_id": 10000001,
        "category_id": 10001,
        "platform_id": 10001,
        "platform_account_id": "61cfcdf000000000210362d4",
        "platform_account_name": "测试小红书账号",
        "fan_counts": 200,
        "home_page_url": "https://www.xiaohongshu.com/discovery/item/61cfcdf000000000210362d4",
        "status": 2,
        "oem_id": 1,
        "create_date": "2022-01-07",
        "create_time": "2022-01-07 10:12:48",
        "update_time": "2022-01-07 10:20:36",
        "create_user_id": 10000001,
        "update_user_id": 10000001,
        "blogger_type": 4,
        "blogger_status": 1,
        "blogger_name": "超级管理员",
        "blogger_counterpart_id": null,
        "platform_name": "KOC抖音",
        "category_name": "小说",
        "create_user_name": "超级管理员",
        "blogger_counterpart_name": null
    }
}
```

<a name="q1OmG"></a>
# 工具
<a name="RBHa4"></a>
## 系统配置

<a name="iexvU"></a>
### 平台管理
<a name="gvt0B"></a>
#### 平台列表
[http://localhost/dev-api/manage/tool/system_config/platform/list](http://localhost/dev-api/manage/tool/system_config/platform/list)<br />GET<br />keyword筛选条件

<a name="NRTzB"></a>
#### 新增平台
[http://localhost/dev-api/manage/tool/system_config/platform/add](http://localhost/dev-api/manage/tool/system_config/platform/add)<br />POST<br />name: 平台名称<br />icon: 平台图标<br />remark: 备注<br />默认只有超管有权限，不允许重名

<a name="AQvlz"></a>
#### 编辑平台
[http://localhost/dev-api/manage/tool/system_config/platform/edit](http://localhost/dev-api/manage/tool/system_config/platform/edit)<br />POST<br />{<br />    "id": 10006,<br />    "name": "测试平台",<br />    "icon": "1"<br />}<br />默认只有超管有权限，不允许重名

<a name="nB4Np"></a>
#### 删除平台
[http://localhost/dev-api/manage/tool/system_config/platform/del](http://localhost/dev-api/manage/tool/system_config/platform/del)<br />POST<br />{<br />    "ids": [10006]<br />}

<a name="e7Cuz"></a>
#### 平台详情
[http://localhost/dev-api/manage/tool/system_config/platform/def?id=10006](http://localhost/dev-api/manage/tool/system_config/platform/def?id=10006)<br />GET

<a name="J6I4A"></a>
#### 批量更新平台状态
[http://localhost/dev-api/manage/tool/system_config/platform/update_status](http://localhost/dev-api/manage/tool/system_config/platform/update_status)<br />POST<br />{<br />    "ids": [10006],<br />    "status": 1<br />}

<a name="vUAFQ"></a>
### 品类管理
<a name="sSgJA"></a>
#### 品类列表
[http://localhost/dev-api/manage/tool/system_config/category/list](http://localhost/dev-api/manage/tool/system_config/category/list)<br />GET

<a name="JbfHC"></a>
#### 新增品类
[http://localhost/dev-api/manage/tool/system_config/category/add](http://localhost/dev-api/manage/tool/system_config/category/add)<br />POST<br />name: 品类名称<br />remark: 备注<br />默认只有超管有权限，不允许重名

<a name="XHQKp"></a>
#### 编辑品类
[http://localhost/dev-api/manage/tool/system_config/category/edit](http://localhost/dev-api/manage/tool/system_config/category/edit)<br />POST<br />{<br />    "id": 10006,<br />    "name": "测试平台",<br />    "icon": "1"<br />}<br />默认只有超管有权限，不允许重名

<a name="UCW6y"></a>
#### 删除品类
[http://localhost/dev-api/manage/tool/system_config/category/del](http://localhost/dev-api/manage/tool/system_config/category/del)<br />POST<br />{<br />    "ids": [10006]<br />}

<a name="glTKM"></a>
#### 品类详情
[http://localhost/dev-api/manage/tool/system_config/category/def?id=10006](http://localhost/dev-api/manage/tool/system_config/category/def?id=10006)<br />GET

<a name="JBVOX"></a>
#### 批量更新品类状态
[http://localhost/dev-api/manage/tool/system_config/platform/update_status](http://localhost/dev-api/manage/tool/system_config/platform/update_status)<br />POST<br />{<br />    "ids": [10006],<br />    "status": 1<br />}

<a name="NqyQj"></a>
### 作品周期
<a name="GQflE"></a>
#### 周期列表
[http://localhost/dev-api/manage/tool/system_config/work_period/list](http://localhost/dev-api/manage/tool/system_config/work_period/list)<br />GET

<a name="uGVlY"></a>
#### 周期新增
[http://localhost/dev-api/manage/tool/system_config/work_period/add](http://localhost/dev-api/manage/tool/system_config/work_period/add)<br />POST
```
{
    "name": "测试",
    "advertiser_type": 1,
    "start_date": "2022-02-02",
    "end_date": "2022-03-02",
    "days": 5
}
```

<a name="HjJeh"></a>
#### 周期编辑
[http://localhost/dev-api/manage/tool/system_config/work_period/edit](http://localhost/dev-api/manage/tool/system_config/work_period/edit)<br />POST
```
{
    "id": 6,
    "name": "测试",
    "advertiser_type": 1,
    "start_date": "2022-02-02",
    "end_date": "2022-03-02",
    "days": 5
}
```

<a name="sx1su"></a>
#### 周期删除
[http://localhost/dev-api/manage/tool/system_config/work_period/del](http://localhost/dev-api/manage/tool/system_config/work_period/del)<br />POST
```
{
    "ids": [6]
}
```
<a name="XKwyX"></a>
#### 周期更新状态
[http://localhost/dev-api/manage/tool/system_config/work_period/update_status](http://localhost/dev-api/manage/tool/system_config/work_period/update_status)<br />POST
```
{
    "id": 6,
    "status": 3
}
```
<a name="MDK1Q"></a>
## 审批管理
<a name="U3aEE"></a>
### 审批流列表
[http://localhost/dev-api/manage/tool/approval_process/list](http://localhost/dev-api/manage/tool/approval_process/list)<br />GET<br />启用状态：status 1,2,3  不传status默认返回不包含已删除<br />业务类型： business_category <br />审批流类目： type

<a name="iSHwG"></a>
### 新增审批流
[http://localhost/dev-api/manage/tool/approval_process/add](http://localhost/dev-api/manage/tool/approval_process/add)<br />POST<br />{<br />    "business_category": 1,<br />    "type": 3,<br />    "config": [{"role_id":149,"role_name":"主管","id": 10007056,"name": "陈亮"}]<br />    "remark": "备注"<br />}<br />business_category 业务类别 1:广告主业务 2:KOC业务<br />type 审批流类目 1:商务报价 2:客户结算 3:销项发票 4:政策报备 5:KOC结算 6:KOC付款<br />config审批流配置（数组，按审批次序）<br />remark备注

<a name="PgtiS"></a>
### 编辑审批流
[http://localhost/dev-api/manage/tool/approval_process/edit](http://localhost/dev-api/manage/tool/approval_process/edit)<br />POST<br />{<br />    "id": 1,<br />    "business_category": 2,<br />    "type": 4,<br />    "config": [{"role_id":149,"role_name":"主管","id": 10007056,"name": "陈亮"}]<br />}

<a name="t8Zl1"></a>
### 删除审批流
[http://localhost/dev-api/manage/tool/approval_process/del](http://localhost/dev-api/manage/tool/approval_process/del)<br />POST<br />{<br />    "ids": [1]<br />}

<a name="zted1"></a>
### 审批流详情
[http://localhost/dev-api/manage/tool/approval_process/def?id=1](http://localhost/dev-api/manage/tool/approval_process/def?id=1)<br />GET

<a name="JyGPq"></a>
### 批量编辑审批流状态
[http://localhost/dev-api/manage/tool/approval_process/update_status](http://localhost/dev-api/manage/tool/approval_process/update_status)<br />POST<br />{<br />    "id": 1,<br />    "status": 2<br />}

<a name="IdORc"></a>
# 商务
utils/apiMapper<br />projectList(userInfo,query): 推广项目mapper<br />subjectList(userInfo,query): 公司主体mapper<br />settlementMethodList(userInfo,query): 结算方式mapper<br />settlementParamList(userInfo,query): 结算参数mapper<br />extensionGoalList(userInfo,query): 推广目的mapper<br />deptList(userInfo,query): 部门mapper，传ids筛选部门<br />需要传入userInfo,<br />query 中type = "arr" 返回数组，不传返回对象<br />settlementParamList的query传入advertiser_type筛选项目
<a name="Wn0Iz"></a>
## 广告主商务报价

<a name="icbUW"></a>
### 新增报价全部下拉
[http://localhost/dev-api/manage/business/public/down_list](http://localhost:81/dev-api/manage/business/public/down_list)<br />GET<br />必需要传mapper(数组)字段，填需要查询的mapper类型<br />可传 advertiser_type字段，用于筛选结算参数<br />mapper=["project","subject","method","param","goal"]<br />project：项目产品，subject：公司主体，method：结算方式，param：结算参数，goal：推广目的
```
{
    "code": 0,
    "project": [
        {
            "id": 1,
            "name": "知乎"
        },
        {
            "id": 2,
            "name": "书旗"
        },
        {
            "id": 3,
            "name": "qq阅读"
        }
    ],
    "subject": [
        {
            "id": 1,
            "name": "北京力值科技有限公司"
        }
    ],
    "method": [
        {
            "id": 1,
            "name": "CPA拉新"
        },
        {
            "id": 2,
            "name": "CPA订单"
        },
        {
            "id": 3,
            "name": "CPS分成"
        },
        {
            "id": 4,
            "name": "CPA拉活"
        }
    ],
    "param": [
        {
            "id": 1,
            "name": "免费内容"
        },
        {
            "id": 2,
            "name": "会员内容"
        }
    ]
}
```
<a name="nJGmu"></a>
### 
<a name="YBTSq"></a>
### 商务报价列表
[http://localhost:81/dev-api/manage/business/quotation/list](http://localhost:81/dev-api/manage/business/quotation/list)<br />GET
<a name="Wv8RH"></a>
### 新增商务报价
[http://localhost:81/dev-api/manage/business/quotation/add](http://localhost:81/dev-api/manage/business/quotation/add)<br />POST
```
{
    "advertiser_type": 1, 
    "sale_id": 10007054,
    "quotation_type": 1,
    "company_subject": 1,
    "account_period": 28,
    "effective_start_date": "2022-01-02",
    "extension_goal": [1,2],
    "dept_id": 1,
    "settlement_info": [
        {
            "settlement_method": 1,
            "settlement_param": 3,
            "price": 28
        }
    ],
    "verify_flag": true  //确定并送审，只确定填false或不填
}
```
<a name="bejlT"></a>
### 编辑商务报价
[http://localhost:81/dev-api/manage/business/quotation/edit](http://localhost:81/dev-api/manage/business/quotation/edit)<br />POST
```
{
    "id": 28,
    "advertiser_type": 1,
    "customer_name": "\"resolved\": \"https://registry.nlark.com/accepts/download/accepts-1.3.7.tgz\"",
    "sale_id": 10007056,
    "operation": 1,
    "extension_goal": [
        1
    ],
    "quotation_type": 1,
    "company_subject": 1,
    "account_period": 1,
    "effective_start_date": "2022-05-01",
    "settlement_info": [
        {
            "settlement_method": 1,
            "settlement_param": 1,
            "price": 10
        },
        {
            "settlement_method": 3,
            "settlement_param": 1,
            "price": 10
        }
    ],
    "verify_flag": false
}
```

<a name="vkNhi"></a>
### 更新商务报价状态(删除，恢复)
[http://localhost:81/dev-api/manage/business/quotation/update_status](http://localhost:81/dev-api/manage/business/quotation/update_status)<br />POST
```
{
    "id": 28,
    "status": 1
}
```

<a name="h70sM"></a>
### 查看审批流
[http://localhost:81/dev-api/manage/business/quotation/check_process?id=35](http://localhost:81/dev-api/manage/business/quotation/check_process?id=35)<br />GET<br />approval_process: 审批流信息<br />approval_process_info: 审批记录<br />next_account_id: 当前需要审批的人<br />total_step: 总步骤<br />current_step: 当前步骤<br />total_step = current_step 审批完成

<a name="OlK4H"></a>
### 终止商务报价
[http://localhost:81/dev-api/manage/business/quotation/quote_stop](http://localhost:81/dev-api/manage/business/quotation/quote_stop)<br />POST
```
{
    "id": "37",
    "effective_end_date": "2022-04-30"
}
```

<a name="mej0W"></a>
### 更换负责人
[http://localhost/dev-api/manage/business/quotation/change_manager](http://localhost/dev-api/manage/business/quotation/change_manager)<br />POST
```
{
    "ids": [52,53],
    "manager_id":  10000002
}
```


<a name="S1NII"></a>
### 客户全称下拉
[http://localhost:81/dev-api/manage/business/public/customer_list](http://localhost:81/dev-api/manage/business/public/customer_list)<br />GET
<a name="nnYws"></a>
### 广告主商务报价待审核列表
[http://localhost/dev-api/manage/business/quotation/pending_pproval/list](http://localhost/dev-api/manage/business/quotation/pending_pproval/list)<br />GET
<a name="r4Wh9"></a>
### 广告主商务报价提交审核/审核
[http://localhost/dev-api/manage/business/quotation/pending_pproval/approval](http://localhost/dev-api/manage/business/quotation/pending_pproval/approval)<br />POST
```javascript
{
    "policy_id": 56,
    "verify_type": 1 // verify_type 1 提交审核  2 人员审核
}
{
    "policy_id": 56,
    "verify_type": 2,
    "verify_status":3,
     "verify_suggest":"审核添加附件"
}
```
<a name="gzMN7"></a>
### 推广项目
<a name="pQtMW"></a>
#### 推广项目列表
http://localhost/dev-api/manage/business/public/project/list<br />GET

<a name="TeOF5"></a>
#### 推广项目新增
http://localhost/dev-api/manage/business/public/project/add<br />POST<br />{<br />    "name": "知乎"<br />}

<a name="Xvnte"></a>
#### 推广项目编辑
[http://localhost/dev-api/manage/business/public/project/](http://localhost/dev-api/manage/business/public/project/add)edit<br />POST<br />{<br />    "id": 4,<br />    "name": "测试1"<br />}

<a name="layHN"></a>
#### 推广项目删除
http://localhost:81/dev-api/manage/business/public/project/del<br />POST<br />{<br />    "ids": [4]<br />}

<a name="J41VQ"></a>
#### 推广项目更新状态
http://localhost:81/dev-api/manage/business/public/project/update_status<br />POST<br />{<br />    "ids": [4],<br />    "status": 1<br />}

<a name="yP7Hi"></a>
### 公司主体
<a name="MHPlA"></a>
#### 公司主体列表
http://localhost/dev-api/manage/business/public/subject/list<br />GET

<a name="bmMnb"></a>
#### 公司主体新增
http://localhost/dev-api/manage/business/public/subject/add<br />POST<br />{<br />    "name": "测试"<br />}

<a name="VbWXY"></a>
#### 公司主体编辑
[http://localhost/dev-api/manage/business/public/subject/](http://localhost/dev-api/manage/business/public/project/add)edit<br />POST<br />{<br />    "id": 4,<br />    "name": "测试1"<br />}

<a name="QXEkH"></a>
#### 公司主体删除
http://localhost:81/dev-api/manage/business/public/subject/del<br />POST<br />{<br />    "ids": [4]<br />}

<a name="BQbK8"></a>
#### 公司主体更新状态
http://localhost:81/dev-api/manage/business/public/subject/update_status<br />POST<br />{<br />    "ids": [4],<br />    "status": 1<br />}

<a name="gnIfc"></a>
#### 公司主体简称下拉
[http://localhost/dev-api/manage/business/public/subject/short_down_list](http://localhost/dev-api/manage/business/public/subject/short_down_list)<br />GET

<a name="Fou8r"></a>
### 结算方式
<a name="NfKFV"></a>
#### 结算方式列表
http://localhost/dev-api/manage/business/public/method/list<br />GET

<a name="uPXoj"></a>
#### 结算方式新增
http://localhost/dev-api/manage/business/public/method/add<br />POST<br />{<br />    "name": "测试"<br />}

<a name="AfTJ5"></a>
#### 结算方式编辑
[http://localhost/dev-api/manage/business/public/method/](http://localhost/dev-api/manage/business/public/project/add)edit<br />POST<br />{<br />    "id": 4,<br />    "name": "测试1"<br />}

<a name="QC7lo"></a>
#### 结算方式删除
http://localhost:81/dev-api/manage/business/public/method/del<br />POST<br />{<br />    "ids": [4]<br />}

<a name="AjFl3"></a>
#### 结算方式更新状态
http://localhost:81/dev-api/manage/business/public/method/update_status<br />POST<br />{<br />    "ids": [4],<br />    "status": 1<br />}

<a name="rOIGS"></a>
### 结算参数
<a name="yGx6e"></a>
#### 结算参数列表
http://localhost/dev-api/manage/business/public/param/list<br />GET

<a name="rdwFH"></a>
#### 结算参数新增
http://localhost/dev-api/manage/business/public/param/add<br />POST<br />{<br />    "name": "测试"<br />}

<a name="kpnv4"></a>
#### 结算参数编辑
[http://localhost/dev-api/manage/business/public/param/](http://localhost/dev-api/manage/business/public/project/add)edit<br />POST<br />{<br />    "id": 4,<br />    "name": "测试1"<br />}

<a name="wYlHj"></a>
#### 结算参数删除
http://localhost:81/dev-api/manage/business/public/param/del<br />POST<br />{<br />    "ids": [4]<br />}

<a name="IQKic"></a>
#### 结算参数更新状态
http://localhost:81/dev-api/manage/business/public/param/update_status<br />POST<br />{<br />    "ids": [4],<br />    "status": 1<br />}

<a name="Dngq3"></a>
### 推广目的
<a name="DGpLu"></a>
#### 推广目的列表
http://localhost/dev-api/manage/business/public/goal/list<br />GET

<a name="aKItS"></a>
#### 推广目的新增
http://localhost/dev-api/manage/business/public/goal/add<br />POST<br />{<br />    "name": "测试"<br />}

<a name="cX3GP"></a>
#### 推广目的编辑
[http://localhost/dev-api/manage/business/public/goal/](http://localhost/dev-api/manage/business/public/project/add)edit<br />POST<br />{<br />    "id": 4,<br />    "name": "测试1"<br />}

<a name="k6fEq"></a>
#### 推广目的删除
http://localhost:81/dev-api/manage/business/public/goal/del<br />POST<br />{<br />    "ids": [4]<br />}

<a name="iYHVu"></a>
#### 推广目的更新状态
http://localhost:81/dev-api/manage/business/public/goal/update_status<br />POST<br />{<br />    "ids": [4],<br />    "status": 1<br />}

<a name="tfBAj"></a>
## KOC政策报备

<a name="cBxiI"></a>
### 报价政策
<a name="SRsMW"></a>
#### 新增投顾报价政策
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/add](http://localhost:81/dev-api/manage/business/policy_reporting/policy/add)<br />POST
```
{
    "business_id": 10007049,
    "advertiser_type": 1,
    "operation_type": 1,
    "offer_type": 1,
    "keyword_type": 2,
    "settlement_category": [1],
    "settlement_type": [
        1,
        2,
        3
    ],
    "company": 1,
    "payment_day": 5,
    "effective_start_date": "2021-10-10",
    "effective_end_date": "2021-10-10",
    "remark": "备注",
    "verify_status": 1,
    "verify_suggest": "",
    "status": 1,
    "account_list": [
        {
            "account_id": 10007064,
            "keyword_ids": [
                20000157,
                20000158
            ]
        },
        {
            "account_id": 10007065,
            "keyword_ids": [
                20000159,
                20000160
            ]
        }
    ], //报价对象、关键词集合
    "settlement_list": [
        {
            "settlement_id": 1,
            "content_type": 1,
            "service_price": 10,
            "service_ratio": null,
            "publish_price": 10,
            "publish_ratio": null
        },
        {
            "settlement_id": 1,
            "content_type": 2,
            "service_price": 20,
            "service_ratio": null,
            "publish_price": 20,
            "publish_ratio": null
        },
        {
            "settlement_id": 5,
            "content_type": 1,
            "service_price": null,
            "service_ratio": null,
            "publish_price": 100,
            "publish_ratio": null
        },
        {
            "settlement_id": 3,
            "content_type": 1,
            "service_price": null,
            "service_ratio": 0.1,
            "publish_price": null,
            "publish_ratio": 0.1
        },
        {
            "settlement_id": 3,
            "content_type": 2,
            "service_price": null,
            "service_ratio": 0.2,
            "publish_price": null,
            "publish_ratio": 0.2
        }
    ] // 发布单价集合
}
```
<a name="TN9VF"></a>
#### 投顾政策列表
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/list](http://localhost:81/dev-api/manage/business/policy_reporting/policy/list)<br />GET

<a name="pCLYT"></a>
#### 投顾政策编辑
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/update](http://localhost:81/dev-api/manage/business/policy_reporting/policy/batch_update)<br />POST<br />{<br />    "id": 1，<br />}

<a name="qi51w"></a>
#### 投顾政策批量更新
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/batch_update](http://localhost:81/dev-api/manage/business/policy_reporting/policy/batch_update)<br />POST<br />{<br />    "ids": [4],<br />    "payment_day": 1,<br />    "status": 1,<br />    "effective_end_date": "2020-01-01"<br />}

<a name="ZYohR"></a>
#### 政策更改负责人
[http://localhost/dev-api/manage/business/policy_reporting/policy/change_manager](http://localhost/dev-api/manage/business/policy_reporting/policy/change_manager)<br />POST
```
{
    "ids": [114, 113],
    "manager_id":  10000002
}
```
<a name="JAuQ2"></a>
#### 投顾政策查看
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/def](http://localhost:81/dev-api/manage/business/policy_reporting/policy/def)<br />GET
```javascript
{
    "id": 3,  //政策id
}
```

<a name="e0sDg"></a>
#### 投顾对象树形列表
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/tree](http://localhost:81/dev-api/manage/business/policy_reporting/policy/tree?blogger_type=3&sign=1)<br />GET
```javascript
{
    "blogger_type": 3,  //博主类型（2直营3投顾4自营5自建）
    "sign": 1 //1、签约，2未签约
}
```

<a name="mTVA8"></a>
#### 关键词树形列表
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/keyword_tree](http://localhost:81/dev-api/manage/business/policy_reporting/policy/keyword_tree?advertiser_type=1&ids=10007053&ids=10007054)<br />GET
```javascript
{
  "advertiser_type": 1,   //项目类型
  "ids": [], //人员数组id集合
}
```

<a name="L3vKC"></a>
#### 政策查询人员下拉
[http://localhost:81/dev-api/manage/business/policy_reporting/policy/account_select](http://localhost:81/dev-api/manage/business/policy_reporting/policy/account_select?type=1)<br />GET
```javascript
{
    "type": 1,  //1、投顾 2、投顾博主 3、博主下拉
}
```
<a name="y9F98"></a>
#### 待审核列表创建人、商务下拉
[http://localhost:1024/dev-api/manage/business/policy_reporting/pending_pproval/](http://localhost:1024/dev-api/manage/business/policy_reporting/pending_pproval/list)people<br />GET
```
{
type:'' //'business_id', 'create_user_id'
}
```

<a name="fd1vk"></a>
#### 政策报备提交审核
[http://localhost/dev-api/manage/business/policy_reporting/pending_pproval/approval](http://localhost/dev-api/manage/business/policy_reporting/pending_pproval/approval)<br />POST
```javascript
{
    "policy_id": 56,
    "verify_type": 1 // verify_type 1 提交审核  2 人员审核
}
{
    "policy_id": 56,
    "verify_type": 2,
    "verify_status":3,
     "verify_suggest":"审核添加附件"
}
```
<a name="Qvxom"></a>
#### 待审核列表
[http://localhost/dev-api/manage/business/policy_reporting/pending_pproval/list](http://localhost/dev-api/manage/business/policy_reporting/pending_pproval/list)<br />GET
```javascript
{
    "code": 0,
    "count": 4,
    "data": [
        {
            "id": 56,
            "business_id": 12345,
            "advertiser_type": 1,
            "type": 1,
            "operation_type": 1,
            "offer_type": 1,
            "offer_account_id": 10007068,
            "keyword_type": 2,
            "settlement_category": 1,
            "settlement_id": "[1, 2, 3]",
            "company": 1,
            "payment_day": 5,
            "effective_start_date": "2021-10-10",
            "effective_end_date": "2021-10-10",
            "remark": "备注",
            "verify_status": 2,
            "verify_suggest": "审核添加附件",
            "verify_feedback_time": null,
            "status": 1,
            "create_time": "2022-01-21 15:31:58",
            "create_user_id": 10000002,
            "update_user_id": 10000002,
            "update_time": "2022-01-23 11:28:49",
            "oem_id": 1,
            "approval_process": "[{\"id\": 10007056, \"name\": \"陈亮\", \"role_id\": 149, \"role_name\": \"主管\"}]",
            "approval_process_info": "[{\"id\": 10007056, \"name\": \"陈亮\", \"role_id\": 149, \"role_name\": \"主管\", \"verify_status\": 4, \"verify_suggest\": \"审核添加附件\"}]",
            "next_account_id": 10007056,
            "total_step": 1,
            "current_step": 0,
            "content_type": 1,
            "counterpart_id": 10007052,
            "counterpart_name": "王虹宇",
            "create_user_name": "张锦林",
            "business_name": null,
            "settlement_names": "CPA（拉新）+CPS（分成）+CPA（订单）",
            "service_ratio": 0.3,
            "publish_ratio": 0.4,
            "service_price": 30,
            "publish_price": 40,
            "settle_info": {
                "settlement_names": "CPA（拉新）+CPS（分成）+CPA（订单）",
                "service_ratio": 0.3,
                "publish_ratio": 0.4,
                "service_price": 30,
                "publish_price": 40
            }
        }]
}
```
<a name="lHcdP"></a>
# 财务
<a name="yk0Ll"></a>
## KOC结算
<a name="g0xUD"></a>
### 数据导入日志
<a name="Js1tA"></a>
#### 导入数据
[http://localhost:1024/dev-api/manage/finance/settlement/import_log/add](http://localhost:1024/dev-api/manage/finance/settlement/import_log/add)<br />POST
```
{
    "upload_id": 67, //为调用upload接口后 返回的ID
    "advertiser_type": 1
}
```
<a name="TqoCQ"></a>
#### 删除导入日志（一键删除导入失败、重复导入）
[http://localhost:3012/manage/finance/settlement/import_log/update_status](http://localhost:3012/manage/finance/settlement/import_log/update_status)<br />POST
```
{
    "import_status": 0,
    "import_log_id": 23
}
```
<a name="iADju"></a>
#### 查询列表详情
[http://localhost:3012/manage/finance/settlement/import_log/detail_list?import_log_id=23](http://localhost:3012/manage/finance/settlement/import_log/detail_list?import_log_id=23)<br />GET
<a name="LEnog"></a>
#### 搜索下拉
[http://localhost:3012/manage/finance/settlement/import_log/select](http://localhost:3012/manage/finance/settlement/import_log/select)<br />GET

<a name="nGtLC"></a>
### 待结算
<a name="BdNJc"></a>
#### 列表
[http://localhost:81/dev-api/manage/finance/settlement/unsettlement/list](http://localhost:81/dev-api/manage/finance/settlement/unsettlement/list?import_log_id=22&advertiser_type=1)<br />GET
```
{
    "advertiser_type": 1
}
```
<a name="HIeed"></a>
#### 批量编辑
[http://localhost:81/dev-api/manage/finance/settlement/unsettlement/batch_update](http://localhost:81/dev-api/manage/finance/settlement/unsettlement/batch_update)<br />POST
```
{
    "updateData": [{
       id:1,
       settle_status: 2,
       edit_settle: 3,
       edit_publish: 4,
       edit_query: 5,
    }]
}
```
<a name="krgSt"></a>
#### 搜索下拉
[http://localhost/dev-api/manage/finance/settlement/unsettlement/select_query](http://localhost/dev-api/manage/finance/settlement/insettlement/select_query)<br />GET
```
{
   "settle_status": 1 //结算状态
}
```
<a name="UjN1l"></a>
### 结算中
<a name="oOPUg"></a>
#### 列表
[http://localhost/dev-api/manage/finance/settlement/insettlement/list](http://localhost/dev-api/manage/finance/settlement/insettlement/list)<br />GET<br />搜索条件：<br />waitVerify:true 待我审批<br />date[] 结算日期<br />next_account_id 审批人<br />verify_status 结算状态<br />import_log_id 导入文件<br />content_type 内容类型<br />company_id 代理商<br />blogger_type 博主类型<br />blogger 博主<br />koc KOC商务<br />consultant 投顾<br />dept 所属部门

<a name="g27fn"></a>
#### 审批
[http://localhost/dev-api/manage/finance/settlement/insettlement/approval](http://localhost/dev-api/manage/finance/settlement/insettlement/approval)<br />POST<br />verify_type 1 提交审核  2 人员审核<br />verify_status 3通过 4拒绝<br />verify_suggest： 拒绝理由<br />{<br />    "ids": [1],  //可以传id或ids<br />    "verify_type": 2,<br />    "verify_status": 3<br />}

审批人下拉<br />[http://localhost/dev-api/manage/finance/settlement/insettlement/next_account_list](http://localhost/dev-api/manage/finance/settlement/insettlement/next_account_list)<br />GET

<a name="tQ42l"></a>
### 已结算
<a name="Jyb7Q"></a>
#### 列表
[http://localhost/dev-api/manage/finance/settlement/settled/list](http://localhost/dev-api/manage/finance/settlement/settled/list)<br />GET
<a name="VrLjx"></a>
## KOC付款
<a name="xxDub"></a>
### 付款申请
<a name="WJMGp"></a>
#### 列表
[http://localhost:82/dev-api/manage/finance/payment/application/list](http://localhost:82/dev-api/manage/finance/payment/application/list)<br />GET
<a name="AwI1b"></a>
#### 关键词数
[http://localhost:82/dev-api/manage/finance/payment/application/keyword_list](http://localhost:82/dev-api/manage/finance/payment/application/keyword_list)<br />GET
```
{
    "owner_user_id": 67,
    "import_log_id": 1,
    "company_id": 1
}
```
<a name="t2TgL"></a>
#### 新增收款主体
[http://localhost:82/dev-api/manage/finance/public/recivingCompany/add](http://localhost:82/dev-api/manage/finance/public/recivingCompany/add)<br />POST
```
{
    "name": 67,
    "bank": 1,
    "bank_no": 1，
    "money_upper": 100,
}
```
<a name="bdhLJ"></a>
#### 收款主体下拉
[http://localhost:82/dev-api/manage/finance/public/recivingCompany/list](http://localhost:82/dev-api/manage/finance/public/recivingCompany/list)<br />GET
<a name="eOURD"></a>
#### 新增付款申请
[http://localhost:82/dev-api/manage/finance/payment/application/payee_add](http://localhost:82/dev-api/manage/finance/payment/application/payee_add)<br />POST
<a name="Ld6j0"></a>
#### 获取提交付款申请明细
[http://localhost:82/dev-api/manage/finance/payment/application/payee_info](http://localhost:82/dev-api/manage/finance/payment/application/payee_info)<br />GET
```
//部分选中，全选不传
{
    dates: [],
    owner_user_ids: []
}
```
<a name="Ijvpl"></a>
#### 下拉查询条件集合
[http://localhost:82/dev-api/manage/finance/payment/application/select_query](http://localhost:82/dev-api/manage/finance/payment/application/select_query)<br />GET
```

{
   advertiser_type: 1,
   type: 1  //导入文件下拉
}
```
<a name="M12BJ"></a>
### 付款审批中
<a name="PDi0g"></a>
#### 列表
[http://localhost/dev-api/manage/finance/payment/in_approval/list](http://localhost/dev-api/manage/finance/payment/in_approval/list)<br />GET

<a name="Q63SM"></a>
#### 审批
[http://localhost/dev-api/manage/finance/payment/in_approval/approval](http://localhost/dev-api/manage/finance/payment/in_approval/approval)<br />POST<br />verify_type 1 提交审核  2 人员审核<br />verify_status 3通过 4拒绝<br />verify_suggest： 拒绝理由<br />{<br />    "ids": [1],  //可以传id或ids<br />    "verify_type": 2,<br />    "verify_status": 3<br />}

<a name="TIUif"></a>
#### 查看详情
[http://localhost/dev-api/manage/finance/payment/public/detail?id=70&payment_status=1](http://localhost/dev-api/manage/finance/payment/public/detail?id=70&payment_status=1)<br />GET<br />id: 付款单id<br />payment_status: 区分tab页 1:付款审批中,2:已审批,3:已付款

<a name="VUJ5r"></a>
#### 详情级联明细
[http://localhost/dev-api/manage/finance/payment/public/data_detail?data_ids[]=364](http://localhost/dev-api/manage/finance/payment/public/data_detail?data_ids[]=364)<br />GET<br />data_ids: 传入点击行的data_ids数组

<a name="rBmtr"></a>
#### 审批人下拉
[http://localhost/dev-api/manage/finance/payment/in_approval/next_account_ist](http://localhost/dev-api/manage/finance/payment/in_approval/next_account_ist)<br />GET

<a name="HXv7a"></a>
#### 导入文件下拉
[http://localhost/dev-api/manage/finance/payment/public/import_log_list](http://localhost/dev-api/manage/finance/payment/public/import_log_list)<br />GET<br />advertiser_type: 推广项目<br />payment_status: 区分tab页 1:付款审批中,2:已审批,3:已付款

<a name="bKWex"></a>
### 已审批
<a name="SXRdC"></a>
#### 1、列表
[http://localhost:1024/dev-api/manage/finance/payment/approved/list?page=1&pagesize=20&advertiser_type=1&interface_id=1221](http://localhost:1024/dev-api/manage/finance/payment/approved/list?page=1&pagesize=20&advertiser_type=1&interface_id=1221)<br />GET
<a name="xBpzg"></a>
#### 2、付款归档
[http://localhost:1024/dev-api/manage/finance/payment/approved/payment_filing](http://localhost:1024/dev-api/manage/finance/payment/approved/payment_filing)<br />POST
```
{
    "payment_ids": [
        11
    ],
    "payment_date": "2022-03-08 13:56:27"
}
```
<a name="hHn52"></a>
### 已付款
<a name="lZwyy"></a>
#### 1、列表
[http://localhost:3012/manage/finance/payment/approve_paid/list?page=1&pagesize=20&advertiser_type=1&interface_id=1221](http://localhost:3012/manage/finance/payment/approve_paid/list?page=1&pagesize=20&advertiser_type=1&interface_id=1221)<br />GET
<a name="LTuhK"></a>
### 已付款
<a name="hXr2M"></a>
#### 1、列表
[http://localhost:3012/manage/finance/payment/report/list](http://localhost:3012/manage/finance/payment/report/list)<br />GET
