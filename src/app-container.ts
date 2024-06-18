
import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { provide } from '@lit/context';
import { AppContext, AppContextMixin } from './utils/context.js';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { setAnimation } from '@shoelace-style/shoelace/dist/utilities/animation-registry.js';
import { AppRouter } from './components/router';
import * as protocols from './utils/protocols';

import { activatePolyfills } from './utils/web-features.js';

import './styles/global.css';
import './components/global.js';
import './styles/theme.js';
import { DOM, notify, natives } from './utils/helpers.js';
import PageStyles from './styles/page.css' assert { type: 'css' };

import { SpinnerMixin, SpinnerStyles } from './utils/spinner.js';

import '@vaadin/app-layout/theme/lumo/vaadin-app-layout.js';
import '@vaadin/app-layout/theme/lumo/vaadin-drawer-toggle.js';

import './pages/home';
import './pages/directory.js';
import './pages/follows.js';
import './pages/settings.js';
import './pages/profile.js';
import './pages/story.js';
import './pages/stories.js';

// const BASE_URL: string = (import.meta.env.BASE_URL).length > 2 ? (import.meta.env.BASE_URL).slice(1, -1) : (import.meta.env.BASE_URL);

activatePolyfills();

const rootElement = document.documentElement;
const rootStyles = rootElement.style;
let lastScrollPosition = 0;
function setScrollFactor(){
  const scrollPosition = window.scrollY;
  rootElement.setAttribute('scroll-direction', !scrollPosition || scrollPosition > lastScrollPosition ? 'down' : 'up');
  rootStyles.setProperty('--scroll-position', scrollPosition);
  rootStyles.setProperty('--scroll-height', rootElement.scrollHeight);
  lastScrollPosition = scrollPosition;
}

window.addEventListener('scroll', () => requestAnimationFrame(setScrollFactor));

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
    PageStyles,
    SpinnerStyles,
    css`

      :host {
        display: flex;
        flex-direction: column;
      }

      #app_header {
        position: sticky;
        top: 0;
        box-sizing: border-box;
        width: 100%;
        height: var(--header-height);
        min-height: var(--header-height);
        padding: 0 0.5em 0 0;
        font-size: calc(var(--header-height) / 1.3rem);
        background: var(--header-bk);
        box-shadow: 0 0 2px 2px rgba(0 0 0 / 25%);
        z-index: 2;
      }

      #global_nav_toggle {
        display: none;
        position: absolute;
        align-items: center;
        height: 100%;
        font-size: 1.55em;
        cursor: pointer;
      }

      #global_nav_toggle::part(svg) {
        color: rgba(0 0 0 / 65%);
        transform: translateX(-0.4em);
        transition: transform 0.3s ease, color 0.3s ease;
      }

      #global_nav_toggle:hover::part(svg) {
        color: rgba(0 0 0 / 100%);
        transform: translateX(-0.3em);
      }

      #app_header .svg-logo {
        font-size: 1.9em;
        margin: 0 0 0 0.6em;
        color: var(--logo-color);
      }

      h1 {
        display: flex;
        align-items: center;
      }

      h1 img {
        height: 2em;
        margin-right: 0.5em;
      }

      #app_header h1.text-logo {
        margin: 0 0.6em 0 0.15em;
        font-size: 1.9em;
        color: var(--logo-color);
      }

      #app_header h1.text-logo + * {
        margin-left: auto;
      }

      #app_header h1.text-logo ~ *[slot="navbar"] {
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

      #global_nav {
        position: fixed;
        bottom: 0;
        width: var(--nav-width);
        height: var(--content-height);
        padding: 0.5em 0;
        box-sizing: border-box;
        background: #1a1a1e;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0px 2px 1px 2px rgba(0, 0, 0, 0.25);
        z-index: 1;
      }

      #global_nav a {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.8em 1em;
        opacity: 0.65;
        transition: opacity 0.3s ease;
        text-decoration: none;
        color: #fff;
        cursor: pointer;
      }

      #global_nav a sl-icon {
        font-size: 1.5em;
        margin: 0 0 0.1em;
      }

      #global_nav a div {
        font-size: 0.75em;
        color: rgba(255,255,255,0.8);
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

     

      /* PAGES */

      main {
        display: flex;
        position: relative; 
        margin: 0 0 0 var(--nav-width);
      }

      main > * {
        position: absolute;
        top: 0;
        box-sizing: border-box;
        width: 100%;
        height: var(--content-height);
        opacity: 0;
        background-color: var(--body-bk) !important;
        visibility: hidden;
        transition: visibility 0.3s, opacity 0.3s ease;
        overflow: hidden;
        z-index: -1;
      }

      main > [route-state="active"] {
        position: relative;
        height: auto;
        min-height: var(--content-height);
        opacity: 1;
        z-index: 0;
        visibility: visible;
        overflow: visible;
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

      @media(max-width: 800px) {

        #global_nav_toggle {
          display: flex;
        }

        #global_nav {
          height: 100%;
          width: 160px;
          transition: transform 0.3s ease;
          transform: translateX(-100%);
          z-index: 2;
        }

        #global_nav::before {
          content: "";
          display: block;
          position: absolute;
          top: 0;
          left: 100%;
          height: 100vh;
          width: 100vw;
          background: rgba(0 0 0 / 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        #app_header:has(#global_nav_toggle[active]) ~ #global_nav {
          transform: translateX(0);
        }

        #app_header:has(#global_nav_toggle[active]) ~ #global_nav::before {
          opacity: 1;
          pointer-events: all;
        }

        #global_nav a {
          flex-direction: row;
          font-size: 1em;
        }

        #global_nav a div {
          font-size: 1em;
        }

        #global_nav a sl-icon {
          margin: 0 0.4em 0 0;
        }

        main {
          margin: 0;
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

  @query('#global_nav_toggle', true)
  globalNavToggle;

  @query('#global_nav', true)
  globalNav;

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

  @query('#story', true)
  storyPage;

  @provide({ context: AppContext })
  context;

  constructor() {
    super();

    this.router = globalThis.router = new AppRouter(this, {
      onRouteChange: async (route, path) => {
        //console.log(route, path);
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
          path: '/profiles(/)?:did?',
          component: async (route, path) => {
            await this.initialize;
            if (path.did === this.context.did) {
              return this.profilePage;
            }
            else {
              return this.directoryPage;
            }
          }
        },
        {
          path: '/profiles/:did?/stories',
          component: '#stories'
        },
        {
          path: '/profiles/:did/stories/:story?',
          component: '#story'
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

    this.context.initialize = this.#initialize();
  }

  #initialization: Promise<void> | null = null;

  async #initialize(){
    return this.#initialization = this.#initialization || new Promise(async resolve => {
      this.startSpinner(null, { minimum: 0, renderImmediate: true });
      if (localStorage.connected) {
        await this.loadProfile(localStorage.did);
      }
      else {
        // await this.getIdentity() 
      }
      this.initialized = true;
      resolve();
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

      <header id="app_header" flex="center-y">
        
        <sl-icon id="global_nav_toggle" flex class="shadow-icon" name="list" @click="${e => this.globalNavToggle.toggleAttribute('active')}"></sl-icon>

        <sl-icon class="svg-logo" name="quote-box"></sl-icon>

        <h1 class="text-logo">Fllw</h1>

        <sl-icon-button id="notification_button" class="shadow-icon" variant="text" name="bell-fill" slot="navbar" data-count="${globalThis.inviteCount || nothing}" @click="${ e => this.viewUserProfile(null, 'notifications') }"></sl-icon-button>

        ${
          this.context.connected ?
            html`
              <a href="/profiles/${this.context.did}">
                <sl-avatar id="user_avatar" image="${this.context?.avatar?.cache?.uri}" label="User avatar"></sl-avatar>
              </a>
            ` :
            html`
              <sl-button size="small" @click="${ e => this.connectModal.show() }">
                <sl-icon slot="prefix" name="box-arrow-in-right"></sl-icon>
                Connect
              </sl-button>
            `
        }

      </header>

      <nav id="global_nav" @click="${e => this.globalNavToggle.removeAttribute('active')}">
        <a href="/" ?active="${location.pathname === '/'}">
          <sl-icon slot="prefix" name="house"></sl-icon>
          <div>Home</div>
        </a>
        <a href="/profiles" ?active="${this.router.activeComponent === this.directoryPage}">
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

      <main>
        <page-home id="home" scroll></page-home>
        <page-directory id="directory" scroll></page-directory>
        <page-stories id="stories" scroll></page-stories>   
        <page-story id="story" scroll></page-story>
        <page-follows id="follows" scroll></page-follows>
        <page-settings id="settings" scroll></page-settings>
        <page-profile id="profile" did="${this.context.did || nothing}" scroll></page-profile>
      </main>

      <sl-dialog id="connect_modal" label="Connect" placement="start">
        <section flex="column center-x center-y">
          <sl-button variant="default" size="large" @click="${ async e => {
            e.target.loading = true;
            const did = await this.loadProfile();
            e.target.loading = false;
            router.navigateTo(`/profiles/${did}`);
            this.connectModal.hide();
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
