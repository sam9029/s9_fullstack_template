// const { Environment, JWSTransactionDecodedPayload, SignedJWTVerifier, AppStoreServerAPIClient } = require("@apple/app-store-server-library")
// const { VerificationStatus } = require("@apple/app-store-server-library/dist/jwt_verification")
const { cert_path } = require("../../../config")

const fs = require('fs')
const path = require("path")
const issuerId = "649f6d0a-cf3c-4cab-88ab-0ca2c8b3dac2"
const keyId = "D57AAD657A"

// const encodedKey = fs.readFileSync(path.join(cert_path, './apple_private_key.p8'), 'ascii') // Specific implementation may vary
// var client = null

function getClient(env = Environment.PRODUCTION) {
    return new AppStoreServerAPIClient(encodedKey, keyId, issuerId, bundleId, env)
}

// import { AppStoreServerAPIClient, Environment, SendTestNotificationResponse } from "@apple/app-store-server-library"



const bundleId = "com.lizhi.test.ios"
let certs = ['./AppleWWDRCAG2.cer', './AppleWWDRCAG3.cer', './AppleWWDRCAG4.cer', './AppleWWDRCAG5.cer', './AppleWWDRCAG6.cer', './AppleWWDRCAG7.cer', './AppleWWDRCAG8.cer', './AppleIncRootCertificate.cer', './AppleRootCA-G2.cer', './AppleRootCA-G3.cer']
const appleRootCAs = certs.map(cert => fs.readFileSync(path.join(__dirname, cert)))
const appAppleId = 6450667045
const enableOnlineChecks = true
// const environment = Environment.PRODUCTION
// const verifier = new SignedJWTVerifier(appleRootCAs, enableOnlineChecks, environment, bundleId, appAppleId)
// const SandBoxVerifier = new SignedJWTVerifier(appleRootCAs, enableOnlineChecks, Environment.SANDBOX, bundleId, appAppleId)
async function getVerifyNotification(signedPayload = '') {
    let data = await verifier.verifyAndDecodeNotification(signedPayload)
    if (data?.data?.signedTransactionInfo) {
        data.transaction_info = await verifier.verifyAndDecodeTransaction(data?.data?.signedTransactionInfo)
        delete data.data.signedTransactionInfo
    }
    // console.log(data);
    return data
}
async function getOrderInfo(transaction_id = '', env = Environment.PRODUCTION) {
    if (!transaction_id) return null
    let client_request = getClient(env)
    let info = await client_request.getTransactionInfo(transaction_id)
    if (env == 'Sandbox') return await SandBoxVerifier.verifyAndDecodeTransaction(info.signedTransactionInfo)
    let order_info = await verifier.verifyAndDecodeTransaction(info.signedTransactionInfo)
    // console.log(order_info);
    return order_info

}
async function getOrderHistoy(transaction_id = '') {
    let client_request = getClient()
    let info = await client_request.getRefundHistory(transaction_id, null)
    // let order_info = await verifier.verifyAndDecodeTransaction(info.signedTransactionInfo)
    console.log(info);
    info.signedTransactions = info.signedTransactions.map(async i => {
        // console.log(i);
        i = await verifier.verifyAndDecodeTransaction(i)
        return i
    })
    await Promise.all(info.signedTransactions)
    // let order_info = await verifier.verifyAndDecodeTransaction(info?.signedTransactionInfo)
    console.log(info.signedTransactions);

}
async function getRefoundInfo(transaction_id = '') {
    if (!transaction_id) return null
    let client_request = getClient()
    let info = await client_request.lookUpOrderId(transaction_id)
    console.log(info);
    // info.signedTransactions
    let order_info = await verifier.verifyAndDecodeTransaction(info.signedTransactions)
    // console.log(order_info);
    return order_info

}

// getOrderInfo(530001552490689)
// getVerifyNotification(notificationPayload).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.log(err);
// })
module.exports = {
    getVerifyNotification,
    // VerificationStatus,
    getOrderInfo,
    // bundleId,
    // Environment
}
// console.log(verifiedNotification)