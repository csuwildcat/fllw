
let channelList = {};

class Channel {
  constructor(name) {
    channelList[name] = this;
    this.sender = new BroadcastChannel(name);
    this.receiver = new BroadcastChannel(name);
  }
  publish(message) {
    this.sender.postMessage(message);
  }
  subscribe(listener){
    this.receiver.addEventListener('message', listener);
  }
  unsubscribe(listener) {
    this.receiver.removeEventListener('message', listener);
  }
  close(){
    delete channelList[this.sender.name];
    this.sender.close();
    this.receiver.close();
  }
}

export const channels = new Proxy(channelList, {
  get(target, name) {
    return channelList[name] || new Channel(name);
  }
})