import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { DOM, notify, natives } from '../utils/helpers.js';
import '../components/profile-view';

import PageStyles from  '../styles/page.css';

@customElement('page-profile')
export class PageProfile extends LitElement {
  static styles = [
    unsafeCSS(PageStyles),
    css`

      :host {
        padding: clamp(1em, 8vw, 2.75em) clamp(1em, 6vw, 2em);
      }

      #placeholder {
        transition: opacity 0.3s ease;
        z-index: -1;
      }

      profile-view {
        min-height: 100%;
      }

      profile-view[loaded] ~ #placeholder {
        opacity: 0;
        pointer-events: none;
      }

      @media(max-width: 500px) {
        :host {
          padding: 0;
        }

        profile-view {
          border-radius: 0;
        }
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

  render() {
    return html`
      <profile-view did="${this.did || nothing}"></profile-view>
    `;
  }
}
