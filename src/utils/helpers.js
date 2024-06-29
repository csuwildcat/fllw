
if (!globalThis.URLPattern) {
  await import('urlpattern-polyfill')
}

const drlCaptureRegexp = /^(?:dweb:\/\/)?(did:[^\/]+)(?:\/protocols\/([^\/]+)\/?)?/;
const hasBuffers = typeof Buffer !== 'undefined';

const natives = {
  canonicalize: function(object) {
    var buffer = '';
    serialize(object);
    return buffer;
    function serialize(object) {
      if (object === null || typeof object !== 'object' ||
          object.toJSON != null) {
          buffer += JSON.stringify(object);
      }
      else if (Array.isArray(object)) {
          buffer += '[';
          let next = false;
          object.forEach((element) => {
              if (next) {
                  buffer += ',';
              }
              next = true;
              serialize(element);
          });
          buffer += ']';

      }
      else {
          buffer += '{';
          let next = false;
          Object.keys(object).sort().forEach((property) => {
              if (next) {
                  buffer += ',';
              }
              next = true;
              buffer += JSON.stringify(property);
              buffer += ':';
              serialize(object[property]);
          });
          buffer += '}';
      }
    }
  },
  deepSet(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const lastObj = keys.reduce((o, key) => o[key] = o[key] || {}, obj);
    lastObj[lastKey] = value;
  },
  unslash(str) {
    return str.endsWith('/') ? str.slice(0, -1) : str;
  },
  randomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    bytes.forEach((byte) => {
        result += chars[byte % chars.length];
    });
    return result;
  },
  url: {
    encode: (str) => {
      let encoded = [hasBuffers ? Buffer.from : btoa](encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)))
      if (hasBuffers) encoded = encoded.toString('base64');
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    decode: (str) => {
      let decoded = str.replace(/-/g, '+').replace(/_/g, '/');
      decoded = hasBuffers ? Buffer.from(decoded, 'base64').toString() : atob(decoded);
      return decodeURIComponent(decoded.split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''));
    }
  },
  drl: {
    async cache(drl, record, blob){   
      const cache = await caches.open('drl');
      await cache.put(drl, new Response(blob || await record.data.blob(), {
        headers: { 'Content-Type': record.dataFormat }
      }));
      return drl;
    },
    async fromRecord(record, cache, blob){
      const drl = `https://dweb/${record.author}/records/${record.id}`;
      if (cache) {
        await this.cache(drl, record, blob);
      }
      return drl;
    },
    create(did, { protocol = '', path = {}, params = {}, hash = '' }){
      let url = `dweb://${did}`;
      if (protocol) {
        url += '/protocols/' + natives.url.encode(natives.unslash(protocol));
      }
      for (let z in path) {
        url += `/${z}/${path[z]}`
      }
      const searchParams = new URLSearchParams();
      for (let key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        }
        else searchParams.append(key, value);
      }
      return url + searchParams.toString() + hash;
    },
    parse(_url, pathname = '*'){
      const url = natives.unslash(_url);
      const match = new URLPattern({
        protocol: 'dweb',
        pathname
      }).exec(url)

      if (!match) return null;

      const drlMatches = url.match(drlCaptureRegexp);
      const protocol = drlMatches?.[2];
      return {
        did: drlMatches?.[1] || null,
        protocol: protocol ? natives.url.decode(protocol) : null,
        path: match.pathname.groups,
        params: Object.fromEntries(new URLSearchParams(match.search.input)),
        hash: match.hash.input
      }
    }
  }
}

var DOM = {
  ready: new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', e => {
      document.documentElement.setAttribute('ready', '');
      resolve(e)
    });
  }),
  delay: ms => new Promise(resolve => setTimeout(resolve, ms)),
  query: s => document.querySelector(s),
  queryAll: s => document.querySelectorAll(s),
  skipFrame: fn => new Promise(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (fn) fn();
      resolve();
    })
  })),
  wait: ms => new Promise(resolve => setTimeout(() => resolve(), ms)),
  fireEvent(node, type, options = {}){
    return node.dispatchEvent(new CustomEvent(type, Object.assign({
      bubbles: true,
      composed: true
    }, options)))
  },
  addEventDelegate(type, selector, fn, options = {}){
    let listener = e => {
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      let match = target.closest(selector);
      if (match && (!options.avoid || !target.closest(options.avoid))) fn(e, match);
    }
    (options.container || document).addEventListener(type, listener, options);
    return listener;
  },
  removeEventDelegate(type, listener, options = {}){
    (options.container || document).removeEventListener(type, listener);
  },
  getQueryParams(url){
    const params = {};
    new URLSearchParams(url || location.search).forEach((value, key) => {
      params[key] ? params[key].push(value) : params[key] = [value];
    })
    return params;
  },
  debounce(fn, interval = 50) {
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    const call = () => {
      fn.apply(lastThis, lastArgs);
      timeoutId = null;
    };
    return function(...args) {
      lastArgs = args; // Capture the latest arguments
      lastThis = this; // Capture the correct `this` context
      timeoutId = timeoutId || setTimeout(call, interval);
    };
  }
}

const notify = {
  info (message, options = {}){
    const alert = Object.assign(document.createElement('sl-alert'), {
      variant: 'primary',
      duration: 3000,
      closable: true,
      innerHTML: `
        <sl-icon name="${options.icon || 'info-circle'}" slot="icon"></sl-icon>
        ${document.createTextNode(message).textContent}
      `
    }, options);
    return document.body.appendChild(alert).toast();
  },
  success(message, options = {}){
    notify.info(message, Object.assign({
      variant: 'success'
    }, options))
  },
  warning(message, options = {}){
    notify.info(message, Object.assign({
      variant: 'warning'
    }, options))
  },
  error(message, options = {}){
    notify.info(message, Object.assign({
      variant: 'danger'
    }, options))
  }
}

const pressedElements = [];
document.addEventListener('pointerdown', e => {
  const paths = e.composedPath();
  const pressTarget = paths.find(node => node?.matches?.('[pressable]')) || paths[0];
  pressTarget.setAttribute('pressed', '');
  pressedElements.push(pressTarget);
}, { passive: true, capture: true });

window.addEventListener('pointerup', e => {
  pressedElements.forEach(node => node.removeAttribute('pressed'));
  pressedElements.length = 0;
}, { passive: true, capture: true });

globalThis.DOM = DOM;

export { DOM, notify, natives };
