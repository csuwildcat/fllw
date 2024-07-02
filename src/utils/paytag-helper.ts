import { DidDht, DidJwk, DidWeb, UniversalResolver } from '@web5/dids';

import { Dap } from "@tbd54566975/dap";

export const lookupDidFromPaytag = (paytag: string) => {
    // try to resolve the standard paytags first
    const dap = standardPaytagsToDap(paytag)

    if (!dap.startsWith('@')) {
        // not a valid dap
        return;
    }

    return getDidFromDap(dap);
}

const standardPaytagsToDap = (paytag: string) => {
    // cashapp paytag
    if (paytag.startsWith('$')) {
        return `@${paytag.replace(/^\$/, '')}/cashapp.me`;
    }

    // lightning address paytag
    // todo: this is based on zbd ln address, but is this correct? review...
    if (paytag.indexOf('@') > 0) {
        return `@${paytag.replace(/^ln/, '')}/lightning.me`;
    }

    // likely a default dap, does not need to convert
    return paytag;
}

const getDidFromDap = async (dapStr: string) => {
    console.info('>>> dapStr', dapStr);

    const dap: Dap = Dap.parse(dapStr);
    console.info('>>> dap', dap);

    const registryUrl = await getDapRegistryUrl(dap);

    const dapUrl = `${'http://localhost:3001/daps' // TODO: remove! just a hackweek temp
        || registryUrl}/${dap.handle}`;

    // fetch dap url
    try {
        const response = await fetch(dapUrl);
        const dap = await response.json();
        console.info('>>> dap', dap);
        return dap.did
    } catch (error) {
        console.error('>>> fail to resolve dap error', error);
        throw error;
    }
}

export const DidResolver = new UniversalResolver({
    didResolvers: [DidDht, DidJwk, DidWeb]
})

const getDapRegistryUrl = async (dap: Dap): Promise<string> => {
    const webDid = `did:web:${dap.domain}`;

    const didDoc = await DidResolver.resolve(webDid);

    console.info('>>> didDoc', didDoc);

    const dapService = didDoc.didDocument.service.find(s => s.id === 'DAPRegistry');

    if (!dapService) {
        throw new Error('DID has no DAP Registry service');
    }

    console.info('>>> dapService', dapService);

    const registryUrl = dapService.serviceEndpoint;

    console.info('>>> registryUrl', registryUrl);

    return registryUrl[0]
}