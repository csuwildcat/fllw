import { LitElement, html, css, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { DOM } from '../utils/helpers.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner.js';
import './global.js'

import './w5-img.js'

@customElement('community-card')
export class CommunityCard extends SpinnerMixin(LitElement) {
  static styles = [
    SpinnerStyles,
    css`

      :host {
        position: relative;
        display: flex;
        max-width: 600px;
        border-radius: 0.2em;
        overflow: hidden;
        cursor: default;
      }

        :host * {
          transition: opacity 0.3s ease;
        }

        :host([minimal]) {
          align-items: center
        }

        :host([vertical]) {
          flex-direction: column;
        }

      w5-img {
        margin: 0 1rem 0 0;
        border: 2px solid rgba(200, 200, 230, 0.5);
        border-radius: 0.2rem;
      }

        :host([vertical]) w5-img {
          --size: 5rem;
          margin: 0 0 0.5rem;
        }

        :host([minimal]) w5-img {
          --size: 2.25rem;
          border-width: 1px;
        }

        :host([minimal]) w5-img::part(fallback) {
          font-size: 1.5rem;
        }

      #content {
        flex: 1;
        position: relative;
        margin: 0 1em 0 0;
      }

      h3 {
        margin: -0.1em 0 0;
        font-size: 110%;
        text-wrap: nowrap;
      }

        :host([minimal]) h3 {
          font-weight: normal;
        }

      p {
        margin: 0.3em 0 0;
      }

      slot[name="start"]:not(:slotted) {
        display: none;
      }

      slot[name="content-bottom"] {
        margin: 0.5em 0 0;
      }

      #empty_text, #error_text {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        inset: 0;
        opacity: 0;
        z-index: 1000;
      }

      #empty_text:before,
      #error_text:before {
        content: attr(data-value);
      }

      :host(:not([did])) *:not(#empty_text),
      :host([error]) *:not(#error_text),
      :host([loading]) *:not(.spinner-mixin) {
        opacity: 0;
        pointer-events: none;
      }

      :host(:not([did])) #empty_text,
      :host([error]) #error_text {
        opacity: 1;
        pointer-events: all;
      }

      .spinner-mixin {
        font-size: 1.5rem;
      }

    `
  ]

  static properties = {
    loading: {
      type: Boolean,
      reflect: true
    },
    host: {
      type: String,
      reflect: true
    },
    community: {
      type: String,
      reflect: true
    },
    minimal: {
      type: Boolean,
      reflect: true
    },
    vertical: {
      type: Boolean,
      reflect: true
    },
    error: {
      type: Boolean,
      reflect: true
    },
    errorText: {
      attribute: 'error-text',
      type: String,
      reflect: true
    },
    emptyText: {
      attribute: 'empty-text',
      type: String,
      reflect: true
    },
  };

  willUpdate(props) {
    if (props.has('community') && props.has('host')) {
      const did = this.host;
      this.error = false;
      this.loading = true;
      this.startSpinner();
      DOM.fireEvent(this, 'community-card-loading', {
        detail: {
          input: did
        }
      });
      Promise.all([
        datastore.readAvatar({ from: did }).then(async record => {
          this.avatarDataUri = record.cache.uri || undefined;
        }),
        datastore.getSocial({ from: did }).then(async record => {
          this.socialData = await record.cache.json || {};
        })
      ]).then(() => {
        if (this.host === did) this.requestUpdate();
        this.loading = false;
        this.stopSpinner();
        DOM.fireEvent(this, 'community-card-loaded', {
          detail: {
            input: did
          }
        })
      }).catch(e => {
        console.log(e);
        this.loading = false;
        this.stopSpinner();
        this.error = true;
        DOM.fireEvent(this, 'community-card-error', {
          detail: {
            input: did
          }
        })
      })
    }
  }

  render() {
    return html`
      <slot name="start"></slot>
      <w5-img part="image" src="${ ifDefined(this.avatarDataUri) }" fallback="person"></w5-img>
      <div id="content">
        <h3 part="name">${this?.socialData?.displayName || 'Anon'}</h3>
        <slot name="subtitle"></slot>
        ${ !this.minimal && this?.socialData?.bio ? html`<p>${this.socialData.bio}</p>` : nothing }
        <slot name="content-bottom"></slot>
      </div>
      <slot name="after-content"></slot>
      <slot name="end"></slot>
      <div id="empty_text" data-value="${this.emptyText || '' }"></div>
      <div id="error_text" data-value="${this.error && this.errorText || "Couldn't find anything for that" }"></div>
    `;
  }
}
