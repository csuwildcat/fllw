import { LitElement, html, css, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { DOM, notify } from '../utils/helpers.js';
import { profile as profileProtocol } from '../utils/protocols.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner.js';
import  {verifyVc} from '../utils/ucw.js'
import './global.js'

import '../components/w5-img'
import { Datastore } from '../utils/datastore.js';

@customElement('profile-card')
export class ProfileCard extends SpinnerMixin(LitElement) {
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
          transition: opacity 0.2s ease;
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

        small {
          margin: 0 0 0.2em;
          color: #777;
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
        white-space: pre-wrap;
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
    did: {
      type: String,
      reflect: true
    },
    minimal: {
      type: Boolean
    },
    vertical: {
      type: Boolean
    },
    errorText: {
      attribute: 'error-text',
      type: String
    },
    emptyText: {
      attribute: 'empty-text',
      type: String
    },
    verified_name: {
      type: String
    },
  };

  verified_name: string;

  static instances = new Set();

  connectedCallback(){
    super.connectedCallback();
    ProfileCard.instances.add(this);
  }

  disconnectedCallback(){
    super.disconnectedCallback();
    ProfileCard.instances.delete(this)
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('did') && this.did) {
      this.loadDid();
    }
  }

  async loadDid(){
    this.removeAttribute('error')
    this.setAttribute('loading', '')
    this.startSpinner();
    const did = this.did;
    DOM.fireEvent(this, 'profile-card-loading', {
      detail: {
        input: did
      }
    });
    try {
      const social = await datastore.getSocial({ from: did })
      const credential = await datastore.getCredential({ from: did })
      this.socialData = social.cache.json || {};
      this.credentialData = credential.cache.json || {};
      this.requestUpdate();
      await DOM.skipFrame();
      this.removeAttribute('loading')
      this.stopSpinner();
      DOM.fireEvent(this, 'profile-card-loaded', {
        detail: {
          input: did
        }
      })
    }
    catch(e){
      this.setAttribute('error', '')
      this.removeAttribute('loading')
      this.stopSpinner();
      DOM.fireEvent(this, 'profile-card-error', {
        detail: {
          input: did
        }
      })
    }
  }
  async verify(vc){
    console.log('verify')
    if(vc){
      this.verified_name = await verifyVc(null, vc, this.did);
      if(!this.verified_name){
        notify.error('Unable to get the verified name')

      }
    }
  }

  render() {
    return html`
      <slot name="start"></slot>
      <w5-img part="image" src="${this.did ? `https://dweb/${this.did}/read/protocols/${encodeURIComponent(profileProtocol.uri)}/avatar` : nothing}" fallback="person"></w5-img>
      <div id="content">
        <h3 part="name">${this?.socialData?.displayName || 'Anon'} &nbsp;&nbsp;
        ${this.credentialData?.raw_vc && !this.verified_name
          ? html`<sl-button class="edit-button" size="small" @click="${e => this.verify(this.credentialData?.raw_vc)}">
            Click to Verify
          </sl-button>` 
          : html`<small name="verified_name">Verified as ${this.verified_name}</small>`
        }
        </h3>
        <slot name="subtitle"></slot>
        ${ !this.minimal && this?.socialData?.bio ? html`<p>${this.socialData.bio}</p>` : nothing }
        <slot name="content-bottom"></slot>
      </div>
      <slot name="after-content"></slot>
      <slot name="end"></slot>
      ${this.emptyText ? html`<div id="empty_text" data-value="${this.emptyText || '' }"></div>` : ''}
      ${this.error ? html`<div id="error_text" data-value="${this.error && this.errorText || "Couldn't find anything for that" }"></div>` : ''}
    `;
  }
}
