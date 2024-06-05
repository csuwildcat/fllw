
import { installWorker } from '/src/utils/service-worker.ts';

installWorker({
  onCacheCheck(event, route){
    return {
      ttl: 30000
    }
  }
});

import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST || []);