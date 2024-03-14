import { LitElement, html, css, render, nothing, unsafeCSS } from 'lit';
import { consume } from '@lit/context';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { AppContext } from '../utils/context.js';

import { DOM, notify } from '../utils/helpers.js';
import date from  '../utils/date';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner';

import { ProfileCard } from './components/profile-card'

import PageStyles from  '../styles/page.css';
const transitionDuration = 300;

@customElement('member-list')
export class MemberList extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  app;

  static styles = [
    unsafeCSS(PageStyles),
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

      /* #spinner {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        background: var(--sl-panel-background-color);
        inset: 0;
        opacity: 0;
        transition: opacity 300ms ease;
        z-index: 1000;
        pointer-events: none;
      }

      #spinner[show] {
        opacity: 1;
        pointer-events: all;
      } */

    `
  ]

  @property({ type: String })
  path;

  @property({ type: String })
  context;

  @property({ type: Array })
  members = [];

  @query('#list', true)
  list;

  firstUpdated(props){
    this.list.renderer = this.renderMember.bind(this);
  }

  willUpdate(props) {
    if (props.has('path') || props.has('context')) {
      if (this.path && this.context && props.get('context') !== this.context) {
        this.loadMembers();
      }
    }
  }

  async loadMembers(){
    this.startSpinner(null, { minimum: transitionDuration });
    this.members = (await Promise.all([
      datastore.getMembers(this.context, { protocolPath: this.path }),
      DOM.delay(transitionDuration)
    ]))[0]
    if (this.list) this.list.items = [...this.members];
    this.stopSpinner();
  }

  renderMember(root, list, { item: record, index }) {
    const data = record.cache.json;
    render(
      html`<profile-card did="${record.recipient}" minimal @click="${e => this.app.instance.viewUserProfile(record.recipient) }"></profile-card>`,
      root
    );
  };

  render() {
    return html`
      <vaadin-virtual-list id="list" .items="${this.members}"></vaadin-virtual-list>
    `;
  }
}
