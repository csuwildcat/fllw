
const sophtronDWNServer = 'http://localhost:8083/api'
// const sophtronDWNServer = 'https://dwn.sophtron-prod.com/api'

async function getSophtronAuthCode(did, auth){
  const rawResponse = await fetch( `${sophtronDWNServer}/did/${encodeURIComponent(did)}/ucw`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      DidAuth: JSON.stringify(auth)
    },
  });
  const token = await rawResponse.json();
  console.log('Retrieved sophtron auth token', token)
  return token;
}

export async function getVC(did, auth, connection_id) {
  const path = `${sophtronDWNServer}/did/${did}/vc/${connection_id}`
  const ret = await fetch(path, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      DidAuth: JSON.stringify(auth)
    }
  });
  const json = await ret.json();
  return json.vc;
}

export async function verifyVc(did, auth, raw){
  const path = `${sophtronDWNServer}/did/${did}/verify`
  const ret = await fetch(path, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'text/plain',
      'Content-Length': raw.length,
      DidAuth: JSON.stringify(auth)
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

let testEvent = null;
testEvent = {
    "_type": "onFinish",
    "event": "vcs/connect/memberConnected",
    "type": "message",
    "connection_id": "78c901b1-8563-435c-bc79-2cdfa3ee02ad",
    "data": {
        "session_guid": "",
        "user_guid": "f16e771d-ada4-434b-aedf-fa816711f292",
        "member_guid": "78c901b1-8563-435c-bc79-2cdfa3ee02ad",
        "provider": "sophtron",
        "id": "78c901b1-8563-435c-bc79-2cdfa3ee02ad"
    }
}

export async function show(did, auth, onWcwFinished){
  ucwCallback = onWcwFinished;
  const token = await getSophtronAuthCode(did, auth);
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
    auth: token,
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