import { LitElement, html, css, nothing } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import PageStyles from '../styles/page.css' assert { type: 'css' };

import { DOM, notify, natives } from '../utils/helpers.js';
import Follows from '../utils/follows.js'
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
      padding: 3em 1.5em;
    }

    #results > profile-card {
      margin: 0 0 1.5em;
      cursor: pointer;
    }

    `
  ]

  @query('#search_input', true)
  searchInput;

  @query('#results', true)
  results;

  async firstUpdated(){
    await this.context.initialize;
    this.follows = Follows.getInstance();
    await this.follows.initialize;
    this.requestUpdate();
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
          this?.follows?.entries ? Array.from(this.follows.entries).map(record => html`
            <profile-card did="${record.recipient}" remove-unfollowed follow-button following @click="${e => {
              router.navigateTo(`/profiles/${record.recipient}`)
            }}"></profile-card>
          `) : nothing
        }</div>
      </section>
    `;
  }
}
