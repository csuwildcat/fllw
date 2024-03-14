
import { toWebStream } from "./streams";
import * as protocols from './protocols';

setInterval(() => Datastore.cache = {}, 1000 * 60 * 60)

async function cacheJson(records){
  await Promise.all((Array.isArray(records) ? records : [records]).map(async record => {
    record.cache = {
      json: await record.data?.json()?.catch(e => {})?.then(obj => obj)
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
    console.log(protocols['sync']);
    const response = await this.dwn.protocols.query({
      message: {
        filter: {
          protocol: protocols['sync'].uri
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
    const params = {
      message: {
        filter: {
          protocol: protocols[protocol].uri,
          protocolPath: path,
        }
      }
    }
    if (options.from) params.from = options.from;
    if (options.parentId) {
      params.message.filter.parentId = options.parentId
    }
    if (options.contextId) {
      params.message.filter.contextId = options.contextId
    }
    if (options.published !== undefined) {
      params.message.filter.published = options.published
    }
    if (options.recipient) {
      params.message.filter.recipient = options.recipient
    }
    if (options.role) {
      params.message.protocolRole = options.role
    }
    if (options.sort || options.latestRecord) {
      params.message.dateSort = options.latestRecord ? 'createdDescending' : options.sort;
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

  async createSocial(options = {}) {
    const { record, status } = await this.createProtocolRecord('profile', 'social', {
      published: true,
      data: options.data,
      dataFormat: 'application/json'
    })
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  // getPostsAfter = (options = {}) => {
  //   return this.queryProtocolRecords('profile', 'avatar', Object.assign({
  //     sort: 'createdDescending',
  //     filter: { datePublished: { from: randomDate } },
  //   }, options))
  // }

  async getAvatar(options = {}) {
    const { records, status } = await this.queryProtocolRecords('profile', 'avatar', options);
    return records[0];
  }

  createAvatar = async (options = {}) => {
    if (options.data) {
      options.dataFormat = options.data.type;
      if (options.data instanceof File) {
        options.data = new Blob([options.data], { type: options.dataFormat });
      }
    }
    options.published = true;
    const { record, status } = await this.createProtocolRecord('profile', 'avatar', options)
    return record;
  }

  async readAvatar(options = {}){
    await this.ready;
    const did = options.from = options.from || this.did;
    if (!options.skipCache) {
      const cached = Datastore.getCache(did, 'avatar');
      if (cached) return cached;
    }
    const record = await this.getAvatar(options);
    const blob = await record.data.blob();
    record.cache = {
      blob: blob,
      uri: URL.createObjectURL(blob)
    }
    Datastore.setCache(did, 'avatar', record);
    return record;
  }

  async setAvatar(file, _record, from = this.did){
    let record = _record || await datastore.getAvatar({ from });
    let blob = file ? new Blob([file], { type: file.type }) : undefined;
    try {
      if (blob) {
        if (record) await record.delete();
        record = await this.createAvatar({ data: blob, from });
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

  async createCommunity(options = {}) {
    const { record, status } = await this.createProtocolRecord('sync', 'community', Object.assign({
      dataFormat: 'application/json'
    }, options));
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async getCommunity (id, options = {}) {
    await this.ready;
    const { record, status } = await this.readProtocolRecord(id, options)
    if (status.code > 299) return status;
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async setCommunityLogo(blob, community, options = {}) {
    let record = await this.getCommunityLogo(community.id, Object.assign({ from: community.author }, options));
    if (record) {
      await record.update({ data: blob })
    } else {
      ({ record } = await datastore.createProtocolRecord('sync', 'community/logo', {
        data: blob,
        parentId: community.id,
        contextId: community.id
      }))
    }
    await record.send(community.author);
    if (options.cache !== false && record) {
      record.cache = {
        blob: await record.data?.blob()?.catch(e => {})?.then(obj => obj),
        uri: URL.createObjectURL(blob)
      }
    }
    return record
  }

  async getCommunityLogo(communityId, options = {}) {
    const { records } = await this.queryProtocolRecords('sync', 'community/logo', Object.assign({ contextId: communityId }, options));
    if (options.cache !== false && records[0]) {
      const blob = await records[0].data?.blob()?.catch(e => {})?.then(obj => obj)
      records[0].cache = {
        blob,
        uri: URL.createObjectURL(blob)
      }
    }
    return records[0];
  }

  async getCommunities (options = {}) {
    const { records } = await this.queryProtocolRecords('sync', 'community', options)
    if (options.cache !== false) await cacheJson(records)
    return records;
  }

  async createChannel(community, options = {}) {
    if (community.author !== this.did) {
      options.role || 'community/admin';
    }
    const { record, status } = await this.createProtocolRecord('sync', 'community/channel', Object.assign({
      store: false,
      from: community.author,
      parentId: community.id,
      contextId: community.id,
      dataFormat: 'application/json'
    }, options));
    const { status: sendStatus } = await record.send(community.author);
    console.log(sendStatus);
    if (sendStatus.code > 299) return status;
    await record.store();
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async getChannels (communityId, options = {}) {
    const { records } = await this.queryProtocolRecords('sync', 'community/channel', Object.assign({ parentId: communityId, contextId: communityId }, options))
    if (options.cache !== false) await cacheJson(records)
    console.log(records);
    return records;
  }

  async getChannelMessages (channelId, options = {}) {
    const response = await this.queryProtocolRecords('sync', 'community/channel/message', Object.assign({ parentId: channelId, sort: 'createdAscending' }, options))
    if (options.cache !== false) await cacheJson(response.records)
    return response.records;
  }

  async createChannelMessage(communityId, channelId, options = {}) {
    const { record, status } = await this.createProtocolRecord('sync', 'community/channel/message', Object.assign({
      contextId: communityId,
      parentId: channelId,
      dataFormat: 'application/json'
    }, options));
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async createConvo(communityId, options = {}) {
    const { record, status } = await this.createProtocolRecord('sync', 'community/convo', Object.assign({
      contextId: communityId,
      parentId: communityId,
      dataFormat: 'application/json'
    }, options));
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async getConvos (communityId, options = {}) {
    const { records } = await this.queryProtocolRecords('sync', 'community/convo', Object.assign({ parentId: communityId, contextId: communityId }, options))
    if (options.cache !== false) await cacheJson(records)
    return records;
  }

  async addMember(recipient, communityId, options = {}) {
    const { record, status } = await this.createProtocolRecord('sync', 'community/member', Object.assign({
      recipient,
      parentId: communityId,
      contextId: communityId,
      dataFormat: 'application/json'
    }, options));
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async getMember (recipient, communityId, options = {}) {
    const { records } = await this.queryProtocolRecords('sync', options.protocolPath || 'community/member', Object.assign({ recipient, parentId: communityId }, options))
    return records[0];
  }

  async getMembers (communityId, options = {}) {
    const { records } = await this.queryProtocolRecords('sync', options.protocolPath || 'community/member', Object.assign({ parentId: communityId }, options))
    if (options.cache !== false) await cacheJson(records)
    return records;
  }

  async getAdmins (communityId, options = {}) {
    const { records } = await this.queryProtocolRecords('sync', options.protocolPath || 'community/admin', Object.assign({ parentId: communityId }, options))
    return records;
  }

  async sendInvite(recipient, link, options = {}) {
    if (!options.skipCheck) {
      let invite = await this.getActiveInvite(link, { recipient });
      if (invite) return invite;
    }
    const { record, status: recordStatus } = await this.createProtocolRecord('sync', 'invite', Object.assign({
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

  async getActiveInvite (link, options = {}) {
    const { records } = await this.queryProtocolRecords('sync', 'invite', options)
    let count = records.length;
    if (count === 0) return null;
    return await Promise.race(
      records.map(async record => new Promise(async (resolve, reject) => {
        if (!record.isDeleted) {
          await cacheJson(record);
          if (record.cache.json.link === link) {
            resolve(record);
            return;
          }
        }
        if (!--count) reject();
      }))
    ).catch(e => null)
  }

  async deactivateInvite(id, options = {}){

  }

  async getInvites (options = {}) {
    const { records } = await this.queryProtocolRecords('sync', 'invite', options)
    if (options.cache !== false) await cacheJson(records)
    return records;
  }

  // async toggleFollow(did, follow){
  //   await datastore.queryFollows({ recipient: did, latestRecord: true }).then(async (record) => {
  //     if (record) {
  //       console.log(record);
  //       if (follow && record.isDeleted) record.update();
  //       else if (!follow) {
  //         const { record: deleted } = await this.dwn.records.delete({
  //           message: {
  //             recordId: record.id,
  //           }
  //         });
  //         record = deleted;
  //       }
  //       return record;
  //     }
  //     else {
  //       const { record, status } = await datastore.createProtocolRecord('sync', 'follow', { recipient: did, dataFormat: 'application/json' })
  //       return record;
  //     }
  //   })
  // }

}


export {
  Datastore
}