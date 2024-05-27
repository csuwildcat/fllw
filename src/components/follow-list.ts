import { LitElement, html, css, render, nothing, unsafeCSS } from 'lit';
import { consume } from '@lit/context';
import { customElement, query, property } from 'lit/decorators.js';

import { AppContext } from '../utils/context.js';

import { DOM, notify } from '../utils/helpers.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner.js';

import { ProfileCard } from './components/profile-card.js'

import PageStyles from '../styles/page.css' assert { type: 'css' };
const transitionDuration = 300;

@customElement('follow-list')
export class FollowList extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  app;

  static styles = [
    PageStyles,
    SpinnerStyles,
    css`
      :host {
        position: relative
      }

      profile-card {
        margin: 0 0 1em;
        padding: 0.25em;
        border-radius: 4px;
        transition: background-color 0.25s ease;
        cursor: pointer;
      }

      profile-card:hover {
        background-color: rgba(255,255,255,0.1);
      }

    `
  ]

  @property({ type: String })
  path;

  @property({ type: String })
  context;

  @property({ type: Array })
  items = [];

  @query('#list', true)
  list;

  firstUpdated(props){
    this.list.renderer = this.renderItem.bind(this);
  }

  willUpdate(props) {
    if (props.has('path') || props.has('context')) {
      if (this.path && this.context && props.get('context') !== this.context) {
        this.load();
      }
    }
  }

  async load(){
    this.startSpinner(null, { minimum: transitionDuration });
    this.items = (await Promise.all([
      datastore.queryFollows({
        pagination: { limit: 10 }
      }),
      DOM.delay(transitionDuration)
    ]))[0]
    if (this.list) this.list.items = [...this.items];
    this.stopSpinner();
  }

  renderItem(root, list, { item: record, index }) {
    const data = record.cache.json;
    render(
      html`<profile-card did="${record.recipient}" minimal @click="${e => console.log(e) }"></profile-card>`,
      root
    );
  };

  render() {
    return html`
      <vaadin-virtual-list id="list" .items="${this.items}"></vaadin-virtual-list>
    `;
  }
}
