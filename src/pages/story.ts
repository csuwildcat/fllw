import { LitElement, html, css, unsafeCSS, nothing, PropertyValueMap } from 'lit';
import { property, customElement, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import '../components/global.js'
import '../components/markdown-editor.js'
import * as markdown from '../utils/markdown.js';
import { channels } from '../utils/broadcast.js';
import { hashToGradient } from '../utils/colors.js';
import { DOM, notify } from '../utils/helpers.js';
import PageStyles from '../styles/page.css' assert { type: 'css' };

import '../components/w5-img'

const matchTitleRegex = /\s*#\s+([^\n]+)/;

@customElement('page-story')
export class PageStory extends LitElement {

  static styles = [
    PageStyles,
    ...markdown.styles,
    css`

      :host {
        overflow-x: hidden;
        --hero-border-radius: 0.2em;
        --hero-background-padding: clamp(4em, 100vw, 6em);
      }

      #content {
        min-height: 100%;
      }

      #header,
      #editor::part(toolbar) {
        background: hsl(240deg 4% 14% / 90%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.01);
        box-shadow: 0px 1px 0px 1px rgba(0, 0, 0, 0.2);
      }

      #header {
        position: sticky;
        top: var(--header-height);
        box-sizing: border-box;
        height: var(--header-height);
        padding: 0 0.65em 0 0.9em;
        z-index: 3;
      }

      #header > h2 {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
        top: calc(var(--header-height) * 2);
        box-sizing: border-box;
        height: 3em;
        padding: 0.1em 0.4em 0;
        z-index: 2;
      }

      #editor::part(body), #rendered_story {
        box-sizing: border-box;
        width: 100%;
        max-width: 680px;
        margin: 0 auto;
        padding: calc(var(--hero-background-padding) / 2) 1.25em 3em;
        z-index: 1;
      }

      #editor::part(body) {
        overflow: visible;
      }

      #editor::part(textarea),
      #rendered_story .markdown-body {
        flex: 1;
        margin: 1.5em 0 0;
        padding: 0em 1em;
        background: none;
      }

      #editor::part(textarea) {
        width: 100%;
        box-sizing: border-box;
        z-index: 2;
      }

      #publish_button {
        min-width: 5.8em;
      }

      #publish_button::part(base) {
        transition: color 0.3s ease, background-color 0.3s ease;
      }

      .hero {
        position: sticky;
        box-sizing: border-box;
        width: 100%;
        min-height: 14em;
        max-height: 20em;
        border: 1px solid rgba(255 255 255 / 7%);
        border-radius: var(--hero-border-radius);
        opacity: calc(1 - var(--scroll-position) / 310);
        transform: translateY(calc(var(--scroll-position)* 0.4px));
        will-change: transform, opacity;
        filter: blur(clamp(0px, calc(var(--scroll-position)* 0.05px), 2px));
        z-index: -1;
      }

      .hero profile-card {
        position: absolute;
        top: 0.5em;
        left: 0.5em;
        padding: 0.3em;
        font-size: 0.7em;
        background: rgba(0 0 0 / 50%);
        z-index: 2;
      }

      .hero profile-card::part(image) {
        --size: 1.5rem;
        margin-right: 0.75em;
      }

      #edit_hero::after {
        display: none;
      }

      #edit_hero:not([src])::part(fallback) {
        display: block;
      }

      #edit_hero:not([src]) {
        background: rgba(255 255 255 / 5%);
        border: 5px dashed rgba(255 255 255 / 10%);
      }

      #edit_hero[src][loaded] {
        background: none;
      }

      #rendered_story .markdown-body img {
        display: block;
        width: 90%;
        max-width: 600px;
        margin: 2em auto;
      }

      #view_panel .markdown-body > :first-child {
        margin-top: 0;
        padding-top: 0;
      }

      #rendered_story .bytemd-mermaid > svg {
        display: block;
        margin: 0 auto;
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

      @media(max-width: 430px) {
        #editor::part(body), #rendered_story {
          padding: 0;
        }

        .hero {
          border-radius: 0;
        }
      }
    `
  ]

  static properties = {
    avatar: {
      type: Object
    },
    hero: {
      type: Object
    }
  }

  @consume({context: AppContext, subscribe: true})
  context;

  @query('#editor')
  editor;

  @query('#hero_input')
  heroInput;

  @query('#publish_button', true)
  publishButton;

  @property({ type: String })
  deterministicBackground;

  @property({ type: String })
  did;

  @property({ type: Boolean, reflect: true })
  owner;

  #panel = 'view';
  @property({ type: String, reflect: true })
  get panel() {
    return this.#panel;
  }
  set panel(mode) {
    mode = this.#panel = mode?.match?.(/(view|edit)/)?.[1] || 'view';
    if (mode === 'view') {
      this.renderStory();
    }
    else if (mode === 'edit') {
      DOM.skipFrame(() => this?.editor?.focus?.());
    }
  }

  #story;
  @property({ type: Object })
  get story() {
    return this.#story;
  }
  set story(record) {
    this.#story = record;

  }

  constructor() {
    super();
    this.storyLoaded = new Promise(resolve => this._storyLoadResolve = resolve);
    this.addEventListener('editor-ready', async () => {
      await this.storyLoaded;
      this.editor.fileHandler = async (file) => {
        const record = await this.storeMedia(file);
        return `http://dweb/${this.story.author}/records/${record.id}`;
      }
      this.editor.content = this?.story?.cache?.json?.markdown;
      this.renderStory();
      this.handleEditorUpdate();
    }, { once: true })
  }

  async onRouteLeave(route){
    if (this.storyModified) {
      await this.#save();
      channels.recordUpdate.publish({
        record: this?.story?.toJSON()
      });
    }
  }

  async onRouteEnter(route, path){
    this.storyModified = false;
    const params = DOM.getQueryParams();
    this.panel = params?.mode?.[0];
    await this.context.instance.initialize;
    this.did = path.did;
    this.owner = this.did === this.context.did;
    const currentStory = this?.story?.id;
    if (!currentStory || currentStory !== path.story) {
      if (path.story && path.story !== 'new') {
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
      else if (path.story === 'new') {
        this.story = await datastore.createStory({
          data: {
markdown: `# YOUR TITLE HERE

- You can use markdown
- Add a hero image to your story
- Have fun!
`
          }
        });
        this.panel = 'edit';
        router.replaceState(`/profiles/${this.did}/stories/${this.story.id}?mode=edit`);
      }
      const data = this.story?.cache?.json;
      if (data) {
        if (this.editor) this.editor.content = data.markdown;
        this.setTitle(data.markdown); 
        this.renderStory(data.markdown);
      }
      this.deterministicBackground = hashToGradient(this.story.id);
    }
    this._storyLoadResolve();
  }

  renderStory(content){
    this.renderedStory = markdown.render(content || this?.editor?.content || '')
  }

  switchModes(e){
    const mode = this.panel = e.target.value;
  }

  #save = async () => {
    const data = this.story.cache.json;
    data.markdown = this.editor.content;
    const response = await this.story.update({ data });
    this.story.send(this.story.author);
    this.story.cache = {
      json: await this.story.data?.json?.()?.catch(e => {})?.then(obj => obj || {})
    }
  };

  save = DOM.debounce(this.#save, 2000)

  #title = 'Untitled';
  setTitle(val){
    this.#title = val?.match?.(matchTitleRegex)?.[1] || 'Untitled';
  }

  async handleEditorUpdate(save = false) {
    this.setTitle(this.editor.content);
    this.requestUpdate();
    if (save === true) {
      this.save();
    }
  }

  handleDebouncedEditorUpdate = DOM.debounce(save => this.handleEditorUpdate(save), 200)

  async storeMedia(file, isHero = false){
    if (!file) return;
    await this.context.initialize;
    let record;
    if (isHero) {
      record = await datastore.setStoryHero(this.story, { data: file })
    }
    else {
      record = await datastore.createStoryMedia(this.story, { data: file });
    }
    this.requestUpdate();
    return record;
  }

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
    const heroDRL = data?.hero && `http://dweb/${this.story.author}/records/${data.hero}`;
    return html`
      <section id="content" flex="column">
        <header id="header" flex="center-y">
          <h2>${this.#title}</h2>
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
          <sl-tab-panel id="view_panel" name="view" ?active="${!this.owner || this.panel === 'view'}">
            <div id="rendered_story">
              <w5-img class="hero" src="${heroDRL || nothing}">
                ${ this?.story?.author ? html`<profile-card did="${this.story.author}" minimal></profile-card>` : nothing }
              </w5-img>
              ${this.renderedStory}
            </div>
          </sl-tab-panel>
          ${ !this.owner ? nothing : html`
            <sl-tab-panel id="edit_panel" name="edit" ?active="${this.panel === 'edit'}">
              <markdown-editor id="editor" @afterupdate="${e => {
                this.storyModified = true;
                this.handleDebouncedEditorUpdate(true)
              }}">
                <w5-img id="edit_hero" class="hero" src="${heroDRL || nothing}" slot="before-content">
                  <sl-icon-button class="edit-button" name="pencil" size="medium" @click="${e => this.heroInput.click()}"></sl-icon-button>
                  <input id="hero_input" type="file" accept="image/png, image/jpeg, image/gif" style="display: none" @change="${e => this.storeMedia(this.heroInput?.files?.[0], true)}" />
                </w5-img>
              </markdown-editor>
            </sl-tab-panel>
          `} 
        </sl-tab-group>
      </section>
    `;
  }
}
