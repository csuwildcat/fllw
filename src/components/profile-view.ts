import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { consume } from '@lit/context';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { AppContext } from '../utils/context.js';

import { DOM, notify, natives } from '../utils/helpers.js';
import './global.js'

import PageStyles from  '../styles/page.css';

import '../components/w5-img'
import '../components/invite-item';

@customElement('profile-view')
export class ProfileView extends LitElement {

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

  @property({ type: String, reflect: true })
  panel = 'profile';

  @query('#tabs', true)
  tabs;

  @query('#profile_form', true)
  profileForm;

  @query('#profile_image_input', true)
  avatarInput;

  static properties = {
    socialData: {
      type: Object
    },
    avatarDataUri: {
      type: String
    }
  }

  socialRecord: any;
  avatarRecord: any;

  constructor() {
    super();
    this.socialData = {
      displayName: '',
      bio: '',
      apps: {}
    }
  }

  willUpdate(props) {
    if (props.has('panel')) {
      this?.tabs?.show?.(this.panel || 'profile');
    }
    if (props.has('did')) {
      this.loadProfile(this.did);
    }
  }

  async loadProfile(did){
    this.profileForm.toggleAttribute('loading', true);
    const profileDid = await this.context.profileReady;
    this.isOwner = did === profileDid;
    if (this.isOwner) {
      this.socialRecord = this.context.social;
      this.avatarRecord = this.context.avatar;
    }
    else {
      const records = await Promise.all([
        datastore.getSocial({ from: did }),
        datastore.readAvatar({ from: did })
      ])
      this.socialRecord = records[0];
      this.avatarRecord = records[1];
    }
    this.socialData = this.socialRecord?.cache?.json || {
      displayName: '',
      bio: '',
      apps: {}
    };
    this.avatarDataUri = this.avatarRecord?.cache?.uri;
    this.profileForm.removeAttribute('loading');
  }

  async handleFileChange(e){
    const profileDid = await this.context.profileReady;
    this.isOwner = this.did === profileDid;
    const file = this.avatarInput.files[0];
    if (this.isOwner) {
      this.avatarRecord = await this.context.instance.setAvatar(file);
      this.avatarDataUri = this.avatarRecord.cache.uri;
    }
    else {
      this.avatarRecord = await datastore.setAvatar(file, this.avatarRecord, this.did);
      this.avatarDataUri = this.avatarRecord.cache.uri;
    }
  }

  async saveSocialInfo(e){
    if (this.socialRecord) {
      const formData = new FormData(this.profileForm);
      for (const entry of formData.entries()) {
        natives.deepSet(this.socialData, entry[0], entry[1] || undefined);
      }
      try {
        const profileDid = await this.context.profileReady;
        if (this.did === profileDid) {
          const record = await this.context.instance.setSocial(this.socialData);
          var { status } = await record.send(this.did);
        }
        else {
          await this.socialRecord.update({ data: this.socialData });
          var { status } = await this.socialRecord.send(this.did)
        }
        notify.success('Your profile info was saved')
      }
      catch(e) {
        console.log(e)
        notify.error('There was a problem saving your profile info')
      }
    }
  }

  render(){
    return html`
      <sl-tab-group id="tabs" @sl-tab-show="${e => this.panel = e.detail.name}">
        <sl-tab slot="nav" panel="profile" ?active="${this.panel === 'profile' || nothing}">Profile</sl-tab>
        ${ !this.isOwner ? nothing : html`
          <sl-tab slot="nav" panel="notifications" ?active="${this.panel === 'notifications' || nothing}">Notifications</sl-tab>
        `}

        <sl-tab-panel name="profile" ?active="${this.panel === 'profile' || nothing}">
          <form id="profile_form" loading @sl-change="${e => this.saveSocialInfo(e)}" @submit="${e => e.preventDefault()}">

            <div id="profile_image_container" @click="${e => e.currentTarget.lastElementChild.click()}">
              <w5-img id="profile_image" src="${ifDefined(this.avatarDataUri)}" fallback="person"></w5-img>
              <small>(click to change image)</small>
              <input id="profile_image_input" type="file" accept="image/png, image/jpeg, image/gif" style="display: none"  @change="${this.handleFileChange}" />
            </div>

            <sl-input name="displayName" value="${this.socialData.displayName}" label="Display Name" help-text="A public name visible to everyone"></sl-input>
            <sl-textarea name="bio" value="${this.socialData.bio}" label="Bio" help-text="Tell people a little about yourself" maxlength="280" rows="4" resize="none"></sl-textarea>

            <h3>Social Accounts</h3>
            <sl-input label="X (Twitter)" name="apps.x" value="${this.socialData.apps.x}" class="label-on-left"></sl-input>
            <sl-input label="Instagram" name="apps.instagram" value="${this.socialData.apps.instagram}" class="label-on-left"></sl-input>
            <sl-input label="Facebook" name="apps.facebook" value="${this.socialData.apps.facebook}" class="label-on-left"></sl-input>
            <sl-input label="GitHub" name="apps.github" value="${this.socialData.apps.github}" class="label-on-left"></sl-input>
            <sl-input label="Tidal" name="apps.tidal" value="${this.socialData.apps.tidal}" class="label-on-left"></sl-input>
            <sl-input label="LinkedIn" name="apps.linkedin" value="${this.socialData.apps.linkedin}" class="label-on-left"></sl-input>
          </form>
        </sl-tab-panel>
        ${ !this.isOwner ? nothing : html`
          <sl-tab-panel name="notifications" ?active="${this.panel === 'notifications' || nothing}">
            ${this.context.invites.map(invite => {
              return invite.initialWrite ? nothing : html`<invite-item .invite="${invite}"></invite-item>`
            })}
          </sl-tab-panel>
        `}

    `
  }

}
