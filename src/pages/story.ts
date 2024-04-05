import { LitElement, html, css, unsafeCSS, nothing, PropertyValueMap } from 'lit';
import { property, customElement, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import '../components/global.js'
import '../components/markdown-editor.js'
import { DOM, notify } from '../utils/helpers.js';
import PageStyles from  '../styles/page.css';

const matchTitleRegex = /\s*#\s+([^\n]+)/;

@customElement('page-story')
export class PageStory extends LitElement {

  static styles = [
    unsafeCSS(PageStyles),
    css`

      :host {
        --header-height: 3.25em;
        overflow: auto;
      }

      #content {
        min-height: 100%;
      }

      #header {
        position: sticky;
        top: 0;
        box-sizing: border-box;
        height: 3.25em;
        padding: 0 0.65em 0 0.9em;
        z-index: 2;
      }

      #header,
      #editor::part(toolbar) {
        background: hsl(240deg 4% 14% / 90%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.01);
        box-shadow: 0px 1px 0px 1px rgba(0, 0, 0, 0.2);
      }

      #owner_nav {
        margin: 0 0 0 auto;
      }

      #owner_nav > * {
        margin: 0 0em 0 1em;
      }

      #owner_nav sl-radio-button:not([checked])::part(button) {
        background: none;
      }

      #owner_nav sl-radio-button::part(button) {
        transition: color 0.2s ease;
      }

      #owner_nav sl-radio-button:not([checked]):hover::part(button) {
        color: var(--sl-color-primary-600);
        border-color: var(--sl-color-neutral-300);
      }

      #tabs::part(base),
      #tabs::part(body) {
        flex: 1;
        width: 100%;
      }

      #tabs::part(body) {
        overflow: visible;
      }

      #tabs::part(nav) {
        display: none;
      }

      #tabs sl-tab-panel[active] {
        display: flex;
        min-height: 100%;
      }

      #tabs sl-tab-panel::part(base) {
        display: flex;
        flex: 1;
        padding: 0;
      }

      #editor {
        --border-color: none;
        --border-width: 0;
      }

      #editor::part(toolbar) {
        position: sticky;
        top: var(--header-height);
        padding: 0.4em 0.4em 0.25em;
        z-index: 1;
      }

      #editor::part(edit-area) {
        flex: 1;
        max-width: 680px;
        margin: 2em auto;
        padding: 1em 0.75em;
        background: var(--grey);
        border-radius: 0.25em;
      }

      #publish_button {
        min-width: 5.8em;
      }

      #publish_button::part(base) {
        transition: color 0.3s ease, background-color 0.3s ease;
      }

      #placeholder > div {
        width: 100%;
      }

      #placeholder sl-input {
        width: 90vw;
        max-width: 400px;
        margin: 0 0.5em 0 0;
      }

      #placeholder > sl-icon {
        height: auto;
        width: calc(100% - 4rem);
        max-width: 800px;
      }

      #placeholder > sl-icon::part(svg) {
        height: 100%;
        width: 100%;
        filter: drop-shadow(rgba(255, 255, 255, 0.5) 0px 1px 0px) drop-shadow(rgba(0, 0, 0, 1) 0px 2px 1px);
      }
      
      @media(max-width: 600px) {

        #owner_nav sl-radio-button::part(button) {
          padding: 0 0.1em 0 0.5em;
          font-size: 1em;
        }
        #owner_nav sl-radio-button::part(label) {
          padding-right: 0;
        }
        #owner_nav sl-radio-button span {
          display: none;
        }
      }
    `
  ]

  @consume({context: AppContext, subscribe: true})
  context;

  @property({ type: String })
  did;

  @property({ type: Boolean, reflect: true })
  owner;

  @property({ type: Object })
  story;

  @property({ type: String, reflect: true })
  panel;

  @query('#editor', true)
  editor;

  @query('#publish_button', true)
  publishButton;

  constructor() {
    super();
    this.storyLoaded = new Promise(resolve => this._storyLoadResolve = resolve);
    this.addEventListener('editor-ready', async () => {
      await this.storyLoaded;
      this.editor.content = this?.story?.cache?.json?.markdown;
      this.handleEditorUpdate();
    }, { once: true })
  }

  async onRouteEnter(route, path){
    const params = DOM.getQueryParams();
    const mode = params?.mode?.[0];
    this.panel = mode?.match?.(/view|edit/) ? mode : 'view';
    await this.context.instance.initialize;
    this.did = path.did;
    this.owner = this.did === this.context.did;
    const currentStory = this?.story?.id;
    if (!currentStory || currentStory !== path.story) {
      if (path.story) {
        try {
          this.story = await datastore.readStory(path.story, this.owner ? {} : { from: this.did });
        }
        catch(e){
          if (e.code === 401) {
            router.navigateTo(`/`);
            notify.error("That story doesn't exist");
            return;
          }
        }
      }
      else {
        this.story = await datastore.createStory();
        this.panel = 'edit';
        router.replaceState(`/profiles/${this.did}/stories/${this.story.id}?mode=edit`);
      }

      console.log(this.story);
      this.setTitle(this.story?.cache?.json?.markdown);
      this.requestUpdate();
    }
    this._storyLoadResolve();
  }

  switchModes(e){
    this.panel = e.target.value;
  }

  save = DOM.debounce(async () => {
    const response = await this.story.update({
      data: {
        markdown: this.editor.content
      }
    })
    this.story.send(this.did);
    this.story.cache = {
      json: await this.story.data?.json?.()?.catch(e => {})?.then(obj => obj || {})
    }
  }, 2000)

  private title = 'Untitled';
  setTitle(val){
    this.title = val?.match?.(matchTitleRegex)?.[1] || 'Untitled';
  }

  async handleEditorUpdate(save = false) {
    this.setTitle(this.editor.content);
    this.requestUpdate();
    if (save === true) this.save();
  }

  handleDebouncedEditorUpdate = DOM.debounce(save => this.handleEditorUpdate(save), 200)

  async togglePublishState(){
    this.publishButton.loading = true;
    const { status } = await this.story.update({ published: !this.story.published });
    this.story.send(this.did);
    this.publishButton.loading = false;
    this.requestUpdate();
  }

  render() {
    const published = this?.story?.published;
    const data = this?.story?.cache?.json || {};
    return html`
      <section id="content" flex="column">
        <header id="header" flex="center-y">
          <h2>${this.title}</h2>
          ${
            !this.owner ? nothing : html`
              <nav id="owner_nav" flex="center-y">
                <sl-radio-group size="small" value="${ this.panel || 'view' }" @sl-change="${this.switchModes}">
                  <sl-radio-button value="view">
                    <sl-icon slot="prefix" name="eye"></sl-icon>
                    <span>View</span>
                  </sl-radio-button>
                  <sl-radio-button value="edit">
                    <sl-icon slot="prefix" name="pencil"></sl-icon>
                    <span>Edit</span>
                  </sl-radio-button>
                </sl-radio-group>
                <sl-button id="publish_button" size="small" variant="${published ? 'default' : 'success'}" @click="${this.togglePublishState}">
                  <sl-icon slot="prefix" name="${published ? 'x' : 'send'}"></sl-icon>
                  ${published ? 'Unpublish' : 'Publish'}
                </sl-button>
              </nav>`
          }
        </header>
        <sl-tab-group id="tabs" flex="fill">
          <sl-tab-panel id="view_panel" name="view" ?active="${!this.owner || this.panel === 'view'}">This is the view tab panel.</sl-tab-panel>
          ${ !this.owner ? nothing : html`
            <sl-tab-panel id="edit_panel" name="edit" ?active="${this.panel === 'edit'}">
              <markdown-editor id="editor" @afterupdate="${e => this.handleDebouncedEditorUpdate(true)}"></markdown-editor>
            </sl-tab-panel>
          `} 
        </sl-tab-group>
      </section>
    `;
  }
}
