import { LitElement, html, css, render, unsafeCSS } from 'lit';
import { consume } from '@lit/context';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, query, property } from 'lit/decorators.js';

import * as markdown from  '../utils/markdown.js';

import { AppContext } from '../utils/context.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner';

import './message-item.js'
import './message-input.js'
import './markdown-editor.js'

import '@vaadin/message-input/theme/lumo/vaadin-message-input.js';
import '@vaadin/message-list/theme/lumo/vaadin-message.js';
import { VirtualList } from '@vaadin/virtual-list';

Object.defineProperty(VirtualList, 'template', {
  get: function() {
    const template = document.createElement('template');
          template.innerHTML = `
            <div id="items" style="overflow-anchor: none;">
              <slot></slot>
            </div>
            <div style="height: 1px; overflow-anchor: auto;"></div>
          `;
    return template;
  }
});

import PageStyles from '../styles/page.css' assert { type: 'css' };
import { DOM, notify } from '../utils/helpers.js';
import date from  '../utils/date.js';

const transitionDuration = 400;

@customElement('community-channel')
export class CommunityChannel extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  context;

  static styles = [
    PageStyles,
    SpinnerStyles,
    markdown.styles,
    css`

      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      #header {
        display: flex;
        align-items: center;
        min-height: 3em;
        padding: 0 1em;
        background: rgba(255,255,255,0.075);
        box-shadow: 0 0 3px 0px rgba(0,0,0,0.5);
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }

      #header h3 {
        margin: 0;
      }

      #header h3:before {
        content: '# ';
      }

      #messages_wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: auto;
      }

      #message_list {
        position: relative;
        flex: 1;
        padding: 1em 0.25em;
      }

      #message_list * {
        overflow-anchor: none;
      }

      message-item {
        margin: 0.6em 1em;
      }

      vaadin-message::part(content) {
        font-size: 90%;
      }

      #message_input {
        margin: 1em;
      }

      .spinner-mixin {
        background: var(--body-bk);
        transition-duration: ${transitionDuration}ms;
      }

      @media(max-width: 500px) {

      }
    `
  ]

  @property({ type: Array })
  messages = [];

  @property({ type: String })
  community;

  @property({ type: String })
  channel;

  @query('#message_list', true)
  messageList;

  @query('#message_input', true)
  messageInput;

  @query('#spinner', true)
  spinner;

  firstUpdated(){
    this.messageList.renderer = this.renderMessage;
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('channel')) {
      clearInterval(this.#messagePoller);
      this.loadMessages();
    }
  }

  async loadMessages(){
    if (!this.channel) {
      this.messages = [];
      return;
    }
    await this.startSpinner('#messages_wrapper', { minimum: transitionDuration });
    this.messages = await this.getLatestMessages()
    if (this.messageList) this.messageList.items = [...this.messages];
    this.stopSpinner('#messages_wrapper');
    this.#messagePoller = setInterval(async () => {
      this.messages = await this.getLatestMessages()
    }, 3000);
  }

  private #messagePoller;
  async getLatestMessages(since){
    const options = { from: this.context.community.author, contextId: this.community };
    if (this.context.community.author !== this.context.did) { // TODO: account for whether they are an admin
      options.role = 'community/member';
    }
    return datastore.getChannelMessages(this.channel, options);
  }

  async submitMessage(e){
    console.log(e);
    const message = e.detail.value;
    const host = this.context.community.author;
    const options = {
      contextId: this.community,
      data: {
        body: message
      }
    };
    if (this.context.community.author !== this.context.did) { // TODO: account for whether they are an admin
      options.role = 'community/member';
    }
    const record = await datastore.createChannelMessage(this.community, this.channel, options);
    await record.send(host);
    this.messageInput.content = '';
    this.messageList.items = this.messages = this.messages.concat([record]);
    this.messageList.requestContentUpdate();
  }

  renderMessage(root, list, { item: record, index }) {
    const data = record.cache.json;
    render(
      html`
        <message-item did="${record.author}" time="${date.print(record.dateCreated, true)}">
          ${markdown.render(data.body)}
        </message-item>
      `,
      root
    );
  };

  render() {
    const channelData = this.context?.community?.channels?.get?.(this.channel)?.cache?.json;
    return html`
      <header id="header">
        ${channelData?.name ? html`<h3>${channelData.name}</h3>` : '' }
      </header>
      <div id="messages_wrapper">
        <vaadin-virtual-list id="message_list" .items="${this.messages}"><div anchor></div></vaadin-virtual-list>
        <!-- <message-input id="message_input" @message-input-submit="${this.submitMessage}"></message-input> -->
        <markdown-editor id="message_input" submit @markdown-editor-submit="${this.submitMessage}"></markdown-editor>
      </div>
    `;
  }

}