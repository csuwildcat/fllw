import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { consume } from '@lit/context';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { format, intervalToDuration, formatDuration } from "date-fns";

import { AppContext } from '../utils/context.js';
import { hashToGradient } from '../utils/colors.js';
import { socialApps, storyUtils } from '../utils/content.js';
import { DOM, notify, natives } from '../utils/helpers.js';
import Follows from '../utils/follows.js'
import { render } from '../utils/markdown.js';
import './global.js'

import PageStyles from '../styles/page.css' assert { type: 'css' };

import './w5-img'
import './detail-box'
import './story-list';
import './invite-item';

@customElement('profile-view')
export class ProfileView extends LitElement {

  @consume({context: AppContext, subscribe: true})
  context;

  static styles = [
    PageStyles,
    css`

      :host {
        --avatar-size: clamp(6em, 18vw, 9em);
        --block-padding: calc(var(--avatar-size) * 0.2);
        --hero-border-size: clamp(0.2em, 1vw, 0.4em);
        --hero-border: var(--hero-border-size) solid rgba(0 0 0 / 15%);
        position: relative;
        display: flex;
        box-sizing: border-box;
        justify-content: center;
        flex-direction: column;
        max-width: 700px;
        background: var(--grey);
        border-radius: var(--block-radius);
        box-shadow: var(--block-shadow);
        overflow: hidden;
        cursor: default;
      }

      :host(:not([owner])) .edit-button {
        visibility: hidden;
        pointer-events: none;
      }

      form {
        max-width: 600px;
        margin: 0 auto;
      }

      sl-input, sl-textarea {
        margin: 0 0 1em;
      }

      sl-tab-panel {
        padding: 0.5em 1.5em;
      }

      #profile_card {
        position: relative;
        flex: 0;
        min-width: 250px;
        margin: 0 0 1.5em;
      }

      #hero {
        width: 100%;
        height: var(--avatar-size);
        background: var(--deterministic-background);
      }

      #hero::after {
        content: "";
        position: absolute;
        bottom: 0;
        height: 100%;
        width: 100%;
        border-bottom: var(--hero-border);
        border-radius: var(--block-radius) var(--block-radius) 0 0;
        box-shadow: 0 7px 2px 0px rgba(255 255 255 / 0.125) inset;
        z-index: 2;
      }

      #hero[src] {
        background: none;
      }

      #hero::part(fallback) {
        display: none;
      }

      #hero sl-icon-button {
        position: absolute;
        top: 1em;
        right: 1em;
        background: rgba(0 0 0 / 0.6);
        border-radius: 100%;
        cursor: pointer;
        z-index: 3;
      }

      #basic_info {
        margin: 0 0 0 var(--block-padding);
      }

      #avatar_wrapper {
        height: 2.75em;
        margin: 0 0 1.1em;
      }

      #avatar_wrapper sl-button {
        margin: 0.75em 0.75em 0 0;
      }

      #avatar_wrapper sl-button:first-of-type {
        margin-left: auto;
      }

      #avatar {
        --size: var(--avatar-size);
        position: absolute;
        background: var(--grey-lighter);
        outline: var(--hero-border);
        box-shadow: 0 1px 1px 0px rgba(0 0 0 / 0.6);
        border-radius: 6px;
        z-index: 2;
        cursor: pointer;
      }

      #profile_name {
        position: relative;
        margin: 0 0 0.5em 0.1em;
        z-index: 2;
      }

      #profile_name h2 {
        margin: 0 0 0.2em;
        /* font-size: calc(var(--avatar-size) * 0.2); */
      }

      sl-copy-button {
        font-size: 0.925rem;
        opacity: 0.5;
        transition: opacity 0.3s ease;
      }

      #profile_name sl-copy-button:hover {
        opacity: 1;
      }

      .qr_button {
        font-size: 0.95rem;
      }

      .qr_button::part(base) {
        padding-left: 0;
        padding-right: 0;
      }

      #profile_name small {
        color: #777;
      }

      #tabs {
        flex: 1;
      }

      #tabs::part(body),
      #tabs sl-tab-panel::part(base),
      #tabs sl-tab-panel[active] {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      #tabs::part(base) {
        width: 100%;
      }

      #tabs::part(tabs) {
        background: rgba(0 0 0 / 15%);
        border: solid 1px var(--track-color);
        border-left: none;
        border-right: none;
      }

      #tabs::part(active-tab-indicator) {
        bottom: -1px;
      }

      #tabs sl-tab-panel {
        flex: 1;
      }

      #tabs sl-tab-panel [default-content~="placeholder"]{
        flex: 1;
        padding: 0 0 5rem;
      }

      #profile_panel > section {
        margin: 0 0 2em;
      }

      #profile_panel > section:last-child {
        margin: 0 0 1em;
      }

      /* #profile_panel > section :last-child {
        margin-bottom: 0;
      } */

      :host(:not([owner])) #profile_panel > section:has([empty]) {
        display: none;
      }

      #profile_panel header {
        margin: 0 0 1em;
        border-bottom: 2px dotted rgba(255 255 255 / 0.05);
      }

      #profile_panel header sl-icon {
        margin-top: -0.15em;
        color: #bbb;
      }

        #profile_social header sl-icon::part(svg) {
          margin-top: -0.1em;
          font-size: 1.3em;
        }

      #profile_panel h3 {
        margin: 0 auto 0.2em 0.5em;
        font-weight: normal;
      }

      #profile_about .section-content {
        white-space: pre-wrap;
      }

      #profile_panel [empty-text][empty] {
        text-align: center;
      }

      #profile_social .section-content sl-icon-button {
        font-size: 1.5em;
      }

      #profile_career {
        position: relative;
      }

      #profile_career header {
        margin: 0 0 1.5em;
      }

      #job_groups {
        max-height: 20em;
      }

      #job_groups::part(content) {
        display: flex;
        flex-direction: column-reverse;
        justify-content: flex-end;
      }

      .job-group {
        margin: 1.25em 0 0;
        padding: 1.75em 0 0.5em;
        border-top: 1px solid rgba(255 255 255 / 0.05)
      }

      .job-group:has([latest-job]) {
        order: 1000000 !important;
        margin-top: 0;
        padding-top: 0.25em;
        border: none;
      }

      .job:not(:last-child) {
        margin: 0 0 1.5em;
      }

      .job img {
        box-sizing: border-box;
        width: 4em;
        padding: 0.2em;
        border: 1px solid rgba(255 255 255 / 0.25);
        border-radius: 6px;
      }

      .job .gutter {
        min-width: 4em;
        margin: 0 1em 0 0;
        font-size: clamp(0.6rem, 3vw, 1rem);
      }

      .job .content > :last-child {
        margin-bottom: 0;
      }

      .job:not(:first-child) .gutter img {
        width: 2.6em;
      }

      .job:not(:last-child) .gutter::after {
        content: "";
        display: block;
        flex: 1;
        width: 3px;
        background: rgba(255 255 255 / 0.2);
        margin: 0.7em 0 0;
        border-radius: 3px;
      }

      .job .gutter sl-icon-button {
        margin: 0.6em 0 0;
      }

      .job strong {
        margin: 0 0 0.4em;
        font-weight: normal;
      }

      .job small {
        margin: 0 0 0.2em;
        color: rgba(255 255 255 / 0.6);
      }

      .job p {
        white-space: pre-wrap;
      }

      /* Stories */

      story-list[has-content] ~ [default-content="placeholder"] {
        display: none;
      }

      story-list > sl-button {
        display: none;
        align-self: center;
        margin: 1em 0 0;
      }

      story-list[more-content] > sl-button {
        display: inline-block;
      }

      /* Follows */

      #follow_list {
        margin: 1.2rem 1rem;
      }

      #follow_list ~ [default-content="placeholder"] {
        display: flex;
      }

      #follow_list:has(*) ~ [default-content="placeholder"] {
        display: none;
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

      #profile_edit_modal::part(body) {
        padding: 0;
      }

      #profile_edit_modal sl-tab-panel {
        height: 27em;
      }

      #qr_modal::part(title) {
        padding-right: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #qr_modal::part(panel) {
        max-width: 20em;
      }

      #qr_modal::part(body) {
        margin: 0 auto;
      }

      #qr_modal sl-qr-code {
        padding: 1em;
        background: #fff;
        border-radius: 0.25rem;
      }

      #qr_modal sl-qr-code::part(base) {  
        width: 100% !important;
        max-width: 15rem;
        height: auto !important;
        aspect-ratio: 1 / 1;
      }

      #pay_modal .payment-type {
        margin: 0 0 1.5em;
        font-size: 1.25em;
        align-items: center; 
      }

      #pay_modal .payment-type:last-child {
        margin: 0 0 0.5em;
      }

      #pay_modal .payment-type a {
        overflow: hidden;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #pay_modal .payment-type sl-icon {
        font-size: 1.25em;
        margin: 0 0.25em 0 0;
      }

      @media(max-width: 500px) {
        #hero::after {
          display: none;
        }

        #follow_list {
          margin: 0.3rem 0.2rem;
        }
      }

    `
  ]

  @property({ type: String, reflect: true })
  did;

  @property({ type: Boolean, reflect: true })
  owner;

  @property({ type: String, reflect: true })
  panel = 'profile';

  @property({ type: Boolean, reflect: true })
  loaded;

  @property({ type: Boolean, reflect: true })
  loading;

  @property({ type: Boolean, reflect: true, attribute: 'loading-error' })
  loadingError;

  @query('#hero', true)
  heroImage;

  @query('#tabs', true)
  tabs;

  @query('#profile_form', true)
  profileForm;

  @query('#job_modal', true)
  jobModal;

  @query('#job_form', true)
  jobForm;

  @query('#qr_modal', true)
  qrModal;

  @query('#qr_code', true)
  qrCode;

  @query('#pay_modal', true)
  payModal;

  @query('#hero_input', true)
  heroInput;

  @query('#avatar_input', true)
  avatarInput;

  @query('#profile_edit_modal', true)
  profileEditModal;

  static properties = {
    job: {
      type: Object
    },
    avatar: {
      type: Object
    },
    hero: {
      type: Object
    },
    socialData: {
      type: Object
    },
    careerData: {
      type: Object
    }
  }

  avatar: any;
  hero: any;
  social: any;
  career: any;
  follows: Follows;
  following: any;
  socialData: any;
  careerData: any;

  static paymentTypes = {
    cashtag: {
      icon: 'cash-app',
      color: '#00c853',
      newTab: true,
      normalize: (val, link) => {
        val = val.replace(/^(?!\$)/, '$');
        return link ? `https://cash.app/${val}` : val;
      }
    },
    ln_address: {
      icon: 'lightning-charge',
      color: '#cac55c',
      normalize: (val, link) => {
        return link ? `lightning:${val}` : val;
      }
    },
    btc_address: {
      icon: 'currency-bitcoin',
      color: '#f18f19',
      normalize: (val, link) => {
        return link ? `bitcoin:${val}` : val;
      }
    },
    dap: {
      icon: 'dap-white',
      color: '#37b4fc',
      normalize: (val, link) => {
        return link ? null : val.replace(/^(?!\@)/, '@');
      }
    }
  }

  constructor() {
    super();
    this.clearData();
  }

  clearData(){
    this.avatar = {};
    this.hero = {};
    this.social = {};
    this.career = {};
    this.following = null;
    this.socialData = {
      displayName: '',
      bio: '',
      apps: {},
      payment: {}
    }
    this.careerData = {
      jobs: [],
      skills: [],
      education: []
    }
  }

  willUpdate(props) {
    if (props.has('panel')) {
      this?.tabs?.show?.(this.panel || 'profile');
    }
    if (props.has('did') && this.did) {
      this.loadProfile(this.did);
    }
  }

  async loadProfile(did){
    this.loaded = false;
    this.loading = true;
    try {
      await this.context.initialize;
      this.owner = did === this.context.did;
      this.clearData();
      this.heroImage.style.setProperty('--deterministic-background', hashToGradient(did.split(':')[2]));
      this.follows = Follows.getInstance(this.owner ? null : { from: did, pagination: { limit: 20 } });
      this.follows.initialize.then(() => this.requestUpdate());
      if (this.owner) {
        this.social = this.context.social;
        this.avatar = this.context.avatar;
        this.hero = this.context.hero;
        this.career = this.context.career;
      }
      else {
        this.checkFollow();
        const records = await Promise.all([
          datastore.getSocial({ from: did }),
          datastore.readProfileImage('avatar', { from: did }),
          datastore.readProfileImage('hero', { from: did }),
          datastore.getCareer({ from: did }),
        ])
        this.social = records[0];
        this.avatar = records[1];
        this.hero = records[2];
        this.career = records[3];
      }
      this.socialData = this.social?.cache?.json || {
        displayName: '',
        bio: '',
        apps: {}
      };
      this.careerData = this.career?.cache?.json || {
        jobs: [],
        skills: [],
        education: []
      };
      this.loadingError = false;
      this.loaded = true;
      DOM.fireEvent(this, 'profile-view-load-success')
    }
    catch(e) {
      this.loadingError = true;
      DOM.fireEvent(this, 'profile-view-load-error')
    }
    this.loading = false;
    DOM.fireEvent(this, 'profile-view-load-complete')
  }

  async checkFollow(){
    this.following = await Follows.checkFollow(this.did);
    this.requestUpdate();
  }

  async toggleFollow(){
    const state = await this.follows.toggleFollow(this.did);
    this.following = state;
    this.requestUpdate();
  }

  async handleFileChange(type, input){
    await this.context.initialize;
    this.owner = this.did === this.context.did;
    const file = input.files[0];
    if (this.owner) {
      this[type] = await this.context.instance.setProfileImage(type, file);
    }
    else {
      this[type] = await datastore.setProfileImage(type, file, this.avatar, this.did);
    }
  }

  async saveSocialInfo(e){
    if (this.social) {
      const formData = new FormData(this.profileForm);
      for (const entry of formData.entries()) {
        natives.deepSet(this.socialData, entry[0], entry[1] || undefined);
      }
      try {
        await this.context.initialize;
        if (this.did === this.context.did) {
          const record = await this.context.instance.setSocial(this.socialData);
          var { status } = await record.send(this.did);
        }
        else {
          await this.social.update({ data: this.socialData });
          var { status } = await this.social.send(this.did)
        }
        notify.success('Your profile info was saved')
      }
      catch(e) {
        console.log(e)
        notify.error('There was a problem saving your profile info')
      }
    }
  }

  showJobModal(job){
    this.job = !job ? { id: natives.randomString(32) } : typeof job === 'string' ? this.careerData.jobs.find(item => item.id === job) : job;
    this.jobModal.show();
  }

  async saveJob(closeModal = false){
    if (this.career) {
      if (!this.jobForm.checkValidity()) {
        notify.error('You haven\'t filled out all the required fields');
        return;
      }
      const formData = new FormData(this.jobForm);
      for (const entry of formData.entries()) {
        natives.deepSet(this.job, entry[0], entry[1]?.trim ? entry[1].trim() : entry[1] || undefined);
      }
      try {
        if (!this.careerData.jobs.includes(this.job)) {
          this.careerData.jobs.push(this.job);
        }
        await this.context.initialize;
        if (this.did === this.context.did) {
          const record = await this.context.instance.setCareer(this.careerData);
          var { status } = await record.send(this.did);
        }
        else {
          await this.career.update({ data: this.careerData });
          var { status } = await this.career.send(this.did)
        }
        notify.success('Job info saved')
        if (closeModal) this.jobModal.hide();
      }
      catch(e) {
        console.log(e)
        notify.error('There was a problem saving this job info')
      }
    }
  }

  onTabShow(e){
    this.panel = e.detail.name;
    if (this.panel === 'stories' && !this.storiesLoaded) {
      //this.loadStories();
    }
  }

  showQrModal(title, value){
    this.qrModal.label = title;
    this.qrCode.value = value;
    this.qrModal.show();
  }

  render(){

    const today = new Date();
    const now = today.getTime();
    let latestJob = { startTime: now, endTime: 0 };
    const sortedJobs = this?.careerData?.jobs?.reduce((obj, job) => {
      const employer = job?.employer?.trim().toLowerCase() || '';
      (obj[employer] = obj[employer] || []).push(job)
      job.startTime = new Date(job.start_date).getTime();
      job.endTime = job.end_date ? new Date(job.end_date).getTime() : now;
      if (job.endTime > latestJob.endTime || job.endTime === latestJob.endTime && job.startTime <= latestJob.startTime) {
        latestJob = job;
      }
      return obj;
    }, {})

    return html`

      <section id="profile_card" flex="column fill">

        <w5-img id="hero" src="${ifDefined(this.hero?.cache?.uri)}">
          <sl-icon-button class="edit-button" name="pencil" size="medium" @click="${e => this.heroInput.click()}"></sl-icon-button>
          <input id="hero_input" type="file" accept="image/png, image/jpeg, image/gif" style="display: none" @change="${e => this.handleFileChange('hero', this.heroInput)}" />
        </w5-img>

        <div id="basic_info">
          <div id="avatar_wrapper" flex="end">
            <w5-img id="avatar" src="${ifDefined(this.avatar?.cache?.uri)}" fallback="${this.owner ? 'person-fill-add' : 'person-fill'}" @click="${e => this.avatarInput.click()}">
              <input id="avatar_input" type="file" accept="image/png, image/jpeg, image/gif" style="display: none" @change="${e => this.handleFileChange('avatar', this.avatarInput)}" />
            </w5-img>
            ${ !Object.keys(this.socialData?.payment || {}).length ? nothing : html`
              <sl-button class="pay-button" size="small" @click="${e => this.payModal.show()}">
                $ Pay
              </sl-button>`
            }
            ${ this.owner ? nothing : html`
              <sl-button id="follow_button" size="small" variant="${ this.following ? 'success' : 'default' }" @click="${ e => this.toggleFollow() }" ?loading="${ this.following === null }">
                ${ this.following ? 'Following' : 'Follow' }
              </sl-button>`
            }
            ${ !this.owner ? nothing : html`
              <sl-button class="edit-button" size="small" @click="${e => this.profileEditModal.show()}">
                Edit profile
              </sl-button>`
            }
          </div>
          <div id="profile_name">
            <h2>
              ${this.socialData.displayName || 'Anon'} 
              <sl-copy-button value="${this.did}" copy-label="Copy this user's DID"></sl-copy-button>
              <sl-tooltip content="Scan this user's DID">
                <sl-icon-button class="qr_button" name="simple-qr" size="small" @click="${ e => this.showQrModal("Scan this user's DID", this.did) }"></sl-icon-button>
              </sl-tooltip>
            </h2>
            <small>${this.socialData.tagline || ''}</small>
          </div> 
        </div>
      </section>

      <sl-tab-group id="tabs" flex="fill" @sl-tab-show="${this.onTabShow}">
        <sl-tab slot="nav" panel="profile" ?active="${this.panel === 'profile' || nothing}">Profile</sl-tab>
        <sl-tab slot="nav" panel="stories" ?active="${this.panel === 'stories' || nothing}">Stories</sl-tab>
        <!-- <sl-tab slot="nav" panel="threads" ?active="${this.panel === 'threads' || nothing}">Threads</sl-tab> -->
        <sl-tab slot="nav" panel="follows" ?active="${this.panel === 'follows' || nothing}">Follows</sl-tab>
        ${ !this.owner ? nothing : html`
          <sl-tab slot="nav" panel="notifications" ?active="${this.panel === 'notifications' || nothing}">Notifications</sl-tab>
        `}

        <sl-tab-panel id="profile_panel" name="profile" ?active="${this.panel === 'profile' || nothing}">
          <section id="profile_about">
            <header flex="center-y">
              <sl-icon name="person-vcard" size="small"></sl-icon>
              <h3>About</h3>
              <sl-icon-button class="edit-button" name="pencil" variant="default" size="medium" @click="${ e => this.profileEditModal.show() }"></sl-icon-button>
            </header>
            <p class="section-content" empty-text="Tell people about yourself" ?empty="${!this.socialData.bio}">${this.socialData.bio || nothing}</p>
          </section>

          <section id="profile_social">
            <header flex="center-y">
              <sl-icon name="at" size="small"></sl-icon>
              <h3>Social</h3>
              <sl-icon-button class="edit-button" name="pencil" variant="default" size="medium" @click="${ e => this.profileEditModal.show() }"></sl-icon-button>
            </header>
            <div class="section-content" empty-text="Add social links" ?empty="${!Object.values(this.socialData.apps || {}).length}">
              ${Object.entries(this.socialData.apps).map(app => {
                const name = app[0];
                return app[1] ? html`<sl-icon-button name="${socialApps[name].icon || name}" target="_blank" href="${socialApps[name].profileUrl + app[1]}"></sl-icon-button>` : nothing;
              })}
            </div>
          </section>  
        
          <section id="profile_career">
            <header flex="center-y">
              <sl-icon name="briefcase" size="small"></sl-icon>
              <h3>Career</h3>
              <sl-icon-button class="edit-button" name="plus-lg" variant="default" size="medium" @click="${ e => this.showJobModal() }"></sl-icon-button>
            </header>
            <detail-box id="job_groups" flex="column-reverse end" class="section-content" empty-text="Where have you worked?" ?empty="${!this.careerData?.jobs?.length}">
              ${
                Object.keys(sortedJobs).map((employer, i) => {
                  const group = sortedJobs[employer] = sortedJobs[employer].sort((a, b) => b.endTime - a.endTime);
                  const order = Math.round(group[0].endTime / 100_000_000);

                  return html`<ul class="job-group" style="order: ${order}">${ 
                    group.map(job => {
                      
                      if (!job.id) job.id = natives.randomString(32)

                      const startDate = new Date(job.start_date);
                      const endDate = job.end_date ? new Date(job.end_date) : null;
                      const duration = formatDuration(
                        intervalToDuration({
                          start: startDate,
                          end: endDate || today
                        }),
                        { format: ['years', 'months'] }
                      )

                      return job ? html`
                        <li class="job" flex ?latest-job="${job === latestJob || nothing}">
                          <div class="gutter" flex="column center-x">
                            <img src="https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${job.url}&size=128"/>
                            ${this.owner && html`<sl-icon-button name="pencil" variant="default" size="medium" @click="${ e => this.showJobModal(job.id) }"></sl-icon-button>`}
                          </div>
                          <div class="content" flex="column align-start">
                            <strong>${job?.title}</strong>
                            <small>${job?.employer}</small>
                            <small>${format(startDate, 'MMM yyy')} - ${endDate ? format(endDate, 'MMM yyy') : 'Present'} · ${duration}</small>
                            <p>${job?.description}</p>
                          </div>
                        </li>
                      ` : nothing
                    })
                  }</ul>`;
                })
              }
            </detail-box>
          </section>  
        </sl-tab-panel>

        <sl-tab-panel id="stories_panel" name="stories" ?active="${this.panel === 'stories' || nothing}">
          <story-list did="${this.did}">
            <sl-button href="/profiles/${this.did}/stories" slot="content-end">View all stories</sl-button>
          </story-list>
          <div default-content="placeholder">
            ${ this.owner ? html`
              <sl-icon name="file-earmark-richtext"></sl-icon>
              <sl-button href="/profiles/${this.did}/stories/new">
                <sl-icon name="plus-lg" slot="prefix"></sl-icon>
                Write your first story
              </sl-button>
              ` : html`
                <sl-icon name="file-earmark-richtext"></sl-icon>
                <p>Nothing to see here yet.</p>
              `
            }
          </div>
        </sl-tab-panel>

        <sl-tab-panel id="threads_panel" name="threads" ?active="${this.panel === 'threads' || nothing}">
          <ul id="threads_list"></ul>
          <div default-content="placeholder">
            ${ this.owner ? html`
              <sl-icon name="card-heading"></sl-icon>
              <sl-button>
                <sl-icon name="plus-lg" slot="prefix"></sl-icon>
                Start your first thread
              </sl-button>
              ` : html`
                <sl-icon name="file-earmark-richtext"></sl-icon>
                <p>Nothing to see here yet.</p>
              `
            }
          </div>
        </sl-tab-panel>

        <sl-tab-panel id="follows_panel" name="follows" ?active="${this.panel === 'follows' || nothing}">
          <div id="follow_list">${
            this?.follows?.entries ? Array.from(this?.follows?.entries).map(record => html`
              <profile-card did="${record.recipient}" remove-unfollowed follow-button following @click="${e => {
                router.navigateTo(`/profiles/${record.recipient}`)
              }}"></profile-card>
            `) : nothing
          }</div>
          <div default-content="placeholder">
            <sl-icon name="people-fill"></sl-icon>
            <span>Not following anyone yet.</span>
          </div>
        </sl-tab-panel> 

        ${ !this.owner ? nothing : html`
          <sl-tab-panel name="notifications" ?active="${this.panel === 'notifications' || nothing}">
            ${[].map(invite => {
              return invite.initialWrite ? nothing : html`<invite-item .invite="${invite}"></invite-item>`
            })}
          </sl-tab-panel>
        `}
      </sl-tab-group>

      <sl-dialog id="profile_edit_modal" class="page-dialog" label="Edit Profile" placement="start">
        <form id="profile_form" @sl-change="${e => this.saveSocialInfo(e)}" @submit="${e => e.preventDefault()}">
          <sl-tab-group>

            <sl-tab slot="nav" panel="bio">Bio</sl-tab>
            <sl-tab slot="nav" panel="social">Social Accounts</sl-tab>
            <sl-tab slot="nav" panel="payment">Payment</sl-tab>
            
            <sl-tab-panel name="bio">
              <sl-input name="displayName" value="${this.socialData.displayName}" label="Display Name" help-text="A public name visible to everyone"></sl-input>
              <sl-input name="tagline" value="${this.socialData.tagline}" label="What you do" help-text="Your title or personal tagline" maxlength="80"></sl-input>
              <sl-textarea name="bio" value="${this.socialData.bio}" label="About" help-text="Tell people a little more about yourself" rows="4" resize="none"></sl-textarea>
            </sl-tab-panel>

            <sl-tab-panel name="social">
              <sl-input label="X (Twitter)" name="apps.x" value="${this.socialData.apps.x}" class="label-on-left"></sl-input>
              <sl-input label="Instagram" name="apps.instagram" value="${this.socialData.apps.instagram}" class="label-on-left"></sl-input>
              <sl-input label="Facebook" name="apps.facebook" value="${this.socialData.apps.facebook}" class="label-on-left"></sl-input>
              <sl-input label="GitHub" name="apps.github" value="${this.socialData.apps.github}" class="label-on-left"></sl-input>
              <sl-input label="LinkedIn" name="apps.linkedin" value="${this.socialData.apps.linkedin}" class="label-on-left"></sl-input>
              <sl-input label="Tidal" name="apps.tidal" value="${this.socialData.apps.tidal}" class="label-on-left"></sl-input>
              <sl-input label="Cash" name="apps.cash" value="${this.socialData.apps.cash}" class="label-on-left"></sl-input>
            </sl-tab-panel>

            <sl-tab-panel name="payment">
              <sl-input label="Cashtag" name="payment.cashtag" value="${this.socialData?.payment?.cashtag}" class="label-on-left"></sl-input>
              <sl-input label="Bitcoin Address" name="payment.btc_address" value="${this.socialData?.payment?.btc_address}" class="label-on-left"></sl-input>
              <sl-input label="Lightning Address" name="payment.ln_address" value="${this.socialData?.payment?.ln_address}" class="label-on-left"></sl-input>
              <sl-input label="DAP" name="payment.dap" value="${this.socialData?.payment?.dap}" class="label-on-left"></sl-input>
            </sl-tab-panel>
          </sl-tab-group>
        </form>
        <sl-button slot="footer" variant="primary" @click="${ e => this.profileEditModal.hide() }">Submit</sl-button>
      </sl-dialog> 
      
      <sl-dialog id="job_modal" class="page-dialog dialog-deny-close" label="Edit Job" placement="start">
        <form id="job_form" @submit="${e => { e.preventDefault(); this.saveJob() }}">   
          <sl-input name="employer" required value="${this?.job?.employer}" label="Employer" help-text="What was the name of your employer?"></sl-input>
          <sl-input name="url" required value="${this?.job?.url}" label="Employer Website" pattern="https?://.+" help-text="Enter the URL of the company"></sl-input>
          <sl-input name="title" required value="${this?.job?.title}" label="Job Title" help-text="What was your job title?"></sl-input>
          <div flex="center-y gap-medium">
            <sl-input name="start_date" required value="${this?.job?.start_date}" type="date" label="Start date"></sl-input>
            <sl-input name="end_date" value="${this?.job?.end_date}" type="date" label="End date"></sl-input>
          </div>
          <sl-textarea name="description" required value="${this?.job?.description}" label="Job Description" help-text="What did you do there?" rows="4"></sl-textarea>
        </form>
        <sl-button slot="footer" variant="danger" @click="${ e => this.jobModal.hide() }">Cancel</sl-button>
        <sl-button slot="footer" variant="primary" @click="${ e => this.saveJob(true) }">Save</sl-button>
      </sl-dialog>

      <sl-dialog id="pay_modal" class="page-dialog" label="Payment" placement="start">
        ${Object.entries(this.socialData.payment || {}).map(([type, value]) => {
          if (!value) return nothing;
          let format = ProfileView.paymentTypes?.[type];
          if (format) {
            let normalized = format?.normalize(value) || value;
            let link = format?.normalize(value, true);
            return html`
              <div class="payment-type" flex>
                <sl-icon name="${format.icon}" style="color: ${format.color || '#fff'}"></sl-icon>
                <a href="${link || nothing}" target="${format.newTab ? '_blank' : nothing}">
                  ${normalized}
                </a>
                <sl-copy-button value="${normalized}" copy-label="Copy"></sl-copy-button>
                <sl-tooltip content="Show QR">
                  <sl-icon-button class="qr_button" name="simple-qr" size="small" @click="${ e => this.showQrModal(normalized, link || normalized) }"></sl-icon-button>
                </sl-tooltip>
              </div>
            `
          }
          else return nothing;
        })}
      </sl-dialog>

      <sl-dialog id="qr_modal" class="page-dialog" placement="start" fit-content>
        <sl-qr-code id="qr_code"></sl-qr-code>
      </sl-dialog> 
    `
  }

}
