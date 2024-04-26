importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js',
  './web5-dids.js'
);

const DidResolver = self.DidResolver = new Web5Dids.UniversalResolver({ didResolvers: [Web5Dids.DidDht, Web5Dids.DidWeb] });
const didUrlRegex = /^https?:\/\/did\/([^\/]+)(\/.*)?$/;

self.addEventListener('fetch', async event => {
  const match = event.request.url.match(didUrlRegex);
  if (match) {
    const did = 'did:' + match[1];
    event.respondWith(handleEvent(event, did, did + match[2]));
  }
});

async function handleEvent(event, did, route){
  try {
    const result = await DidResolver.resolve(did);
    return await fetchResource(event, result.didDocument, route);
  }
  catch(error){
    if (error instanceof Response) {
      return error;
    }
    console.log(`Error in DID URL fetch: ${error}`);
    return new Response('DID URL fetch error', { status: 500 });
  }
}

async function fetchResource(event, ddo, route) {
  const endpoints = ddo?.service?.find(service => service.type === 'DecentralizedWebNode')?.serviceEndpoint.filter(url => url.startsWith('http'));

  if (!endpoints?.length) {
    throw new Response('DWeb Node resolution failed: no valid endpoints found.', { status: 530 })
  }

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/${route}`, { headers: event.request.headers });
      if (response.ok) {
        return response;
      }
      console.log(`DWN endpoint error: ${response.status}`);
      return new Response('DWeb Node request failed', { status: response.status }) 
    }
    catch (error) {
      console.log(`DWN endpoint error: ${error}`);
      return new Response('DWeb Node request failed: ' + error, { status: 500 }) 
    }
  }
}

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);