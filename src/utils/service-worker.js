importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js'
);

const didUrlRegex = /^https?:\/\/((did-[\w-]+).*)$/;

self.addEventListener('fetch', event => {
  console.log(event.request.url);
  const match = event.request.url.match(didUrlRegex);
  if (match) {
    console.log(match);
    const [input, route, did] = match;
    event.respondWith(async () => handleRequest(event, did, route));
  }
});

async function resolveDid (event, did) {
  const client = await self.clients.get(event.clientId);
  if (client) {
    client.postMessage({ type: 'did_resolution', did });
    return new Promise(resolve => {
      self.addEventListener('message', function onMessage(event) {
        if (event?.data?.type === 'did_resolution' && event.data.did === did) {
          self.removeEventListener('message', onMessage);
          resolve(event.data.result);
        }
      });
    });
  }
  throw 'Client disconnected';
}

async function handleRequest(event, did, route) {
  try {
    const result = await resolveDid(event, did);
    const endpoints = result?.didDocument?.service?.find(service => service.type === 'DecentralizedWebNode')?.serviceEndpoint.filter(url => url.startsWith('http'));

    if (!endpoints?.length) {
      throw new Error('No valid endpoints found.');
    }

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint.replace(/\/$/, '')}/${route}`, { headers: event.request.headers });
        if (response.ok) {
          return response;
        }
        console.log(`DWN endpoint error: ${response.status}`);
      } catch (error) {
        console.log(`DWN endpoint error: ${error}`);
      }
    }
  } catch (error) {
    console.log(`Error in handleRequest: ${error}`);
    return new Response('Error resolving DID', { status: 500 });
  }
}

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);