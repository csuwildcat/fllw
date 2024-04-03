
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
import './pages/directory.js';
import './pages/follows.js';
import './pages/settings.js';
import './pages/profile.js';
import './pages/posts.js';

import { ProfileCard } from './components/profile-card'

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

  static styles = [
    unsafeCSS(PageStyles),
    SpinnerStyles,
    css`

      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
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

      main > [route-state="active"] {
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
        justify-content: flex-start;
        margin: 0 0 0 -0.3em;
        width: 1.5em;
        font-size: 1.3em;
        color: rgb(0 0 0 / 75%);
        transition: transform 0.3s ease;
        cursor: pointer;
      }

      vaadin-drawer-toggle:hover {
        transform: translateX(0.1em);
      }

      vaadin-app-layout::part(navbar) {
        box-sizing: border-box;
        height: var(--header-height);
        min-height: var(--header-height);
        font-size: cacl(var(--header-height) / 1.3rem);
        background: var(--header-bk);
        box-shadow: 0 0 2px 2px rgba(0 0 0 / 25%);
        z-index: 2;
      }

      vaadin-app-layout .svg-logo {
        font-size: 1.7em;
        color: var(--logo-color);
      }

      /*
        font-size: 1.1em;
        background: #fff;
        padding: 0.1em 0.125em 0 0.1em;
        border-radius: 0.1em;
      */

      vaadin-app-layout h1.text-logo {
        margin: 0 0.6em 0 0.15em;
        font-size: 1.9em;
        /* text-shadow: 0 1px 1px rgba(0,0,0,0.5); */
        color: var(--logo-color);
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
        justify-content: center;
        padding: 0.75em 0;
        width: auto;
        max-width: 100%;
        background: #1a1a1e;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0px 2px 1px 2px rgba(0, 0, 0, 0.25);
      }

      #global_nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        margin: 0;
        padding: 0.5em 0;
        font-size: 0.75em;
        z-index: 1;
      }

      #global_nav a {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 4.5em;
        padding: 0.5em 1em;
        margin: 0 0 1em;
        opacity: 0.65;
        transition: opacity 0.3s ease;
        text-decoration: none;
        color: #fff;
        cursor: pointer;
      }

      #global_nav a div {
        color: rgba(255,255,255,0.8);
      }
      
      #global_nav sl-icon {
        font-size: 2em;
        margin: 0 0 0.2em;
      }

      #global_nav a:hover {
        opacity: 1;
      }

      #global_nav a[active] {
        opacity: 1;
      }

      #global_nav a[active] sl-icon {
        color: var(--link-color);
      }

      /* MODALS */

      #connect_modal [break-text] {
        background: var(--sl-panel-background-color);
      }

      #connect_modal::part(panel) {
        width: auto;
      }

      #connect_modal sl-button sl-icon {
        font-size: 1.5em;
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

      @media(max-width: 500px) {

      }

      @media(max-width: 800px) {

        #global_nav {
          width: 160px;
          align-items: flex-start;
          font-size: 1em;
        }

        #global_nav a {
          flex-direction: row;
          margin: 0 0 0.5em;
        }

        #global_nav a sl-icon {
          margin: 0 0.5em 0 0;
          font-size: 1.4em;
        }

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

      #new_member_did {
        flex: 1;
        margin: 0 0.5em 0 0;
      }

      #new_member_profile_card {
        margin: 2em 0 0;
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

      /* main > *[route-state="active"] {
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

  @query('#app_layout', true)
  appLayout;

  @query('#profile_card_popup', true)
  profileCardPopup;

  @query('#connect_modal', true)
  connectModal;

  @query('#view_members_modal', true)
  viewMembersModal

  @query('#home', true)
  homePage;

  @query('#directory', true)
  directoryPage;

  @query('#profile', true)
  profilePage;

  @query('#posts', true)
  postsPage;

  @provide({ context: AppContext })
  context = {
    instance: this,
    did: null,
    avatar: null,
    hero: null,
    social: null,
    career: null,
    drafts: new Map(),
  };

  constructor() {
    super();

    this.#initialize();

    this.router = globalThis.router = new AppRouter(this, {
      onRouteChange: async (route, path) => {
        console.log(route, path);
        if (this.initialized) {
          
        }
        this?.appLayout?.__closeOverlayDrawer()
      },
      routes: [
        {
          path: '/',
          component: '#home'
        },
        {
          path: '/profiles/:did?',
          component: async (route, path) => {
            await this.initialize;
            if (path.did === this.context.did) {
              return this.profilePage;
            }
            else {
              this.directoryPage.did = path.did;
              return this.directoryPage;
            }
          }
        },
        {
          path: '/profiles/:did?/posts',
          component: '#profile'
        },
        {
          path: '/profiles/:did/posts/:post?',
          component: '#posts'
        },
        {
          path: '/follows',
          component: '#follows',
        },
        {
          path: '/settings',
          component: '#settings'
        }
      ]
    });
  }

  #initialization: Promise<void> | null = null;

  async #initialize(){
    if (this.#initialization) return this.#initialization;
    return this.#initialization = new Promise(async resolve => {
      this.startSpinner(null, { minimum: 1200, renderImmediate: true });
      if (localStorage.did) await this.loadProfile(localStorage.did);
      resolve();
      this.initialized = true;
      await DOM.skipFrame();
      this.stopSpinner()
    });
  }

  get initialize(){
    return this.#initialization || this.#initialize();
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
  }

  async viewMembers(context, path){
    const list = this.viewMembersModal.querySelector('member-list');
    list.context = context;
    list.path = path;
    this.viewMembersModal.show()
  }

  render() {
   //const inviteCount = this.context.invites.reduce((count, invite) => count + (invite.initialWrite ? 0 : 1), 0);
    return html`

      <vaadin-app-layout id="app_layout">

        <vaadin-drawer-toggle slot="navbar">
          <sl-icon class="shadow-icon" name="list"></sl-icon>
        </vaadin-drawer-toggle>

        <!-- <svg id="logo" slot="navbar" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 32 32">
          <path d="M 6 4 L 6 6 L 4 6 L 4 8 L 2 8 L 2 10 L 6 10 L 6 26 L 17 26 L 17 24 L 8 24 L 8 10 L 12 10 L 12 8 L 10 8 L 10 6 L 8 6 L 8 4 L 6 4 z M 15 6 L 15 8 L 24 8 L 24 22 L 20 22 L 20 24 L 22 24 L 22 26 L 24 26 L 24 28 L 26 28 L 26 26 L 28 26 L 28 24 L 30 24 L 30 22 L 26 22 L 26 6 L 15 6 z"></path>
        </svg> -->

        <sl-icon class="svg-logo" name="quote-box" slot="navbar"></sl-icon>

        <h1 class="text-logo" slot="navbar">Fllw</h1>

        <sl-icon-button id="notification_button" class="shadow-icon" variant="text" name="bell-fill" slot="navbar" data-count="${globalThis.inviteCount || nothing}" @click="${ e => this.viewUserProfile(null, 'notifications') }"></sl-icon-button>

        ${
          this.context.did ?
          html`
            <a href="/profiles/${this.context.did}" slot="navbar">
              <sl-avatar id="user_avatar" image="${this.context?.avatar?.cache?.uri}" label="User avatar"></sl-avatar>
            </a>
          ` :
          html`
            <sl-button variant="primary" slot="navbar" @click="${ e => this.connectModal.show() }">
              <sl-icon slot="prefix" name="box-arrow-in-right"></sl-icon>
              Connect
            </sl-button>
          `
        }

        <nav id="global_nav" slot="drawer">
          <a href="/" ?active="${location.pathname === '/'}">
            <sl-icon slot="prefix" name="house"></sl-icon>
            <div>Home</div>
          </a>
          <a href="/profiles" ?active="${location.pathname.match('profiles') && !location.pathname.match(`profiles/${this.context.did}`)}">
            <sl-icon slot="prefix" name="user-search"></sl-icon>
            <div>Lookup</div>
          </a>
          <a href="/follows" ?active="${location.pathname.match('follows')}">
            <sl-icon slot="prefix" name="people"></sl-icon>
            <div>Follows</div>
          </a>
          <a href="/settings" ?active="${location.pathname.match('settings')}">
            <sl-icon slot="prefix" name="gear"></sl-icon>
            <div>Settings</div>
          </a>
        </nav>

        <main id="pages">
          <page-home id="home" scroll></page-home>
          <page-directory id="directory" scroll></page-directory>     
          <page-posts id="posts" scroll></page-posts>
          <page-follows id="follows" scroll></page-follows>
          <page-settings id="settings" scroll></page-settings>
          <page-profile id="profile" did="${this.context.did || nothing}" scroll></page-profile>
        </main>

      </vaadin-app-layout>

      <sl-dialog id="connect_modal" label="Connect" placement="start">
        <section flex="column center-x center-y">
          <sl-button variant="default" size="large" @click="${ e => {
            e.target.loading = true;
            this.createIdentity(true).then(did => {
              e.target.loading = false;
              router.navigateTo(`/profiles/${did}`);
              this.connectModal.hide();
            }) 
          }}">
            <sl-icon slot="prefix" name="person-plus"></sl-icon>
            Create a new identity
          </sl-button>
          <div break-text="OR"></div>
          <sl-button variant="default" size="large">
            <sl-icon slot="prefix" name="person-up"></sl-icon>
            Connect your identity
          </sl-button>
        </section>
      </sl-dialog>


      <sl-dialog id="first_run_modal" class="modal-page" no-header @sl-request-close="${e => e.detail.source === 'overlay' && e.preventDefault()}">
        <section>
          <h1 class="text-logo">Fllw</h1>
        </section>
        <section>
        
        </section>
      </sl-dialog>

      <sl-drawer id="view_members_modal" label="Community Members" placement="start">
        <member-list></member-list>
      </sl-drawer>

      <sl-dialog id="member_profile_modal" label="Member Profile" class="modal-page" @sl-request-close="${e => e.detail.source === 'overlay' && e.preventDefault()}">
        <profile-view id="member_profile_view"></profile-view>
      </sl-dialog>
    `;
  }
}
