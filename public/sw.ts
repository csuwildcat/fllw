
import { activatePolyfills } from '@web5/api';

activatePolyfills({
  onCacheCheck(event, route){
    return {
      ttl: 30000
    }
  }
});

import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST || []);