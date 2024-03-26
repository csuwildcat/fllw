import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { DOM, notify, natives } from '../utils/helpers.js';

import PageStyles from  '../styles/page.css';

@customElement('page-directory')
export class PageDirectory extends LitElement {
  static styles = [
    unsafeCSS(PageStyles),
    css`

      #search_bar {
        padding: 0.75em 0.75em 0.7em;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }

      #search_bar sl-input {
        width: 100%;
        max-width: 400px;
        margin: 0 0.5em 0 0;
        transition: transform 0.4s ease;
      }

      #placeholder {
        transition: opacity 0.3s ease;
        z-index: -1;
      }

      profile-view[loaded] ~ #placeholder {
        opacity: 0;
        pointer-events: none;
      }

    `
  ]

  static properties = {
    did: {
      type: String
    }
  }

  constructor() {
    super();
  }

  async initialize(){

  }

  lookupProfile(){

  }

  render() {
    return html`
      <div id="search_bar" flex="center-y center-x">
        <sl-input id="did_search_input"
                  required
                  size="small"
                  placeholder="Enter a DID to view a profile"
                  pattern="did:dht:[a-zA-Z0-9]+"
                  @keydown="${ e => e.key === 'Enter' && this.lookupProfile() }"
                  @keypress="${ e => {
                    return !(/^[a-zA-Z0-9_\-:.]+$/.test(String.fromCharCode(e.charCode || e.which))) ? e.preventDefault() : true
                  }}"
        ></sl-input>
        <sl-button variant="primary" size="small" @click="${ e => this.lookupProfile() }" slot="suffix">Find</sl-button>
      </div>
      <profile-view did="${this.did}"></profile-view>
      <div id="placeholder" default-content="cover placeholder">
        <sl-icon name="search"></sl-icon>
        <p>Enter a DID above to view a profile.</p>
      </div>
    `;
  }
}
