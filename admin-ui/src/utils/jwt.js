/** KJUR.jws 由jsrsasign库提供, 已在index.html脚本引入*/

export default {
  sign(payload, key, options) {
    if (typeof payload != 'object') {
      throw 'payload must be object to set [iat]、[exp]...';
    }
    // Header
    const oHeader = { alg: 'HS256', typ: 'JWT' };

    // Payload
    const tNow = KJUR.jws.IntDate.get('now');
    payload.iat = tNow;
    if (options.expiresIn) {
      if (typeof options.expiresIn == 'number') {
        payload.exp = tNow + options.expiresIn;
      } else {
        const tEnd = KJUR.jws.IntDate.get('now + ' + options.expiresIn);
        payload.exp = tEnd;
      }
    }

    // Sign JWT, password=616161
    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(payload);
    return KJUR.jws.JWS.sign('HS256', sHeader, sPayload, key);
  },
  verify(token, key, callback) {
    const isValid = KJUR.jws.JWS.verifyJWT(token, key, { alg: ['HS256'] });
    if (!isValid) {
      if (callback) {
        return callback('verify failed', null);
      } else {
        return null;
      }
    }

    const payloadObj = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(token.split('.')[1]));
    if (callback) {
      return callback(null, payloadObj);
    } else {
      return payloadObj;
    }
  },
};
