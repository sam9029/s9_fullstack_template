const { warp_request, encrypt_body, decrypt_response } = require("./sign")





function test_enc() {
  // const { url, param } = get_query_company();
  const { url, param } = get_item_create();

  warp_request(url, param)
    .then(console.log)
    .catch(console.error)
    .finally(process.exit)
}


function test_dec() {
  const res = {
    code: "200",
    data: "lVOMA5SXOzJAJLUMwjRAsfC75Csk/cjrQyZWRkvFg82M5kZFXDG+9VzTVJuyvVLUlExfkv6S6c/4fX0b0Ffn/bQmk9oBhs6NiUFJdRbiXc6/a7jA5zVb5yVp5YxINZ9vxt5eJt5GRtWEXvgPCcqNXV/M4PqIlDyKRnpKO5MoUKWiwsPoLm9XgXIzWE82YUSdNmap5b8jZya8dWRY7Ij3QL/TYldjOzc695UaM0ufdDsF+5rO9wRvpCT1M/KM1kn+6WKwQ64MgX/jyUhEOC49RzrxJHOzdxLPFaQhSidRUh10fQXjEw5Koj7lx2BlSNTHy7vUzqGv0vPVoEGvtokW3ReocMzOW7EDw5SmSURYluImXFvOs/rh6VUvzPxURufq1E7gKPCT1SU8/QaxJR9kBBwbYHyxhieWhb5Z5GxOYe01kqVeYiV2/tBVYffY6NGZAnZsgZSO52FoAT3BBgG2X5f4o/sJHP9ak70Ys5J8wj7k8U/veWIUY0srauo6NjYuOReaWnWfStwV6m4fe/dtC9AmmYsGDt3JB4Tyb9Fiejhmo2/ft41PQ+hFDSStfDvnxdyrEfHgwr/AmdO1Ox/SfjgsGzlg8LreQk7CbUVRbU4QYcY2BCAfaSIx9NE+ZXJ56lMv9ntWpwGmAq9lkpoqAqyK+hv0Mk+XTy7FQfRDetOHyvi+Ffp+tVwEEOLT3YwszedAssxGF/A4j/vhqzlRrRc0Dphy/3O9VzYlHzIUwCy+7bUZvQEXq4aTij20nUcNcv1aWCdr5QGVVlycYWpxaiA/m0iXaUqS/r3imHo0Cob779O3Vec2zArYZPovu0V7BTpii/tCYwWLXdb6fnxVlpi4EL3ZZg/gXLseQtlYTGTR0OBJ2J/w/CO1swUZW11oA1sbnVvPrTQZZND2aWINo4iT7WgiSo6YEVA6gBr1RdjEg0PZDCNsskAqgWBB/a9WLsBybuRFKQeuM1r9BgmjV+FtG8AJJLQXjpuGAVh+/EtukVC1jOH0F4cVx8yBlCjC",
    appid: "1297929417275797504",
    sign: "JDJZD6Sr12lS3C6UtYoZ8J5ziZkexVMycMC5UM2dKBx9PB7PKHYJzLJ2oQ9ZYDqMSUAExJwVNDuES1KKJ532Olkfjq37yGolBN0M4+YE5MPY80FrFugZDr23sN5lj1BwIvV2eSXlsCe0km+m07R1Zk1kOpjlQVuPZcLWSQC0s8Y=",
    signType: "RSA",
    message: "操作成功",
    nonceStr: "8f2df15ea58186c56167",
    timestamp: "1729580518813",
    reqMsgId: "d7b41baa5acab86ba15d6cc09335a872",
  };

  const dec_data = decrypt_response(res);
  console.log(dec_data);
}


// test_enc();
test_dec();





function get_query_company() {
  const url = "/interface/company/queryCompanyInfo";
  const param = { businessId: "1297932747083440128", businessId2: "12979327470834401281" };
  return { url, param };
}

function get_item_create() {
  // bytes override 117
  // array prop order
  const url = "/interface/item/create";
  const param = {
    "commissionLow": 10000,
    "itemTitle": "国信众惠接口对接测试项目2",
    "checkPeriod": "1",
    "businessId": "1297932747083440128",
    "commissionHigh": 10000000,
    "taskInfo": [
      {
        "commissionLow": 10000,
        "taskDesc": "国信众惠接口对接测试任务1",
        "taskTypeId": "103",
        "recruitType": "2",
        "checkPeriod": "1",
        "commissionHigh": 10000000,
        "deliveryType": "2",
        "taskPeriod": "04",
        "taskTitle": "国信众惠接口对接测试任务1",
        "checkRequire": "01",
        "commissionType": "04"
      }
    ],
    "itemTypeId": "6",
    "itemPeriod": "04",
    "checkRequire": "01",
    "parkId": "2",
    "commissionType": "04"
  };
  return { url, param };
}