
import * as protocols from './protocols';
import { natives } from './helpers';

setInterval(() => Datastore.cache = {}, 1000 * 60 * 60)

async function cacheJson(records){
  await Promise.all((Array.isArray(records) ? records : [records]).map(async record => {
    record.cache = {
      json: await record.data?.json?.()?.catch(e => {})?.then(obj => obj || {})
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
    this.options = options;
    this.did = options.did;
    this.dwn = options.web5.dwn;
    this.ready = this.installProtocols();
  }

  async installProtocols(){
    const installed = await this.dwn.protocols.query({ message: {} });
    const configurationPromises = [];
    if (this.options.aggregator) {
      const structure = protocols.social.definition.structure;
      structure.story['$actions'] = structure.thread['$actions'] = [
        {
          who: 'anyone',
          can: ['create', 'update', 'delete']
        }
      ]
    }
    try {
      for (let z in protocols.byUri) {
        let record = installed.protocols.find(record => z === record.definition.protocol);
        let definition = protocols.byUri[z].definition;
        let appDef = natives.canonicalize(definition);
        let configuredDef = natives.canonicalize(record?.definition || null);
        if (appDef !== configuredDef) {
          console.log('installing protocol: ' + z);
          configurationPromises.push(this.dwn.protocols.configure({
            message: { definition }
          }))
        }
      }
      const configurationResponses = await Promise.all(configurationPromises);
      try {
        await Promise.all(configurationResponses.map(({ protocol }) => protocol.send(this.did)));
      }
      catch (e) {
        console.log('remote push of configuration failed', e);
        return true;
      }
    }
    catch (e) {
      console.log('local install of configuration failed', e);
      return false;
    }
    return true;
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
    if (options.recordId) {
      message.filter.recordId = options.recordId
    }
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
    return this.dwn.records.read(params);
  }

  async createProtocolRecord(protocol, path, options = {}){
    await this.ready;
    const params = {
      message: {
        protocol: protocols[protocol].uri,
        protocolPath: path
      }
    }
    const schema = protocols[protocol].schemas[path.split('/').pop()];
    if (schema) params.message.schema = schema;
    if (options.from) params.from = options.from;
    if (options.store === false) params.store = options.store;
    if (options.parentContextId) params.message.parentContextId = options.parentContextId;
    if (options.contextId) params.message.contextId = options.contextId;
    
    params.message.dataFormat = options.dataFormat || 'application/json';
    if (typeof options.data !== 'undefined') params.data = options.data;
    else if (options.dataFormat === 'application/json') {
      params.data = {};
    }
    
    if (options.published !== undefined) params.message.published = options.published;
    if (options.recipient) params.message.recipient = options.recipient;
    if (options.role) params.message.protocolRole = options.role;
    const response = await this.dwn.records.create(params);
    console.log('create status', response.status);
    if (options.store !== false) await response.record.send(options.from || this.did).then(e => {
      console.log('sent success', response.record);
    }).catch(e => {
      console.log('send error', e)
    });
    console.log(response.record);
    return response;
  }

  async getAggregators(options = {}){
    options.latestRecord = true;
    const { records } = await this.queryProtocolRecords('social', 'aggregators', options)
    const record = records[0];
    if (record) {
      await cacheJson(record);
    }
    return record;
  }

  async setAggregators(data, options = {}){
    let record;
    try {
      record = await this.getAggregators(options);
      if (record) await record.update({ data });
      else {
        const response = await this.createProtocolRecord('social', 'aggregators', {
          published: true,
          data,
          dataFormat: 'application/json'
        });
        record = response.record;
      }
      const { status } = await record.send(options.from);
    }
    catch(e) {
      console.log(e);
    }
    if (record) {
      await cacheJson(record);
    }
    return record;
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
    const record = await this.getProfileImage(type, options);
    if (record) {
      const drl = await natives.drl.fromRecord(record, true);
      record.cache = {
        uri: drl
      }
      Datastore.setCache(did, type, record);
    }
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

  async createStory(options = {}) {
    const { record, status } = await this.createProtocolRecord('social', 'story', {
      published: false,
      data: options.data || {},
      dataFormat: 'application/json'
    })
    if (options.cache !== false) await cacheJson(record)
    return record;
  }

  async deleteStory(recordId) {
    const response = await web5.dwn.records.delete({
      message: { recordId },
    });
    if (response.status > 399) throw 'Delete failed';
    return response;
  }

  async readStory(id, options = {}) {
    const { record, status } = await this.readProtocolRecord(id, options)
    if (status.code > 399) {
      const error = new Error(status.detail);
            error.code = status.code;
            error.detail = status.detail;
      throw error;
    }
    if (options.cache !== false) await cacheJson(record);
    return record;
  }

  async queryStories(options = {}){
    const response = await this.queryProtocolRecords('social', 'story', options);
    if (options.cache !== false) await cacheJson(response.records);
    return response;
  }

  async createStoryMedia(story, options = {}) {
    if (options.data) {
      options.dataFormat = options.data.type;
      if (options.data instanceof File) {
        options.data = new Blob([options.data], { type: options.dataFormat });
      }
    }
    options.published = true;
    options.parentContextId = story.id;
    const { record, status } = await this.createProtocolRecord('social', 'story/media', options)
    return record;
  }

  async readStoryMedia(id, options = {}) {
    const { record, status } = await this.readProtocolRecord(id, options);
    if (status.code > 399) {
      const error = new Error(status.detail);
            error.code = status.code;
            error.detail = status.detail;
      throw error;
    }
    if (options.cache !== false) {
      const drl = await natives.drl.fromRecord(record, true);
      record.cache = {
        uri: drl
      }
    }
    return record;
  }

  async setStoryHero(story, options = {}) {
    if (options.data) {
      options.dataFormat = options.data.type;
      if (options.data instanceof File) {
        options.data = new Blob([options.data], { type: options.dataFormat });
      }
    }
    options.published = true;
    let hero = story._hero;
    let data = story.cache.json;
    const heroId = data.hero;
    if (hero || heroId) {
      if (!hero){
        let response = await this.queryProtocolRecords('social', 'story/media', {
          recordId: heroId
        });
        hero = response.records[0];
      }
      const response = await hero.update({ data: options.data });
      hero.send(story.author);
    }
    else {
      options.parentContextId = story.id;
      const response = await this.createProtocolRecord('social', 'story/media', options);
      hero = response.record;
    }
    const drl = await natives.drl.fromRecord(hero, true);
    hero.cache = {
      uri: drl
    }
    if (heroId !== hero.id) {
      data.hero = hero.id;
      console.log(data);
      await story.update({ data });
      story.send(story.author);
    }
    return story._hero = hero;
  }

  async queryThreads(options = {}){
    const response = await this.queryProtocolRecords('social', 'thread', options);
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

  async getFollows(cursor, options = {}){
    if (cursor) {
      options.pagination = options.pagination || {};
      options.pagination.cursor = cursor;
    }
    return this.queryProtocolRecords('social', 'follow', options)
  }

  async toggleFollow(did, follow){
    var {records, status} = await datastore.queryFollows({ recipient: did })
    var record = records[0];
    if (!record) {
      const aggregatorRecord = await datastore.getAggregators({ from: did });
      var { record } = await datastore.createProtocolRecord('social', 'follow', { recipient: did, data: {
        aggregators: aggregatorRecord?.cache?.json?.aggregators || [],
        lastAggregatorFetch: aggregatorRecord?.dateModified || null
      }})
    }
    else if (record?.isDeleted) {
      record.update();
    }
    else if (!follow) {
      var { status } = await this.dwn.records.delete({
        message: {
          recordId: record.id,
        }
      });
      return false;
    }
    return record;
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