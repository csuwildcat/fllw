import { LitElement, html, css, render, nothing, unsafeCSS } from 'lit';
import { consume } from '@lit/context';
import { customElement, query, property } from 'lit/decorators.js';

import { AppContext } from '../utils/context.js';

import { DOM, notify } from '../utils/helpers.js';
import { channels } from '../utils/broadcast.js';
import * as markdown from '../utils/markdown.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner.js';

import './w5-img'
import './story-item'

import PageStyles from '../styles/page.css' assert { type: 'css' };
const transitionDuration = 300;

@customElement('story-list')
export class StoryList extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  context;

  static styles = [
    PageStyles,
    SpinnerStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        position: relative;
      }

      story-item {
        padding: 1.5em 0.8em 1.5em;
        border-bottom: 2px dotted rgba(255 255 255 / 0.05);
      }

      story-item:last-of-type {
        border-bottom: none;
      }

    `
  ]

  @property({ type: String })
  did;

  @property({ type: Array })
  items = [];

  @property({ type: Number })
  limit = 10;

  @property({ type: Boolean, reflect: true, attribute: 'has-content' })
  hasContent = true;

  firstUpdated(){
    channels.recordUpdate.subscribe(e => this.updateRecord(e.data.record));
    DOM.addEventDelegate('story-deleted', 'story-item', e => {
      const index = this.items.findIndex(item => item.id === e.detail.id);
      if (index > -1) {
        this.items.splice(index, 1);
      }
    }, { container: this })
  }

  willUpdate(props) {
    if (props.has('did') && this.did) {
      this.load(true);
    }
  }

  async load(reset){
    await this.context.initialize;
    this.isOwnerList = this.did === this.context.did;
    if (reset) {
      this.items = [];
      this.cursor = null; 
    }
    this.startSpinner(null, { minimum: transitionDuration });
    await Promise.all([
      this.getStories(),
      DOM.delay(transitionDuration)
    ])
    this.hasContent = !!this.items.length;
    this.stopSpinner();
  }

  async getStories(){
    const options = {
      from: this.did,
      pagination: {
        limit: this.limit || 10,
      }
    };
    if (this.cursor) {
      options.pagination.cursor = this.cursor;
    }
    const { cursor, records } = await datastore.queryStories(options)
    this.cursor = cursor;
    if (cursor) this.toggleAttribute('more-content', !!cursor)
    if (records.length) {
      this.items = this.items.concat(records);
    }
  }

  async updateRecord(obj){
    const element = this.renderRoot.querySelector(`#${obj.recordId}`);
    if (element) {
      const record = await datastore.readStory(obj.recordId, this.isOwnerList ? {} : { from: this.did });
      element.record = record;
    }
  }

  render() {
    return html`
      <slot name="content-start"></slot>
      ${
        this.items.map(record => {
          return html`
            <story-item .record=${record} ?owner="${this.isOwnerList}"></story-item>
          `
        })
      }
      <slot name="content-end"></slot>
    `
  }
}
