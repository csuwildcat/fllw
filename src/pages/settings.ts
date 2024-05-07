import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { DOM, notify, natives } from '../utils/helpers.js';
import '../components/w5-img'

import PageStyles from '../styles/page.css' assert { type: 'css' };
@customElement('page-settings')
export class PageSettings extends LitElement {
  static styles = [
    PageStyles,
    css`

      form {
        max-width: 600px;
      }

      form > :first-child {
        margin-top: 0;
      }

      #profile_image_container {
        display: inline-block;
        margin-bottom: 1.4em;
        cursor: pointer;
      }

      #profile_image {
        width: 7em;
        height: 7em;
        border: 2px dashed rgba(200, 200, 230, 0.5);
        border-radius: 6px;
      }

      #profile_image[loaded] {
        border-style: solid;
      }

      #profile_image::part(fallback) {
        font-size: 3em;
      }

      #profile_image_container small {
        display: block;
        margin: 0.7em 0 0;
        font-size: 0.65em;
        color: rgba(200, 200, 230, 0.5);
      }

      sl-input, sl-textarea {
        margin: 0 0 1em;
      }

      .label-on-left {
        --label-width: 5.5rem;
        --gap-width: 1rem;
      }

      .label-on-left + .label-on-left {
        margin-top: var(--sl-spacing-medium);
      }

      .label-on-left::part(form-control) {
        display: grid;
        grid: auto / var(--label-width) 1fr;
        gap: var(--sl-spacing-3x-small) var(--gap-width);
        align-items: center;
      }

      .label-on-left::part(form-control-label) {
        text-align: right;
      }

      .label-on-left::part(form-control-help-text) {
        grid-column-start: 2;
      }
    `
  ]

  static properties = {

  }

  constructor() {
    super();
    this.socialData = {
      displayName: '',
      bio: '',
      apps: {}
    }
  }



  render() {
    return html`
     
    `;
  }
}
