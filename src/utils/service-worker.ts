import { UniversalResolver, DidDht, DidWeb } from '@web5/dids';

const DidResolver = new UniversalResolver({ didResolvers: [DidDht, DidWeb] });
const didUrlRegex = /^https?:\/\/dweb\/(([^\/]+)\/.*)?$/;
const httpToHttpsRegex = /^http:/;
const trailingSlashRegex = /\/$/;

self.addEventListener('fetch', event => {
  const match = event.request.url.match(didUrlRegex);
  if (match) {
    event.respondWith(handleEvent(event, match[2], match[1]));
  }
});

async function handleEvent(event, did, route){
  const url = event.request.url.replace(httpToHttpsRegex, 'https:').replace(trailingSlashRegex, '');
  const responseCache = await caches.open('drl');
  const response = responseCache.match(url);
  if (response && !navigator.onLine) return response;
  try {
    const result = await DidResolver.resolve(did);
    return await fetchResource(event, result.didDocument, route, responseCache);
  }
  catch(error){
    if (error instanceof Response) {
      return error;
    }
    console.log(`Error in DID URL fetch: ${error}`);
    return new Response('DID URL fetch error', { status: 500 });
  }
}

async function fetchResource(event, ddo, route, responseCache) {
  let endpoints = ddo?.service?.find(service => service.type === 'DecentralizedWebNode')?.serviceEndpoint;
      endpoints = (Array.isArray(endpoints) ? endpoints : [endpoints]).filter(url => url.startsWith('http'));
  if (!endpoints?.length) {
    throw new Response('DWeb Node resolution failed: no valid endpoints found.', { status: 530 })
  }

  for (const endpoint of endpoints) {
    try {
      const url = `${endpoint.replace(trailingSlashRegex, '')}/${route}`;
      const response = await fetch(url, { headers: event.request.headers });
      if (response.ok) { 
        cacheResponse(url, response, responseCache);
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

async function cacheResponse(url, response, cache){   
  const clonedResponse = response.clone();
  const headers = new Headers(clonedResponse.headers);
        headers.append('x-dwn-cache-time', Date.now().toString());
  const modifiedResponse = new Response(clonedResponse.body, { headers });
  cache.put(url, modifiedResponse);
}