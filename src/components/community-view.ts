import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { consume } from '@lit/context';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { AppContext } from '../utils/context.js';

import { DOM, notify, natives } from '../utils/helpers.js';
import './global.js'

import PageStyles from  '../styles/page.css';

import './w5-img.js'
import './invite-item.js';

@customElement('community-view')
export class CommunityView extends LitElement {

  @consume({context: AppContext, subscribe: true})
  context;

  static styles = [
    unsafeCSS(PageStyles),
    css`

      :host {
        display: block;
        max-width: 600px;
        cursor: default;
      }

      sl-tab-panel {
        margin-top: 2em;
      }

      form {
        max-width: 600px;
        margin: 0 auto;
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

  @property({ type: String, reflect: true })
  did;

  @query('#profile_form', true)
  profileForm;

  @query('#profile_image_input', true)
  logoInput;

  static properties = {
    communityData: {
      type: Object
    },
    logoUri: {
      type: String
    }
  }

  communityRecord: any;
  logoRecord: any;

  constructor() {
    super();
    this.communityData = {
      name: '',
      description: '',
    }
  }

  willUpdate(props) {
    if (props.has('did')) {
      this.loadProfile();
    }
  }

  async loadProfile(){
    this.profileForm.toggleAttribute('loading', true);
    if (this.context.community) {
      this.communityRecord = this.context.community
      this.logoRecord = this.context.community.logo
      this.communityData = {
        name: this.communityRecord.cache.json.name || '',
        description: this.communityRecord.cache.json.description || ''
      };
      this.logoUri = this.logoRecord?.cache.uri || ''
    }

    this.profileForm.removeAttribute('loading');
  }

  async handleFileChange(e){
    const file = this.logoInput.files[0];
    const blob = file ? new Blob([file], { type: file.type }) : undefined;
    try {
      const logoRecord = await datastore.setCommunityLogo(blob, this.communityRecord);
      this.context.instance.setCommunityLogo(this.communityRecord, logoRecord);
      this.logoUri = logoRecord.cache.uri
      notify.success('Community logo was saved')
    }
    catch(e) {
      console.log(e)
      notify.error('There was a problem saving community logo')
    }
  }

  async saveCommunitySettings(e){
    if (this.communityRecord) {
      const formData = new FormData(this.profileForm);
      for (const entry of formData.entries()) {
        natives.deepSet(this.communityData, entry[0], entry[1] || undefined);
      }
      try {
        this.communityRecord.update({ data: this.communityData })
        notify.success('Community settings were saved')
      }
      catch(e) {
        console.log(e)
        notify.error('There was a problem saving community settings')
      }
    }
  }

  render(){
    return html`
      <sl-tab-group id="tabs" @sl-tab-show="${e => this.panel = e.detail.name}">
        <sl-tab slot="nav" panel="settings">Settings</sl-tab>

        <sl-tab-panel name="settings">
          <form id="profile_form" loading @sl-change="${e => this.saveCommunitySettings(e)}" @submit="${e => e.preventDefault()}">

            <div id="profile_image_container" @click="${e => e.currentTarget.lastElementChild.click()}">
              <w5-img id="profile_image" src="${ifDefined(this.logoUri)}" fallback="person"></w5-img>
              <small>(click to change image)</small>
              <input id="profile_image_input" type="file" accept="image/png, image/jpeg, image/gif" style="display: none"  @change="${this.handleFileChange}" />
            </div>

            <sl-input name="name" value="${this.communityData.name}" label="Community name" help-text="A public name for the community, visible to everyone"></sl-input>
            <sl-textarea name="description" value="${this.communityData.description}" label="Description" help-text="Tell people a little about this community" maxlength="280" rows="4" resize="none"></sl-textarea>
          </form>
        </sl-tab-panel>

    `
  }

}
