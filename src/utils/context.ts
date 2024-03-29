import { createContext, provide } from '@lit/context';

import { Web5 } from '@web5/api';
import { Datastore } from './datastore.js';

const initialState = {
  instance: null,
  did: null,
  avatar: null,
  social: null,
  career: null,
  drafts: [],
};

async function importLatestRecords(did, current, latest){
  const filtered = new Map();
  await Promise.all(latest.reduce((promises, record) => {
    if (!current.has(record.id)) {
      promises.push(record.import().then(() => record.send(did)))
    }
    filtered.set(record.id, record);
    return promises;
  }, []));
  return filtered;
}

export const AppContext = createContext(initialState);

export const AppContextMixin = (BaseClass) => class extends BaseClass {

  constructor(){
    super();
    this.context = {
      instance: this,
      did: null,
      avatar: null,
      social: null,
      career: null,
      drafts: new Map(),
    }
  }

  async createIdentity(load){
    const { web5, did } = await Web5.connect({
      techPreview: {
        dwnEndpoints: ['http://localhost:3000']
      }
    });
    console.log(did);
    globalThis.userDID = did;
    globalThis.datastore = new Datastore({
      web5,
      did
    });
    if (load) {
      this.loadProfile(did);
    }
  }

  async getIdentity(_did){
    const { web5, did } = await Web5.connect({
      techPreview: {
        dwnEndpoints: ['http://localhost:3000']
      }
    });
    console.log(did);
    globalThis.userDID = did;
    globalThis.datastore = new Datastore({
      web5,
      did
    });
    return did;
  }

  async loadProfile(did){
    if (did === this.context.did) return;
    this.context.did = localStorage.did = await this.getIdentity(did);
    return this.context.profileReady = new Promise(async resolve => {
      const records = await Promise.all([
        datastore.setAvatar(null, null, did),
        await datastore.getSocial({ from: did }) || datastore.createSocial({ data: {
          displayName: '',
          bio: '',
          apps: {}
        }, from: did }),
        await datastore.getCareer({ from: did }) || datastore.createCareer({ data: {
          jobs: [],
          skills: [],
          education: [],
        }, from: did }),
      ])
      this.updateState({
        did,
        avatar: records[0],
        social: records[1],
        career: records[2]
      });
      resolve(this.context.did);
    });
  }

  async setAvatar(file){
    const record = await datastore.setAvatar(file, this.context.avatar, this.context.did);
    this.updateState({ avatar: record });
    return record;
  }

  async setSocial(data){
    const record = this.context.social;
    await record.update({ data });
    record.send(this.context.did);
    this.updateState({ social: record });
    return record;
  }

  async setCareer(data){
    const record = this.context.career;
    await record.update({ data });
    record.send(this.context.did);
    this.updateState({ career: record });
    return record;
  }

  updateState(partialState, render?) {
    this.context = { ...this.context, ...partialState };
    if (render !== false) this.requestUpdate();
  }
}