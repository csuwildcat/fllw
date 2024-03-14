
if (!globalThis.URLPattern) {
  await import('urlpattern-polyfill')
}

const drlCaptureRegexp = /^(?:dweb:\/\/)?(did:[^\/]+)(?:\/protocols\/([^\/]+)\/?)?/;
const natives = {
  deepSet(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const lastObj = keys.reduce((o, key) => o[key] = o[key] || {}, obj);
    lastObj[lastKey] = value;
  },
  unslash(str) {
    return str.endsWith('/') ? str.slice(0, -1) : str;
  },
  url: {
    encode(str){
      return btoa(encodeURIComponent(str)
        .replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    },
    decode(str){
      return decodeURIComponent(atob(str
        .replace(/-/g, '+')
        .replace(/_/g, '/'))
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''));
    }
  },
  drl: {
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
      let match = e.target.closest(selector);
      if (match) fn(e, match);
    }
    (options.container || document).addEventListener(type, listener, options);
    return listener;
  },
  removeEventDelegate(type, listener, options = {}){
    (options.container || document).removeEventListener(type, listener);
  },
  throttle(fn, delay) {
    let last = 0;
    let timeout;
    return function(...args) {
      return new Promise(resolve => {
        const now = Date.now();
        const diff = now - last;
        clearTimeout(timeout);
        if (diff >= delay || last === 0) {
          resolve(fn(...args));
          last = now;
        }
        else {
          timeout = setTimeout(() => {
            resolve(fn(...args));
            last = Date.now();
          }, delay - diff);
        }
      })
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
