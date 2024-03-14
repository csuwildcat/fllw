import { LitElement, html, css, unsafeCSS, nothing  } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';

import * as markdown from  '../utils/markdown.js';

import PageStyles from  '../styles/page.css';
import { DOM } from '../utils/helpers.js';
import './global.js'

import './w5-img.js'

@customElement('message-item')
export class MessageItem extends LitElement {
  static styles = [
    unsafeCSS(PageStyles),
    markdown.styles,
    css`
      :host {
        display: flex;
        --avatar-size: 2.25em;
      }

      #content {
        display: flex;
        flex-direction: column; /* Stacks the header above the body */
        justify-content: flex-start; /* Aligns content at the start */
        width: calc(100% - var(--avatar-size) - 0.5em);
        margin-left: 0.5em;
      }

      #avatar {
        --size: var(--avatar-size);
        border-radius: 10em;
        /*
          border: 2px solid #aaa;
          box-shadow: 0 1px 3px 1px rgba(0,0,0,0.9)
        */
      }

      #content > header {
        display: flex;
        margin: 0 0 0.2em;
        font-size: 80%;
        opacity: 0.5;
      }

      #author {
        min-width: 125px;
        max-width: 200px;
        padding: 0 0.5em 0 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      #content > header time {
        font-size: 85%;
        text-wrap: nowrap;
      }

      #message {
        margin: 0.4em 0.1em;
      }
    `
  ]

  static properties = {
    did: {
      type: String
    },
    avatar: {
      type: String
    },
    name: {
      type: String
    },
    time: {
      type: String
    }
  };

  willUpdate(props){
    if (props.has('did') && this.did) {
      this.loadAuthor();
    }
  }

  async loadAuthor(){
    const avatar = await datastore.readAvatar({ from: this.did });
    this.avatar = avatar.cache.uri;
  }

  render() {
    return html`
      <w5-img id="avatar" src="${this.avatar || nothing}" fallback="person"></w5-img>
      <div id="content">
        <header>
          <div id="author">
            <span>${this.name || ''}</span>
            <span>${this.did}</span>
          </div>
          <time datetime="${this.time}">${this.time}</time>
        </header>
        <div id="message">
          <slot></slot>
        </div>
      </div>
    `
  }
}
