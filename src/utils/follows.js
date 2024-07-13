
import { notify } from './helpers.js';

async function getFollow(did, options) {
  const response = await datastore.queryFollows(Object.assign({
    recipient: did
  }, options || {}))
  return response.records[0];
}

class Follows {

  cursor = null;
  entries = [];

  static instances = {};
  static getInstance(options) {
    const instance = Follows.instances[options?.from || 'owner'] || (Follows.instances[options?.from || 'owner'] = new Follows(options));
    console.log(instance);
    return instance;
  }

  static async checkFollow(did, options){
    return !!(await getFollow(did, options));
  }

  constructor(options = {}){ 
    this.options = options || {};
    this.initialize = this.getFollows();
  }

  async getFollows(){
    const { records, cursor } = await datastore.getFollows(this.cursor, this.options);
    if (records.length) {
      this.entries.push(...records);
    }
    this.cursor = cursor;
  }

  async getFollow(did){
    return await getFollow(did, this.options);
  }

  async toggleFollow(did, _notify = true){
    const record = await datastore.toggleFollow(did);
    const state = !!record;
    if (!state) {
      this.entries = this.entries.filter(entry => entry.recipient !== did);
    }
    if (_notify) notify.success(state ? 'Follow added' : 'Follow removed');
    return state;
  }
}

export default Follows;



