
import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { provide } from '@lit/context';
import { AppContext, AppContextMixin } from './utils/context.js';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { setAnimation } from '@shoelace-style/shoelace/dist/utilities/animation-registry.js';
import { AppRouter } from './components/router';
import * as protocols from './utils/protocols';

import './styles/global.css';
import './components/global.js';
import './styles/theme.js';
import { DOM, notify, natives } from './utils/helpers.js';
import PageStyles from  './styles/page.css';

import { SpinnerMixin, SpinnerStyles } from './utils/spinner';

import '@vaadin/app-layout/theme/lumo/vaadin-app-layout.js';
import '@vaadin/app-layout/theme/lumo/vaadin-drawer-toggle.js';

import './pages/home';
import './pages/community.js';

import { ProfileCard } from './components/profile-card'
import './components/add-community'
import './components/profile-view'
import './components/community-view'
import './components/member-list'

import { Web5 } from '@web5/api';
const { web5, did: userDID } = await Web5.connect({
  techPreview: {
    dwnEndpoints: ['http://localhost:3000']
  }
});
console.log(userDID);
globalThis.userDID = userDID

import { Datastore } from './utils/datastore.js';
const datastore = globalThis.datastore = new Datastore({
  web5: web5,
  did: userDID
})

const BASE_URL: string = (import.meta.env.BASE_URL).length > 2 ? (import.meta.env.BASE_URL).slice(1, -1) : (import.meta.env.BASE_URL);

document.addEventListener('profile-card-popup', e => {
  const anchor = e.detail.anchor;
  const popup = document.querySelector('#app_container ').profileCardPopup
  const card = popup.querySelector('profile-card');

  anchor.addEventListener('pointerleave', e => {
    popup.active = false
  }, { once: true })

  card.did = e.detail.did;
  popup.reposition();
  popup.anchor = e.detail.anchor;
  popup.active = true;
})

@customElement('app-container')
export class AppContainer extends AppContextMixin(SpinnerMixin(LitElement)) {

  @provide({ context: AppContext })
  context = {
    instance: this,
    did: null,
    avatar: null,
    social: null,
    invites: [],
  };

  static styles = [
    unsafeCSS(PageStyles),
    SpinnerStyles,
    css`

      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        --communities-list-width: 4em;
      }

      main {
        position: relative;
        height: 100%;
      }

      main > * {
        position: absolute;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
        opacity: 0;
        background-color: var(--body-bk) !important;
        visibility: hidden;
        transition: visibility 0.3s, opacity 0.3s ease;
        overflow-y: scroll;
        z-index: -1;
      }

      main > [state="active"] {
        opacity: 1;
        z-index: 0;
        visibility: visible;
      }

      h1 {
        display: flex;
        align-items: center;
      }

      h1 img {
        height: 2em;
        margin-right: 0.5em;
      }

      vaadin-drawer-toggle {
        display: flex;
        height: var(--lumo-size-m);
        width: var(--lumo-size-m);
        font-size: 1.4em;
        cursor: pointer;
      }

      vaadin-app-layout::part(navbar) {
        background: var(--header-bk);
        box-shadow: 0 0 2px 2px rgba(0 0 0 / 25%);
      }

      vaadin-app-layout #logo {
        fill: white;
        height: 1.6em;
        width: 1.6em;
      }

      /* vaadin-app-layout #slogan {
        color: rgba(255,255,255,0.5);
        margin: 0.2em 0 0;
        font-size: 0.8em;
      } */

      vaadin-app-layout h1.text-logo {
        margin: 0 0.6em 0 0.15em;
        font-size: 2.5em;
        text-shadow: 0 1px 1px rgba(0,0,0,0.5);
      }

      vaadin-app-layout h1.text-logo + * {
        margin-left: auto;
      }

      vaadin-app-layout h1.text-logo ~ *[slot="navbar"] {
        margin-right: 0.5em;
      }

      #notification_button {
        position: relative;
        font-size: 1.45em;
        color: white;
      }

      #notification_button[data-count]::after {
        content: attr(data-count);
        position: absolute;
        bottom: 0;
        left: 0;
        font-size: 0.5em;
        background: red;
        display: block;
        border-radius: 4px;
        padding: 0.1em 0.3em 0.1em 0.15em;
        text-align: center;

      }

      #user_avatar {
        --size: 2.25em;
        border-radius: 100%;
        box-shadow: 0 0 1px 2px rgba(255,255,255,0.8);
        cursor: pointer;
      }

      vaadin-app-layout::part(drawer) {
        flex-direction: row;
        width: 20em;
        max-width: 100%;
        background: rgba(44 44 49 / 100%);
        border-inline-end: 1px solid rgb(255 255 255 / 2%);
      }

      #first_run_modal::part(body) {
        display: flex;
        padding: 0;
      }

      #first_run_modal section {
        display: flex;
        align-items: center;
        margin: 0;
        padding: 3em;
      }

      #first_run_modal section:first-child {
        flex-direction: column;
        justify-content: center;
        width: 36%;
        max-width: 500px;
        background: linear-gradient(-45deg, #7f25bc, #159fd1, #129287);
        background-size: 250% 250%;
        animation: first-run-background 15s ease infinite;
      }

      #first_run_modal h1 {
        font-size: 12.5em;
        font-weight: normal;
        line-height: 0.8em;
        margin: 0 -0.1em 0 0;
        text-shadow: 0px 1px 4px rgba(0,0,0,0.3);
      }

      #first_run_modal  section:first-child::after {
        content: 'Open. Decentralized. Collaboration.';
        font-size: 1em;
      }


      #first_run_modal add-community {
        height: 350px;
      }


      @media(max-width: 900px) {

        #first_run_modal::part(body) {
          flex-direction: column;
        }

        #first_run_modal section {
          width: auto !important;
          justify-content: center;
        }

        #first_run_modal section:first-child {
          max-width: none;
        }

      }

      @keyframes first-run-background {
        0% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0% 50%;
        }
      }

      #communities_list {
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        min-width: var(--communities-list-width);
        margin: 0;
        padding: 0.5em 0;
        background: rgba(0,0,0,0.15);
        border-right: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0px 0 1px 2px rgba(0, 0, 0, 0.25);
        z-index: 1;
      }

      #communities_list > * {
        display: block;
        margin-bottom: 0.75rem;
        cursor: pointer;
      }

      #communities_list sl-avatar {
        animation: bouncyFadeIn 0.4s ease-out forwards;
      }

      #communities_list sl-avatar::part(base) {
        border: 3px solid transparent;
        box-shadow: 0 1px 2px 1px rgba(0 0 0 / 20%);
        transition: border-color 0.3s ease;
      }

      #communities_list sl-avatar::part(image) {
        padding: 0.1em;
      }

      #communities_list a:hover sl-avatar::part(base) {
        border-color: rgba(255,255,255,0.4);
      }

      #communities_list sl-avatar[pressed]::part(base) {
        box-shadow: 0 1px 2px 1px rgba(0 0 0 / 20%) inset;
      }

      #communities_list a[active] sl-avatar::part(base) {
        border-color: var(--sl-color-primary-600);
      }

      #community_nav {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        margin: 0;
        background: rgba(0,0,0,0.25);
      }

      #community_nav > * {
        margin: 0 0.75em;
      }

      #community_nav > header {
        display: flex;
        align-items: center;
        height: 3em;
        margin: 0;
        padding: 0 0.5em;
        background: rgba(255,255,255,0.05);
        box-shadow: 0 0 3px 0px rgba(0,0,0,0.5);
        border-bottom: 1px solid rgba(255,255,255,0.02);
      }

      #community_nav > header h2 {
        margin: 0 0 0 0.2em;
        font-size: 1.25em;
      }

      #community_nav > header sl-dropdown {
        margin-left: auto;
      }

      #community_nav sl-details {
        border-bottom: 1px solid rgba(255,255,255,0.15)
      }

      #community_nav sl-details:first-of-type {
        margin-top: 0.5em;
      }

      #community_nav sl-details::part(base) {
        border: none;
        background: none;
      }

      #community_nav sl-details::part(header) {
        padding: 0.4em;
      }

      #community_nav sl-details::part(summary) {
        order: 1;
      }

      #community_nav sl-details sl-icon-button[slot="summary"] {
        margin-left: auto;
      }

      #community_nav sl-details::part(summary-icon) {
        margin-right: 0.5em;
      }

      #community_nav sl-details::part(content) {
        padding: 0 0.4em 0.8em;
      }

      #community_nav sl-details a {
        display: block;
        padding: 0.25em 0.4em;
        font-size: 90%;
        color: unset;
        text-decoration: none;
        border-radius: 5px;
        transition: background 0.3s ease;
      }

      #community_nav sl-details a:before {
        content: '# ';
      }

      #community_nav sl-details a:hover {
        background: rgba(255,255,255,0.05);
      }

      #community_nav sl-details a[active] {
        color: var(--sl-color-primary-600);
        background: rgba(255,255,255,0.1);
      }

      #community_nav sl-details .empty-list-button {
        display: block;
      }

      vaadin-app-layout vaadin-tab {
        font-family: var(--font-family);
        padding: 0.75rem 1.2rem;
      }

      vaadin-app-layout vaadin-tab[selected] {
        color: var(--link-color);
      }

      vaadin-app-layout vaadin-tab a :first-child {
        margin: 0 0.5em 0 0;
      }

      #profile_card_popup {
        min-width: 300px;
        max-width: 400px;
      }

      #profile_card_popup::part(popup) {
        padding: 0.75rem;
        border: 1px solid rgb(30 30 30 / 90%);
        border-top-color: rgb(33 33 33 / 90%);
        border-bottom-color: rgb(25 25 25 / 90%);
        border-radius: 0.25rem;
        background: rgb(20 20 20 / 92%);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        box-shadow: 0 2px 10px -2px rgba(0,0,0,0.75);
        /* opacity: 0;
        transition: opacity 0.3s ease; */
      }

      #add_community_modal::part(panel) {
        height: 90%;
        max-height: 445px;
      }

      #add_community_modal::part(body) {
        padding-top: 0;
      }

      #add_community_modal sl-tab-group::part(nav) {
        justify-content: center;
      }

      #add_community_modal sl-tab::part(base) {
        flex: 1; /* Each tab will grow equally, filling the container */
      }

      #add_community_modal sl-tab-panel::part(base) {
        padding-bottom: 0;
      }

      #new_member_did {
        flex: 1;
        margin: 0 0.5em 0 0;
      }

      #new_member_profile_card {
        margin: 2em 0 0;
      }

      @media(max-width: 500px) {

      }

      @keyframes bouncyFadeIn {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        60% {
          transform: scale(1.1);
          opacity: 1;
        }
        80% {
          transform: scale(0.9);
        }
        100% {
          transform: scale(1);
        }
      }

      /* main > *[state="active"] {
        overflow-y: scroll;
      } */

      /* For Webkit-based browsers (Chrome, Safari) */
      ::-webkit-scrollbar {
        width: 10px;
      }

      ::-webkit-scrollbar-track {
        background: rgb(40, 40, 40);
      }

      ::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.25);
        border-radius: 6px;
        border: 2px solid rgb(40, 40, 40);
        background-clip: content-box;
      }

      /* For Firefox (version 64 and later) */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.25) rgb(40, 40, 40);
      }

      /* For Edge */
      ::-ms-scrollbar {
        width: 10px;
      }

      ::-ms-scrollbar-track {
        background: rgb(40, 40, 40);
      }

      ::-ms-scrollbar-thumb {
        border-radius: 6px;
        border: 2px solid rgb(40, 40, 40);
        background-color: rgba(255, 255, 255, 0.25);
        background-clip: content-box;
      }

    `
  ]

  @query('#profile_card_popup', true)
  profileCardPopup;

  @query('#add_community_modal', true)
  addCommunityModal

  @query('#add_member_modal', true)
  addMemberModal

  @query('#new_community_name', true)
  newCommunityName

  @query('#new_community_description', true)
  newCommunityDescription

  @query('#add_channel_modal', true)
  addChannelModal

  @query('#new_channel_name', true)
  newChannelName

  @query('#new_channel_description', true)
  newChannelDescription

  @query('#community_settings_modal', true)
  communitySettingsModal

  @query('#member_profile_modal', true)
  memberProfileModal

  @query('#community_settings_view', true)
  communitySettingsView

  @query('#member_profile_view', true)
  memberProfileView

  @query('#new_member_did', true)
  newMemberDid

  @query('#new_member_profile_card', true)
  newMemberProfileCard

  @query('#new_member_submit', true)
  newMemberSubmit

  @query('#view_members_modal', true)
  viewMembersModal



  constructor() {
    super();

    this.initialize();

    this.router = globalThis.router = new AppRouter(this, {
      onRouteChange: async (route, path) => {
        if (this.initialized) {
          const activePath = localStorage.lastActivePath = location.pathname || null;
        }
        if (this.context?.community?.id !== path.community) {
          this.setCommunity(path.community, path.channel);
        }
        else if (this.context?.channel !== path.channel) {
          this.setChannel(path.channel, true);
        }
        this.renderRoot.querySelector('#app_layout')?.__closeOverlayDrawer()
      },
      routes: [
        {
          path: '/',
          component: '#home'
        },
        {
          path: '/(communities)?/:community?/(channels)?/:channel?',
          component: '#communities',
        },
        {
          path: '/(communities)?/:community?/(convos)?/:convo?',
          component: '#communities',
        },
        {
          path: '/settings',
          component: '#settings'
        }
      ]
    });
  }

  async initialize(){
    this.startSpinner(null, { minimum: 1200, renderImmediate: true });
    await this.loadProfile(userDID);
    await this.loadCommunities();
    const firstCommunity = this.context.communities?.[0]?.id;
    const lastActivePath = localStorage.lastActivePath;
    this.initialized = true;
    this.router.navigateTo(lastActivePath ? lastActivePath : firstCommunity ? '/communities/' + firstCommunity : '/settings');
    await DOM.skipFrame();
    this.stopSpinner()
  }

  firstUpdated() {
    const fadeOptions = { duration: 100 };
    const fadeIn = { transform: 'scale(1)', opacity: '1' };
    const fadeOut = { transform: 'scale(1.05)', opacity: '0' };
    this.renderRoot.querySelectorAll('.modal-page').forEach(modal => {
      setAnimation(modal, 'dialog.show', {
        keyframes: [fadeOut,fadeIn],
        options: fadeOptions
      });
      setAnimation(modal, 'dialog.hide', {
        keyframes: [fadeIn,fadeOut],
        options: fadeOptions
      });
    });
    document.addEventListener('show-member-modal', e => {
      this.viewUserProfile(e.detail.did)
    })
  }

  async createChannel(){
    const name = this.newChannelName.value;
    const description = this.newChannelDescription.value;
    if (!name || !description) {
      notify.error('You must add a name and description to create a new community')
      return;
    }
    const channel = await datastore.createChannel(this.context.community, { data: {
      name,
      description
    }});
    try {
      this.addChannel(channel);
      this.router.navigateTo(`/communities/${this.context.community.id}/channels/${channel.id}`);
      console.log('send', status, this.channels);
      notify.success('Your new channel was created!')
      this.newChannelName.value = this.newChannelDescription.value = '';
      this.addChannelModal.hide();
    }
    catch(e) {
      notify.error('There was a problem creating your new channel')
    }
  }

  channelAddHandler(e){
    e.cancelBubble = true;
    this.addChannelModal.show()
  }

  addMemberProfileLookup(){
    try {
      this.newMemberProfileCard.did = this.newMemberDid.value;
    }
    catch(e) {

    }
  }

  async addMember(did){
    const communityId = this.context?.community?.id;
    if (communityId) {
      let member = await datastore.getMember(did, communityId) || await datastore.addMember(did, communityId);
      console.log(member);
      if (member) {
        const drl = natives.drl.create(this.context.community.author, {
          protocol: protocols.sync.uri,
          path: {
            communities: this.context.community.id
          }
        })
        let invite = await datastore.sendInvite(did, drl);
        this.addMemberModal.hide();
        notify.success('Invite sent!')
      }
    }
  }

  async viewMembers(context, path){
    const list = this.viewMembersModal.querySelector('member-list');
    list.context = context;
    list.path = path;
    this.viewMembersModal.show()
  }

  memberProfileAvatarChange(){

  }

  viewCommunitySettings(){
    this.communitySettingsView.did = this.context.did;
    this.communitySettingsModal.show()
  }

  viewUserProfile(did, panel){
    this.memberProfileView.did = did || this.context.did;
    this.memberProfileView.panel = panel || 'profile';
    this.memberProfileModal.show()
  }

  render() {
    const community = this.context.community;
    const channels = this.getChannels();
    const communityId = community?.id
    const inviteCount = this.context.invites.reduce((count, invite) => count + (invite.initialWrite ? 0 : 1), 0);
    return html`

      <vaadin-app-layout id="app_layout">

        <vaadin-drawer-toggle slot="navbar">
          <sl-icon name="list"></sl-icon>
        </vaadin-drawer-toggle>

        <svg id="logo" slot="navbar" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 32 32">
          <path d="M 6 4 L 6 6 L 4 6 L 4 8 L 2 8 L 2 10 L 6 10 L 6 26 L 17 26 L 17 24 L 8 24 L 8 10 L 12 10 L 12 8 L 10 8 L 10 6 L 8 6 L 8 4 L 6 4 z M 15 6 L 15 8 L 24 8 L 24 22 L 20 22 L 20 24 L 22 24 L 22 26 L 24 26 L 24 28 L 26 28 L 26 26 L 28 26 L 28 24 L 30 24 L 30 22 L 26 22 L 26 6 L 15 6 z"></path>
        </svg>

        <h1 class="text-logo" slot="navbar">5ync</h1>

        <sl-icon-button id="notification_button" variant="text" name="bell" slot="navbar" data-count="${inviteCount || nothing}" @click="${ e => this.viewUserProfile(null, 'notifications') }"></sl-icon-button>

        <sl-avatar id="user_avatar" image="${this.context?.avatar?.cache?.uri}" label="User avatar" slot="navbar" @click="${ e => this.viewUserProfile() }"></sl-avatar>

        <menu id="communities_list" slot="drawer">
          <sl-icon-button name="plus-circle" label="Add Community" style="font-size: 1.6rem;" @click="${e => this.addCommunityModal.show()}"></sl-icon-button>
          ${
            Array.from(this.context.communities).map(([id, community]) => {
              const channel = channels[id];
              const communitySegment = `/communities/${id}`;
              const href = communitySegment + (channel ? `/channels/${channel}` : '');
              return html`
                <sl-tooltip content="${community.cache.json.name}" placement="right">
                  <a tabindex="-1" href="${href}" ?active="${location.pathname.match(communitySegment)}">
                  <sl-avatar pressable label="${community.cache.json.name}" image="${community?.logo?.cache?.uri || nothing}"></sl-avatar>
                  </a>
                </sl-tooltip>
                `
            })
          }
        </menu>

        <div id="community_nav" slot="drawer">

          <header>
            <h2>${this.context?.community?.cache?.json?.name}</h2>
            <sl-dropdown>
              <sl-icon-button name="list" slot="trigger" variant="text" size="small"></sl-icon-button>
              <sl-menu>
                <sl-menu-item @click="${ e => this.addMemberModal.show()}"><sl-icon name="person-add" slot="prefix"></sl-icon>Add a Member</sl-menu-item>
                <sl-menu-item @click="${ e => this.viewMembers(communityId, 'community/member')}"><sl-icon name="people" slot="prefix"></sl-icon>View Members</sl-menu-item>
                <sl-menu-item @click="${ e => this.viewCommunitySettings()}"><sl-icon name="pencil-square" slot="prefix"></sl-icon>Edit Profile</sl-menu-item>
              </sl-menu>
            </sl-dropdown>
          </header>

          ${ this.communityLogo ? html`<img src="${this.communityLogo.cache.uri}"/>` : '' }

          <sl-details id="channels" open>
            <span slot="summary">Channels</span><sl-icon-button slot="summary" name="plus-lg" label="Add Channel" @click="${this.channelAddHandler}"></sl-icon-button>
            ${
              community?.channels?.size ?
              Array.from(community?.channels || []).map(([id, channel]) => {
                  const href = `/communities/${community.id}/channels/${id}`;
                  return html`
                    <a href="${href}" ?active="${location.pathname.match(href)}">${channel.cache.json.name}</a>
                `}) :
                html`<sl-button class="empty-list-button" variant="default" size="small" @click="${this.channelAddHandler}">
                  <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                  Add Channel
                </sl-button>`
            }
          </sl-details>

          <sl-details id="convos" open>
            <span slot="summary">Convos</span><sl-icon-button slot="summary" name="plus-lg" label="Start Convo" @click=""></sl-icon-button>
            ${
                community?.convos?.size ?
                Array.from(community?.convos || []).map(([id, convo]) => {
                  const href = `/communities/${community.id}/convo/${id}`;
                  return html`<a href="${href}" ?active="${location.pathname.match(href)}">${convo.cache.json.name}</a>`
                }) :
                html`<sl-button class="empty-list-button" variant="default" size="small">
                  <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                  Start Convo
                </sl-button>`
              }
          </sl-details>
        </div>

        <main id="pages">
          <page-home id="home" scroll></page-home>
          <page-community id="communities" scroll community="${communityId || nothing}" channel="${this.context.channel || nothing}"></page-community>
          <page-drafts id="drafts" scroll></page-drafts>
          <page-follows id="follows" scroll></page-follows>
          <page-settings id="settings" scroll></page-settings>
        </main>

      </vaadin-app-layout>


      <sl-dialog id="first_run_modal" class="modal-page" no-header ?open="${!this.context?.communities?.size}" @sl-request-close="${e => e.detail.source === 'overlay' && e.preventDefault()}">
        <section>
          <h1 class="text-logo">5ync</h1>
        </section>
        <section>
          <add-community></add-community>
        </section>
      </sl-dialog>

      <sl-popup id="profile_card_popup" placement="bottom-start" flip
        @pointerenter="${ e => e.currentTarget.active = true }"
        @pointerleave="${ e => e.currentTarget.active = false }">
        <profile-card id="profile_card_popup"></profile-card>
      </sl-popup>

      <sl-dialog id="add_community_modal" label="Add a Community">
        <add-community @community-added="${ e => this.addCommunityModal.hide() }"></add-community>
      </sl-dialog>

      <sl-dialog id="add_channel_modal" label="Add a Channel">
        <sl-input id="new_channel_name" label="Name" placeholder="Enter a name"></sl-input>
        <sl-textarea id="new_channel_description" label="Description" placeholder="Enter a brief description"></sl-textarea>
        <sl-button variant="primary" @click="${ e => this.createChannel() }">Create</sl-button>
      </sl-dialog>

      <sl-dialog id="start_convo_modal" label="Start a Convo">
        <!-- TODO: Member picker -->
      </sl-dialog>

      <sl-dialog id="add_member_modal" label="Add a Member">
        <div flex="center-y">
          <sl-input id="new_member_did"
                    placeholder="Enter the new member's DID"
                    @keydown="${ e => e.key === 'Enter' && this.addMemberProfileLookup() }"
                    @keypress="${ e => {
                      return !(/^[a-zA-Z0-9_\-:.]+$/.test(String.fromCharCode(e.charCode || e.which))) ? e.preventDefault() : true
                    }}"
          ></sl-input>
          <sl-button variant="primary" @click="${ e => this.addMemberProfileLookup() }" slot="suffix">Find</sl-button>
        </div>
        <profile-card id="new_member_profile_card"
          empty-text="🡱 Enter a DID above 🡱"
          error-text="Couldn't find anything for that."
          @profile-card-loading="${e => this.newMemberSubmit.loading = this.newMemberSubmit.disabled = true }"
          @profile-card-loaded="${e => this.newMemberSubmit.loading = this.newMemberSubmit.disabled = false }"
          @profile-card-error="${e => {
            this.newMemberSubmit.loading = false;
            this.newMemberSubmit.disabled = true;
          }}"
        ></profile-card>
        <sl-button id="new_member_submit" variant="primary" @click="${ e => this.addMember(this.newMemberProfileCard.did) }" slot="footer" disabled>Add Member</sl-button>
      </sl-dialog>

      <sl-drawer id="view_members_modal" label="Community Members" placement="start">
        <member-list></member-list>
      </sl-drawer>

      <sl-dialog id="community_settings_modal" label="Community Settings" class="modal-page" @sl-request-close="${e => e.detail.source === 'overlay' && e.preventDefault()}">
        <community-view id="community_settings_view"></community-view>
      </sl-dialog>

      <sl-dialog id="member_profile_modal" label="Member Profile" class="modal-page" @sl-request-close="${e => e.detail.source === 'overlay' && e.preventDefault()}">
        <profile-view id="member_profile_view"></profile-view>
      </sl-dialog>
    `;
  }
}
