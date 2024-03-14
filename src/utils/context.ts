import { createContext, provide } from '@lit/context';

const initialState = {
  instance: null,
  did: null,
  avatar: null,
  social: null,
  invites: [],
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
      invites: [],
    }
  }

  async loadProfile(did){
    if (did === this.context.did) return;
    this.context.did = did;
    clearInterval(this.context.inviteChron);
    return this.context.profileReady = new Promise(async resolve => {
      const records = await Promise.all([
        datastore.setAvatar(null, null, did),
        await datastore.getSocial({ from: did }) || datastore.createSocial({ data: {
          displayName: '',
          bio: '',
          apps: {}
        }, from: did }),
        this.loadInvites(did)
      ])
      this.context.inviteChron = setInterval(() => this.loadInvites(), 1000 * 30)
      this.updateState({
        did,
        avatar: records[0],
        social: records[1]
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

  async loadCommunities(){
    const communities = await datastore.getCommunities();
    await Promise.all(communities.map(async community => this.loadLogo(community)))
    this.updateState({
      communities: new Map(communities.map(community => [community.id, community]))
    })
  }

  async loadCommunity(){
    await Promise.all([
      this.loadLogo(),
      this.loadChannels(),
      this.loadConvos(),
    ])
    this.requestUpdate();
  }

  async loadLogo(community){
    community = community || this.context.community;
    const options = { from: community.author };
    if (this.context.did !== community.author) {
      options.role = 'community/member';
    }
    const logo = await datastore.getCommunityLogo(community.id, options);
    if (community === this.context.community) {
      community.logo = logo;
      this.updateState({ community });
    }
  }

  async loadChannels(){
    const community = this.context.community;
    community.channels = community.channels || new Map();
    const options = {};
    if (this.context.did !== community.author) {
      options.role = 'community/member';
    }
    const sourceRecords = await datastore.getChannels(community.id, Object.assign({ from: community.author }, options));
    const channels = await importLatestRecords(this.context.did, community.channels, sourceRecords);
    if (community === this.context.community) {
      community.channels = channels;
      this.updateState({ community });
    }
  }

  async loadConvos(){
    const community = this.context.community;
    community.channels = community.channels || new Map();
    const options = {};
    if (this.context.did !== community.author) {
      options.role = 'community/member';
    }
    const sourceRecords = await datastore.getConvos(community.id, {}) //, Object.assign({ from: community.author }, options));
    const convos = await importLatestRecords(this.context.did, community.convos, sourceRecords);
    if (community === this.context.community) {
      community.convos = convos;
      this.updateState({ community });
    }
  }

  async loadInvites(_did) {
    const did = this.context.did || _did;
    const invites = await datastore.getInvites({ from: did, recipient: did });
    this.updateState({ invites: invites });
  }

  async setCommunity(communityId, channelId?){
    if (!this.context.communities.size) return;
    clearInterval(this.context.communityChron);
    const community = this.context.communities.get(communityId);
    if (!community) {
      this.updateState({
        community: null,
        channel: null
      })
      return;
    }
    this.context.community = community;
    await this.loadCommunity();
    this.context.communityChron = setInterval(() => this.loadCommunity(), 1000 * 60)
    this.context.channel = null;
    this.context = { ...this.context };
    const channel = channelId || this.getChannel(community.id);
    if (channel) this.setChannel(channel, true);
  }

  async setCommunityLogo(community, logo){
    community = community === this.context.community ? this.context.community : this.context.communities.get(community);
    community.logo = logo;
    this.context = { ...this.context };
    this.requestUpdate();
  }

  async installCommunity(id, from){
    const [community, admins, member, channels] = await Promise.all([
      datastore.getCommunity(id, { from, role: 'community/member', cache: false }),
      datastore.getAdmins(id, { from, cache: false }),
      datastore.getMember(this.context.did, id, { from, cache: false }),
      datastore.getChannels(id, { from, role: 'community/member', cache: false })
    ]);
    await Promise.all([
      community.import(),
      admins.map(z => z.import()),
      member.import(),
      channels.map(z => z.import()),
    ].flat())
    await this.setCommunity(id);
    return community;
  }

  getChannel(community){
    let activeChannels = localStorage.activeChannels;
    return (activeChannels ? JSON.parse(activeChannels) : {})[community];
  }

  getChannels(){
    let activeChannels = localStorage.activeChannels;
    return activeChannels ? JSON.parse(activeChannels) : {};
  }

  async setChannel(channelId, isActive){
    const community = this.context.community;
    if (community) {
      let activeChannels = localStorage.activeChannels;
          activeChannels = activeChannels ? JSON.parse(activeChannels) : {};
      activeChannels[community.id] = channelId;
      localStorage.activeChannels = JSON.stringify(activeChannels);
      if (isActive) {
        this.updateState({ channel: channelId });
      }
    }
  }

  addCommunity(community) {
    const updatedMap = new Map(this.context.communities);
    updatedMap.set(community.id, community);
    this.updateState({ communities: updatedMap }, false);
    this.setCommunity(community.id);
  }

  addChannel(channel) {
    const community = this.context.community;
    const channels = community.channels = community?.channels || new Map();
    channels.set(channel.id, channel);
    this.setChannel(channel.id, true);
    this.updateState({ community });
  }

  addConvo(convo) {
    const community = this.context.community;
    const convos = community.convos = community?.convos || new Map();
    convos.set(convo.id, convo);
    this.updateState({ community });
  }

  updateState(partialState, render?) {
    this.context = { ...this.context, ...partialState };
    if (render !== false) this.requestUpdate();
  }
}