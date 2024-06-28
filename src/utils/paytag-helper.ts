// TODO: use the @tbdNUMBERS/dap package... I'm not sure why 
// I'm getting a polyfill error on 'createRequire' from 'node:module'
// maybe a bun thing... To be reviewed with Frank...
import { Dap } from "./dap/dap";

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
    const dap = Dap.parse(dapStr);
    console.info('>>> dap', dap);
    return dap.getDid();
}