import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { DOM, notify, natives } from '../utils/helpers.js';
import '../components/profile-view';

import PageStyles from '../styles/page.css' assert { type: 'css' };

@customElement('page-profile')
export class PageProfile extends LitElement {
  static styles = [
    PageStyles,
    css`

      :host {
        display: flex;
        justify-content: center;
      }

      #placeholder {
        transition: opacity 0.3s ease;
        z-index: -1;
      }

      profile-view {
        flex: 1;
        margin: clamp(1.25em, 6vw, 2.75em) clamp(1em, 4vw, 2em);
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
          margin: 0;
          min-height: var(--content-height);
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
