
import * as CryptoJS from 'crypto-js'

function hmac(text, key){
  let hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, CryptoJS.enc.Base64.parse(key));
  hmac.update(text);
  return CryptoJS.enc.Base64.stringify(hmac.finalize());
}

let sophtronConfig;

function buildSophtronAuthCode(httpMethod, url){
  let authPath = url.substring(url.lastIndexOf('/')).toLowerCase();
  let text = httpMethod.toUpperCase() + '\n' + authPath;
  let b64Sig = hmac(text, sophtronConfig.sophtronClientSecret);
  let authString = 'FIApiAUTH:' + sophtronConfig.sophtronClientId + ':' + b64Sig + ':' + authPath;
  return authString;
}

function encrypt(text, keyHex, ivHex) {
  if (!text) {
    return '';
  }
  const key  = CryptoJS.enc.Hex.parse(keyHex);
  const iv  = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(text, key, {iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7})
  const hex = encrypted.ciphertext.toString();
  return hex;
}

async function getSophtronAuthCode(){
  const uuid = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(sophtronConfig.sophtronClientSecret))
  const key = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(uuid.replaceAll('-', '')));
  const iv = CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.random(16));
  const payload = encrypt(JSON.stringify({
    sophtron: {
      clientId: sophtronConfig.sophtronClientId,
      secret: sophtronConfig.sophtronClientSecret,
      endpoint: sophtronConfig.sophtronApiServer,
      vcEndpoint: sophtronConfig.sophtronVcServer,
      provider: 'sophtron',
      available: true
    }
  }), key, iv);
  console.log('encrypted:', payload)
  const phrase = buildSophtronAuthCode('post', 'secretexchange' )
  const rawResponse = await fetch(sophtronConfig.sophtronAuthServer + '/v2/secretexchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: phrase
    },
    body: JSON.stringify({Payload: payload})
  });
  const token = await rawResponse.json();
  console.log('Retrieved ucw auth token', token)
  const str = `sophtron;${token.Token};${iv}`
  const b64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
  console.log('sophtron auth code:', b64)
  return b64;
}

export async function getVC(providerConfig, customer_id, connection_id) {
  sophtronConfig = providerConfig;
  const path = (sophtronConfig?.sophtronVcServer) + `/vc/customers/${customer_id}/members/${connection_id}/identity?filters=name`
  const ret = await fetch(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      Authorization: buildSophtronAuthCode('get', path)
    }
  });
  const json = await ret.json();
  return json.vc;
}

export async function verifyVc(providerConfig, raw, did){
  sophtronConfig = providerConfig;
  // verifyVc does not require credentials, hence sophtronConfig is optional
  const path = (sophtronConfig?.sophtronVcServer || 'https://vc.sophtron-prod.com/api') + `/credentials/verify`
  const ret = await fetch(path, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'text/plain',
      'Content-Length': raw.length,
    },
    body: raw
  });
  const json = await ret.json();
  console.log(json)
  if(json?.vcDataModel?.credentialSubject?.id !== did){
    return '';
  }
  const {first, last} = json?.vcDataModel?.credentialSubject?.customer?.name || {}
  return (first || last) ? `${first} ${last}` : '';
}

function onEvent(e){
  console.log('Widget Event: ', e)
}
let ucwCallback;
async function onFinish(e){
  console.log('ucw onFinished: ', e)
  if(e?.data?.id){
    if(ucwCallback){
      await ucwCallback({
        provider: e.data.provider,
        customer_id: e.data.user_guid,
        connection_id: e.data.id
      })
    }
  }else{
    console.log('Unexpected ucw result')
  }
}
const testEvent = null;
// const testEvent = {
//   "_type": "onFinish",
//   "event": "vcs/connect/memberConnected",
//   "type": "message",
//   "connection_id": "1febf636-fc0d-4da0-9781-feff3e65c7a7",
//   "data": {
//       "session_guid": "87f87577-92a0-4296-af63-095f76529991",
//       "user_guid": "1d93d99e-e2f4-4dd0-b0d4-3bddd267b4c3",
//       "member_guid": "1febf636-fc0d-4da0-9781-feff3e65c7a7",
//       "provider": "sophtron",
//       "id": "1febf636-fc0d-4da0-9781-feff3e65c7a7"
//   }
// }

export async function show(did, providerConfig, onWcwFinished){
  ucwCallback = onWcwFinished;
  sophtronConfig = providerConfig;
  if(testEvent){
    onFinish(testEvent)
    return
  }
  ucw.init({
    env: 'https://widget-pre.universalconnectproject.org',
    jobType: 'identify',
    user_id: did,
    connection_id: null,
    institution_id: null,
    provider: null,
    params: {},
    // auth: await getUcpAuthCode(),
    auth: await getSophtronAuthCode(),
    onEvent: onEvent,
    onShow: onEvent,
    onInit: onEvent,
    onClose: onEvent,
    onSelectBank: onEvent,
    onLogin: onEvent,
    onLoginSuccess: onEvent,
    onMfa: onEvent,
    onFinish: onFinish,
    onError: onEvent,
  }, true );
  ucw.show();
}