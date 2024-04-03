
import { toWebStream } from "./streams";
import * as protocols from './protocols';

setInterval(() => Datastore.cache = {}, 1000 * 60 * 60)

async function cacheJson(records){
  await Promise.all((Array.isArray(records) ? records : [records]).map(async record => {
    record.cache = {
      json: await record.data?.json?.()?.catch(e => {})?.then(obj => obj)
    }
  }))
}
class Datastore {

  static cache = {}
  static setCache(did, key, value){
    (Datastore.cache[did] || (Datastore.cache[did] = {}))[key] = value;
  }
  static getCache(did, key){
    return Datastore.cache?.[did]?.[key];
  }

  constructor(options){
    this.did = options.did;
    this.dwn = options.web5.dwn;
    this.ready = this.installProtocols();
  }

  async installProtocols(){
    console.log(protocols.social);
    const response = await this.dwn.protocols.query({
      message: {
        filter: {
          protocol: protocols.social.uri
        }
      }
    });
    if (response.protocols.length) {
      return true;
    }
    else {
      console.log('installing');
      try {
        await Promise.all(
          Object.values(protocols).map(async _protocol => {

            const { protocol } = await this.dwn.protocols.configure({
              message: {
                definition: _protocol.definition
              }
            })
            const response = await protocol.send(this.did);
            console.log(response);
          })
        )
        console.log('installed');
      }
      catch (e) {
        console.log(e);
        return false;
      }
    }
  }

  async getProtocol(protocolUri, options = {}){
    const params = {
      from: options.from,
      message: {
        filter: {
          protocol: protocolUri,
        }
      }
    }
    const { protocols, status } = await this.dwn.protocols.query(params);
    return { protocol: protocols[0], status };
  }

  async queryProtocolRecords(protocol, path, options = {}){
    await this.ready;
    const message = {
      filter: {
        protocol: protocols[protocol].uri,
        protocolPath: path,
      }
    };
    const params = { message }

    if (options.from) params.from = options.from;
    if (options.parentId) {
      message.filter.parentId = options.parentId
    }
    if (options.contextId) {
      message.filter.contextId = options.contextId
    }
    if (options.published !== undefined) {
      message.filter.published = options.published
    }
    if (options.recipient) {
      message.filter.recipient = options.recipient
    }
    if (options.role) {
      message.protocolRole = options.role
    }
    if (options.sort || options.latestRecord) {
      message.dateSort = options.latestRecord ? 'createdDescending' : options.sort;
    }

    if (options.pagination || options.latestRecord) {
      message.pagination = options.latestRecord ? { limit: 1 } : options.pagination;
    }

    return this.dwn.records.query(params);
  }

  async readProtocolRecord(id, options = {}){
    await this.ready;
    const params = {
      message: {
        filter: {
          recordId: id
        }
      }
    }
    if (options.from) {
      params.from = options.from;
    }
    if (options.role) {
      params.message.protocolRole = options.role
    }
    const response = await this.dwn.records.read(params);
    return response;
  }

  async createProtocolRecord(protocol, path, options = {}){
    await this.ready;
    const params = {
      message: {
        protocol: protocols[protocol].uri,
        protocolPath: path,
        schema: protocols[protocol][path.split('/').pop()]
      }
    }
    const schema = protocols[protocol].schemas[path.split('/').pop()];
    if (schema) params.message.schema = schema;
    if (options.from) params.from = options.from;
    if (options.store === false) params.store = options.store;
    if (options.parentId) params.message.parentId = options.parentId;
    if (options.contextId) params.message.contextId = options.contextId;
    if (options.data) params.data = options.data;
    else if (options.dataFormat === 'application/json') {
      params.data = {};
    }
    if (options.dataFormat) params.message.dataFormat = options.dataFormat;
    if (options.published !== undefined) params.message.published = options.published;
    if (options.recipient) params.message.recipient = options.recipient;
    if (options.role) params.message.protocolRole = options.role;
    const response = await this.dwn.records.create(params);
    console.log('create status', response.status);
    if (options.store !== false) await response.record.send(this.did).then(e => {
      console.log('sent success', response.record);
    }).catch(e => {
      console.log('send error', e)
    });
    console.log(response.record);
    return response;
  }

  async createSocial(options = {}) {
    const { record, status } = await this.createProtocolRecord('profile', 'social', {
      published: true,
      data: options.data,
      dataFormat: 'application/json'
    })
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async getSocial(options = {}) {
    await this.ready;
    const did = options.from || this.did;
    if (did !== this.did) {
      const cached = Datastore.getCache(did, 'social');
      if (cached) return cached;
    }
    const { records, status } = await this.queryProtocolRecords('profile', 'social', options)
    const latestRecord = records[0];
    if (!latestRecord) return;
    if (options.cache !== false) await cacheJson(latestRecord)
    Datastore.setCache(did, 'social', latestRecord);
    return latestRecord;
  }

  async createProfileImage(type, options = {}) {
    if (options.data) {
      options.dataFormat = options.data.type;
      if (options.data instanceof File) {
        options.data = new Blob([options.data], { type: options.dataFormat });
      }
    }
    options.published = true;
    const { record, status } = await this.createProtocolRecord('profile', type, options)
    return record;
  }

  async getProfileImage(type, options = {}) {
    const { records, status } = await this.queryProtocolRecords('profile', type, options);
    return records[0];
  }

  async readProfileImage(type, options = {}){
    await this.ready;
    const did = options.from = options.from || this.did;
    if (!options.skipCache) {
      const cached = Datastore.getCache(did, type);
      if (cached) return cached;
    }
    const record = await this.getProfileImage('avatar', options);
    const blob = await record.data.blob();
    record.cache = {
      blob: blob,
      uri: URL.createObjectURL(blob)
    }
    Datastore.setCache(did, type, record);
    return record;
  }

  async setProfileImage(type, file, _record, from = this.did){
    let record = _record || await datastore.getProfileImage(type, { from });
    let blob = file ? new Blob([file], { type: file.type }) : undefined;
    try {
      if (blob) {
        if (record) await record.update({ data: blob });
        else record = await this.createProfileImage(type, { data: blob, from });
        const { status } = await record.send(from);
      }
      else if (record) {
        blob = await record.data.blob();
      }
    }
    catch(e) {
      console.log(e);
    }
    if (record) {
      record.cache = record.cache || {};
      record.cache.blob = blob;
      record.cache.uri = blob ? URL.createObjectURL(blob) : undefined;
    }
    return record;
  }

  async createCareer(options = {}) {
    const { record, status } = await this.createProtocolRecord('profile', 'career', {
      published: true,
      data: options.data,
      dataFormat: 'application/json'
    })
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async getCareer(options = {}) {
    await this.ready;
    const did = options.from || this.did;
    if (did !== this.did) {
      const cached = Datastore.getCache(did, 'career');
      if (cached) return cached;
    }
    const { records, status } = await this.queryProtocolRecords('profile', 'career', options)
    const latestRecord = records[0];
    if (!latestRecord) return;
    if (options.cache !== false) await cacheJson(latestRecord)
    Datastore.setCache(did, 'career', latestRecord);
    return latestRecord;
  }

 async queryPosts(options = {}){
    const response = await this.queryProtocolRecords('social', 'post', options);
    if (options.cache !== false) await cacheJson(response.records);
    return response;
  }

  // getPostsAfter = (options = {}) => {
  //   return this.queryProtocolRecords('profile', 'avatar', Object.assign({
  //     sort: 'createdDescending',
  //     filter: { datePublished: { from: randomDate } },
  //   }, options))
  // }

  queryFollows = (options = {}) => this.queryProtocolRecords('social', 'follow', options)

  async toggleFollow(did, follow){
    await datastore.queryFollows({ recipient: did, latestRecord: true }).then(async (record) => {
      if (record) {
        console.log(record);
        if (follow && record.isDeleted) record.update();
        else if (!follow) {
          const { record: deleted } = await this.dwn.records.delete({
            message: {
              recordId: record.id,
            }
          });
          record = deleted;
        }
        return record;
      }
      else {
        const { record, status } = await datastore.createProtocolRecord('social', 'follow', { recipient: did, dataFormat: 'application/json' })
        return record;
      }
    })
  }

  async sendInvite(recipient, link, options = {}) {
    if (!options.skipCheck) {
      let invite = await this.getActiveInvite(link, { recipient });
      if (invite) return invite;
    }
    const { record, status: recordStatus } = await this.createProtocolRecord('social', 'invite', Object.assign({
      recipient,
      store: false,
      dataFormat: 'application/json',
      data: { link }
    }, options));

    console.log('invite ', record);
    if (options.cache !== false) await cacheJson(record)
    const { status: sendStatus } = await record.send(recipient);
    if (sendStatus.code === 202) {
      console.log(record);
      const result = await record.store();
      console.log(result);
      return record;
    }
  }

}


export {
  Datastore
}