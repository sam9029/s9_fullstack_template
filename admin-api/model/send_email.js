const nodemailer = require("nodemailer");
const fs = require("fs");
// async..await is not allowed in global scope, must use a wrapper
async function main() {
    let transporter = nodemailer.createTransport({
        host: "smtp.qq.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: '1904007754@qq.com', // generated ethereal user
            pass: 'duuxsgpsghirbdfd', // generated ethereal password
        },
    });
    let info = await transporter.sendMail({
        from: '"力值MKT管理系统" <1904007754@qq.com>', // sender address
        to: "1904007754@qq.com", // list of receivers
        subject: "账户授权警告", // Subject line
        text: "部分账户已授权失效，请及时处理", // plain text body
        html: "<b>账户失效列表已发送到附件，请注意查收</b>", // html body
        attachments: [
            {
                filename: '头条失效账户.xlsx',
                content: fs.createReadStream('../public/uploads/test.xlsx')
            }
        ]
    });
    console.log("Message sent: %s", info.messageId);
}

main().catch(console.error);