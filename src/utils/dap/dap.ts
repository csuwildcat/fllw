import { DidDht, DidJwk, DidWeb, UniversalResolver } from '@web5/dids';

export const DidResolver = new UniversalResolver({
    didResolvers: [DidDht, DidJwk, DidWeb]
})

/**
 * Represents a Decentralized Agnostic Paytag (DAP).
 * A DAP is a human-friendly identifier used for sending and receiving money across different platforms.
 */
export class Dap {
    /** The prefix character for a DAP. */
    static readonly PREFIX = '@';

    /** The separator character between the handle and domain in a DAP. */
    static readonly SEPARATOR = '/';

    /** Regular expression for validating and parsing DAP strings. */
    private static readonly DAP_REGEX = new RegExp(`^${Dap.PREFIX}([^${Dap.PREFIX}${Dap.SEPARATOR}]+)${Dap.SEPARATOR}([^${Dap.PREFIX}${Dap.SEPARATOR}]+)$`);

    /**
     * Creates a new DAP instance.
     * @param handle - The local handle part of the DAP.
     * @param domain - The domain part of the DAP.
     */
    constructor(
        public handle: string,
        public domain: string
    ) { }

    /**
     * Converts the DAP instance to its string representation.
     * @returns The string representation of the DAP.
     */
    toString(): string {
        return `${Dap.PREFIX}${this.handle}${Dap.SEPARATOR}${this.domain}`;
    }

    /**
     * Parses a DAP string and creates a new DAP instance.
     * @param dap - The DAP string to parse.
     * @returns A new DAP instance.
     * @throws {InvalidDap} If the provided string is not a valid DAP.
     */
    static parse(dap: string): Dap {
        const match = dap.match(Dap.DAP_REGEX);
        if (!match) {
            throw new InvalidDap();
        }

        const [, handle, domain] = match;

        return new Dap(handle, domain);
    }

    async getDid(): Promise<string> {
        console.info('>>> getDid...');

        // didpay.me registry is working!
        const registryUrl = await this.getRegistryUrl();

        // TODO: hackweek fake didpay domain, local registry
        const registryUrlLocal = 'http://localhost:3001/daps';

        const dapUrl = `${registryUrlLocal}/${this.handle}`;

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

    async getRegistryUrl(): Promise<string> {
        const webDid = `did:web:${this.domain}`;

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
}

/**
 * Error thrown when an invalid DAP is encountered.
 */
export class InvalidDap extends Error {
    /**
     * Creates a new InvalidDap error.
     * @param message - Optional custom error message. Defaults to 'Invalid DAP'.
     */
    constructor(message?: string) {
        super(message ?? 'Invalid DAP');
        this.name = 'InvalidDap';
    }
}