import { createContext, provide } from '@lit/context';

import { Web5 } from '@web5/api';
import { Datastore } from './datastore.js';
import * as follows from './follows.js';

const initialState = {
  instance: null,
  did: null,
  avatar: null,
  hero: null,
  social: null,
  career: null,
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
      connected: false,
      did: null,
      avatar: null,
      hero: null,
      social: null,
      career: null,
    }
  }

  async getIdentity(_did, loadProfile){
    const { web5, did } = await Web5.connect({
      techPreview: {
        dwnEndpoints: ['http://localhost:3000']
      }
    });
    console.log(did);
    globalThis.web5 = web5;
    globalThis.userDID = this.context.did = did;
    globalThis.datastore = new Datastore({
      web5,
      did
    });
    if (loadProfile) {
      await this.loadProfile(did);
    }
    return did;
  }

  async loadProfile(did){
    console.log(did);
    did = this.context.did = localStorage.did = await this.getIdentity(did);
    this.context.connected = localStorage.connected = true;
    const records = await Promise.all([
      datastore.setProfileImage('avatar', null, null, did),
      datastore.setProfileImage('hero', null, null, did),
      await datastore.getSocial({ from: did }) || datastore.createSocial({ data: {
        displayName: '',
        bio: '',
        apps: {}
      }, from: did }),
      await datastore.getCareer({ from: did }) || datastore.createCareer({ data: {
        jobs: [],
        skills: [],
        education: [],
      }, from: did })
    ])
    this.updateState({
      did,
      connected: true,
      avatar: records[0],
      hero: records[1],
      social: records[2],
      career: records[3],
    });
    return did;
  }

  async setProfileImage(type, file){
    const record = await datastore.setProfileImage(type, file, this.context[type], this.context.did);
    this.updateState({ [type]: record });
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