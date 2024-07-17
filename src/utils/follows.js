
import { notify, natives } from './helpers.js';

async function getFollow(did, options) {
  const response = await datastore.queryFollows(Object.assign({
    recipient: did
  }, options || {}))
  return response.records[0];
}

let ownerInstance;

class Follows extends EventTarget {

  cursor = null;
  entries = [];
  aggregators = {};

  static instances = {};
  static getInstance(options) { 
    const instance = options?.from ? new Follows(options) : ownerInstance || (ownerInstance = new Follows(options));
    return instance;
  }

  static async checkFollow(did, options){
    return !!(await getFollow(did, options));
  }

  constructor(options = {}){
    super(); 
    this.options = options || {};
    this.initialize = this.getFollows();
  }

  async getFollows(){
    const { records, cursor } = await datastore.getFollows(this.cursor, this.options);
    if (records.length) {
      if (this === ownerInstance) {
        Promise.all(records.map(async record => {
          const data = await record.data?.json?.()
          const aggregator = data?.aggregators?.[0];
          (this.aggregators[aggregator] || (this.aggregators[aggregator] = []))[record.author]
        }))
      }
      this.entries.push(...records);
    }
    this.cursor = cursor;
    this.dispatchEvent(new CustomEvent('follows-loaded', { detail: { records, cursor } }));
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



