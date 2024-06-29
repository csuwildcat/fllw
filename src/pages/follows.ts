import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import PageStyles from '../styles/page.css' assert { type: 'css' };

import { DOM, notify, natives } from '../utils/helpers.js';
import '../components/profile-card'

@customElement('page-follows')
export class PageFollows extends LitElement {

  @consume({context: AppContext, subscribe: true})
  context;

  static styles = [
    PageStyles,
    css`

    #view_actions {
      display: flex;
      align-items: center;
    }

    #view_actions sl-input {
      flex: 1;
      margin: 0 0.5em 0 0;
    }

    #search_input {
      max-width: 500px;
    }

    :host > section {
      display: flex;
      justify-content: center;
    }

    #results {
      box-sizing: border-box;
      width: 100%;
      max-width: 500px;
      padding: 2em 1.5em;
    }

    #results > profile-card {
      margin: 0 0 1.5em;
    }

    `
  ]

  @query('#search_input', true)
  searchInput;

  @query('#results', true)
  results;

  @property({ type: Array })
  entries = [];

  @property({ type: Object })
  cursor = null;


  constructor() {
    super();
    // follows.initialize().then(() => {
    //   this.requestUpdate()
    // });
  }

  async firstUpdated(){
    await this.context.initialize;
    // document.addEventListener('follow-change', e => {
    //   const did = e.detail.did;
    //   const state = e.detail.following;
    //   if (did === this.profileModalDid) {
    //     this.profileModalExistingFollow = state;
    //     this.requestUpdate();
    //   }
    // })
    this.getFollows();
  }

  async getFollows(){
    const { cursor } = await datastore.getFollows(this.entries, this.cursor);
    this.cursor = cursor;
    console.log(this.entries);
  }

  search(value){
    if (value?.match(/^did:/)) this.searchDid()
    else this.searchFollows()
  }

  render() {
    return html`
      <header id="view_header">
        <div id="view_actions">
          <sl-input id="search_input" placeholder="Search your follows or enter a DID" size="small" autocomplete="on"></sl-input>
          <sl-button variant="primary" size="small" @click="${e => {
            this.search(this.searchInput.value)
          }}">
            <sl-icon slot="prefix" name="search"></sl-icon>
            Search
          </sl-button>
        </div>
      </header>
      <section>
        <div id="results">${
          Array.from(this.entries).map(record => html`<profile-card did="${record.recipient}" remove-unfollowed follow-button following></profile-card>`)
        }</div>
      </section>
    `;
  }
}
