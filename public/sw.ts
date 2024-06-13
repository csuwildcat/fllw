
import { installWorker } from '/src/utils/web-features.ts';

installWorker({
  onCacheCheck(event, route){
    return {
      ttl: 30000
    }
  }
});

import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST || []);