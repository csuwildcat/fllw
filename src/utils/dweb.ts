import type { DidResolutionResult, DidServiceEndpoint } from '@web5/dids';

let Web5: any;
let dwnCache: { [key: string]: { urls: string[], timestamp: number } } = {};
let dwnCacheTimeout = 1000 * 60 * 60 * 2;
const attributes = ['src', 'href', 'data'];
const drlRegex = /^dweb:\/\/(did:[^\/]+)(\/.+)?$/;

export function activateDomFeatures(web5: any) {
  Web5 = web5;
  addEventListener('error', detectAttributes, true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => parseDom);
  } else {
    parseDom();
  }
}

export function deactivateDomFeatures() {
  removeEventListener('error', detectAttributes);
}

function detectAttributes(element: any) {
  attributes.find(function(attr){
    let match = this?.[attr]?.match(drlRegex);
    if (match) {
      replaceDrl(attr, this, match[1], match[2]);
      return true;
    }
  }, element?.detail?.originalTarget || element.target || element);
}

function parseDom() {
  document.querySelectorAll('[' + attributes.join('], [') + ']').forEach(detectAttributes);
}

async function replaceDrl(attribute: string, element: any, did: string, path: string) {
  if (did && path) {
    let urls: string[] = [];
    const cacheEntry = dwnCache[did];

    if (cacheEntry && new Date().getTime() - dwnCacheTimeout > cacheEntry.timestamp) {
      urls = cacheEntry.urls;
    } else {
      try {
        const response: DidResolutionResult = await Web5.did.resolve(did);
        response?.didDocument?.service?.find(service => {
          const endpoints = service?.serviceEndpoint;
          if (Array.isArray(endpoints)) {
            urls.push(...endpoints.filter((url: string) => url.match(/^(http|https):/)));
            return true;
          }
        });
        dwnCache[did] = {
          urls,
          timestamp: new Date().getTime()
        };
      } catch (error) {
        element.dispatchEvent(new CustomEvent('unresolvable', {
          detail: {
            did,
            message: 'DID resolution failed'
          }
        }));
      }
    }

    if (urls.length) {
      element[attribute] = `${urls[0].replace(/\/$/, '')}/${did}/${path}`;
    } else {
      element.dispatchEvent(new CustomEvent('unresolvable', {
        detail: {
          did,
          message: 'No DWeb Node service entries found'
        }
      }));
    }
  }
}