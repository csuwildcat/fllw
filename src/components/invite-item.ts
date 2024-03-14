import { LitElement, html, css, nothing } from 'lit';
import { consume } from '@lit/context';
import { customElement, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { AppContext } from '../utils/context.js';

import { DOM, natives, notify } from '../utils/helpers.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner.js';
import './global.js'

import './w5-img.js'

async function getCommunity(drl){
  return await datastore.getCommunity(drl.path.community, { from: drl.did, role: 'community/member' });
}

@customElement('invite-item')
export class InviteItem extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  context;

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

      w5-img {
        margin: 0 1rem 0 0;
        border: 2px solid rgba(200, 200, 230, 0.5);
        border-radius: 0.2rem;
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

      p {
        margin: 0.3em 0 0;
      }

      #empty_text, #error_text {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        inset: 0;
        opacity: 0;
        z-index: 1000;
        pointer-events: none;
      }

      #empty_text:before,
      #error_text:before {
        content: attr(data-value);
      }

      :host(:not([drl])) *:not(#empty_text),
      :host([error]) *:not(#error_text),
      :host([loading]) *:not(.spinner-mixin) {
        opacity: 0;
        pointer-events: none;
      }

      :host(:not([drl])) #empty_text,
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
    drl: {
      type: String,
      reflect: true
    },
    invite: {
      type: Object,
      attribute: false
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

  @query('#install_button', false)
  installButton;

  willUpdate(changedProperties) {
    if (changedProperties.has('invite') && this.invite) {
      this.drl = natives.drl.parse(this.invite.cache.json.link, '/:did/protocols/:protocol/communities/:community');
      this.loadInvite();
    }
  }

  async loadInvite(){
    this.error = false;
    this.loading = true;
    this.startSpinner();
    const drl = this.drl;
    try {
      const record = await getCommunity(drl);
      if (this.drl === drl) {
        this.community = record;
        this.requestUpdate();
      }
    }
    catch (e){
      this.error = true;
    }
    this.loading = false;
    this.stopSpinner();
  }

  async installCommunity(){
    if (!this.community) return;
    this.installButton.loading = true;
    try {
      await this.context.instance.installCommunity(this.community.id, this.drl.did, this.community);
      await this.invite.update({ data: this.invite.cache.json });
      await this.invite.send(this.context.did);
    }
    catch(e){
      console.log(e);
    }
    this.installButton.loading = false;
  }


  render() {
    const communityData = this.community?.cache?.json || {};
    return html`
      <w5-img part="image" src="${ ifDefined(this.avatarDataUri) }" fallback="people"></w5-img>
      <div id="content">
        <h3 part="name">${ communityData.name || 'Unknown Community' }</h3>
        ${ communityData.description ? html`<p>${this.description}</p>` : nothing }
      </div>
      <sl-button id="install_button" variant="default" size="small" @click="${ e => this.installCommunity(e) }">
        <sl-icon slot="prefix" name="plus"></sl-icon>
        Add Community
      </sl-button>
      <div id="empty_text" data-value="${this.emptyText || '' }"></div>
      <div id="error_text" data-value="${this.error && this.errorText || "Couldn't find anything for that" }"></div>
    `;
  }
}
