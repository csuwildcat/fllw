
import('@web5/dids').then(modules => {
  console.log(modules)

})
import { UniversalResolver, DidDht, DidWeb } from '@web5/dids';
globalThis.DidResolver = new UniversalResolver({ didResolvers: [DidDht, DidWeb] });