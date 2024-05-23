import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { AppContext } from '../utils/context.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner.js';
import { DOM, notify, natives } from '../utils/helpers.js';

import PageStyles from '../styles/page.css' assert { type: 'css' };

@customElement('page-directory')
export class PageDirectory extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  context;

  static styles = [
    PageStyles,
    SpinnerStyles,
    css`

      #search_bar {
        position: sticky;
        top: var(--header-height);
        left: 0;
        right: 0;
        padding: 0.75em 0.75em 0.7em;
        background: rgba(50, 50, 50, 0.6);
        border-bottom: 1px solid rgba(100,100,100,0.1);
        backdrop-filter: blur(10px) saturate(100%);
        -webkit-backdrop-filter: blur(10px) saturate(100%);
        z-index: 2;
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

      #profile_view {
        opacity: 0;
        margin: 3em auto;
        transition: opacity 0.3s ease 1s;
        z-index: 0;
      }

      #profile_view[loaded] {
        opacity: 1;
      }

      #profile_view[loaded] ~ #placeholder {
        opacity: 0;
        pointer-events: none;
      }

      .spinner-mixin {
        z-index: 1;
      }

    `
  ]

  @query('#profile_view', true)
  profileView;

  @query('#did_input', true)
  didInput;

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

  lookupProfile(did){
    did = did || this.didInput.value;
    if (did === this.profileView.did) {
      return;
    }
    else if (did === this.context.did) {
      router.navigateTo(`/profiles/${did}`);
    }
    else {
      this.startSpinner(null, { minimum: 1000 });
      this.profileView.did = did
    }
  }

  render() {
    return html`
      <div id="search_bar" flex="center-y center-x">
        <sl-input id="did_input"
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
      <profile-view id="profile_view" did="${this.did || nothing}" @profile-view-load-complete="${e => this.stopSpinner()}"></profile-view>
      <div id="placeholder" default-content="cover placeholder">
        <sl-icon name="search"></sl-icon>
        <p>Enter a DID above to view a profile.</p>
      </div>
    `;
  }
}
