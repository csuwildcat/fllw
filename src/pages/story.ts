import { LitElement, html, css, unsafeCSS, nothing, PropertyValueMap } from 'lit';
import { property, customElement, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import '../components/global.js'
import '../components/markdown-editor.js'
import { render as renderMarkdown } from '../utils/markdown.js';
import { hashToGradient } from '../utils/colors';
import { DOM, notify } from '../utils/helpers.js';
import PageStyles from  '../styles/page.css';

import '../components/w5-img'

const matchTitleRegex = /\s*#\s+([^\n]+)/;

@customElement('page-story')
export class PageStory extends LitElement {

  static styles = [
    unsafeCSS(PageStyles),
    css`

      :host {
        overflow-x: hidden;
        --hero-background-padding: clamp(4em, 100vw, 10em);
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
        top: 0;
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
        top: var(--header-height);
        box-sizing: border-box;
        height: 3em;
        padding: 0.1em 0.4em 0;
        z-index: 2;
      }

      #editor::part(body),
      #rendered_story {
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
        margin: 1em 0 0;
        padding: 1em 0.75em;
        background: var(--grey);
        border-radius: var(--block-radius);
        box-shadow: var(--block-shadow);
      }

      #publish_button {
        min-width: 5.8em;
      }

      #publish_button::part(base) {
        transition: color 0.3s ease, background-color 0.3s ease;
      }

      #edit_hero_container {
        position: relative;
        width: 100%;
      }

      #edit_hero_background {
        --hero-background-padding: clamp(4em, 10vw, 6em);
        position: absolute;
        top: 50%;
        left: 50%;
        width: calc(100% + var(--hero-background-padding));
        height: calc(100% + var(--hero-background-padding));
        border-radius: var(--block-radius);
        transform: translate(-50%, -50%);
        z-index: 0;
      }

        #edit_hero_background::part(image)  {
          filter: blur(16px);
        }

        #edit_hero_background::after {
          width: 100%;
          height: 100%;
          border: none;
          box-shadow: 0 0 3em 2em inset var(--body-bk), 0 0 4em 3em inset var(--body-bk);
        }



      #edit_hero {
        width: 100%;
        min-height: 15em;
        max-height: 20em;
        border-radius: var(--block-radius);
        background: var(--deterministic-background);
        /* opacity: calc(1 - var(--scroll-distance) / 400);
        transform: translateY(calc(var(--scroll-distance)* 0.2%));
        transition: transform 0.3s ease;
        will-change: transform, opacity; */
      }

      #edit_hero::after {
        display: none;
      }

      #edit_hero[src][loaded] {
        background: none;
      } 

      /* #edit_hero::after {
        display: none;
      } */

      #rendered_story .markdown-body {

      }

      #view_panel .markdown-body > :first-child {
        margin-top: 0;
        padding-top: 0;
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
        #editor::part(body) {
          padding: 0;
        }

        #edit_hero {
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
      this.renderedStory = renderMarkdown(this?.editor?.content || '')
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
      this.editor.content = this?.story?.cache?.json?.markdown;
      this.handleEditorUpdate();
    }, { once: true })
  }

  async onRouteEnter(route, path){
    const params = DOM.getQueryParams();
    this.panel = params?.mode?.[0];
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
      console.log(this.story);
      const data = this.story?.cache?.json;
      if (data) {
        this.setTitle(data.markdown);
        if (data.hero) {
          datastore.readStoryMedia(data.hero).then(record => {
            this.story._hero = record;
            console.log(record);
            this.requestUpdate();
          });
        }
      }
      this.deterministicBackground = hashToGradient(this.story.id);
    }
    
    this._storyLoadResolve();
  }

  switchModes(e){
    const mode = this.panel = e.target.value;
  }

  save = DOM.debounce(async () => {
    const data = this.story.cache.json;
    data.markdown = this.editor.content;
    const response = await this.story.update({ data });
    this.story.send(this.story.author);
    this.story.cache = {
      json: await this.story.data?.json?.()?.catch(e => {})?.then(obj => obj || {})
    }
  }, 2000)

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

  async handleFileChange(type, input){
    await this.context.initialize;
    const file = input.files[0];
    if (type === 'hero') {
      await datastore.setStoryHero(this.story, { data: file })
    }
    else {
      await datastore.createStoryMedia(this.story, { data: file });
    }
    this.requestUpdate();
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
              ${this.renderedStory}
            </div>
          </sl-tab-panel>
          ${ !this.owner ? nothing : html`
            <sl-tab-panel id="edit_panel" name="edit" ?active="${this.panel === 'edit'}">
              <markdown-editor id="editor" @afterupdate="${e => this.handleDebouncedEditorUpdate(true)}">
                <div id="edit_hero_container" slot="before-content">
                  <w5-img id="edit_hero_background" class="hero" src="${this?.story?._hero?.cache?.uri || nothing}" style="--deterministic-background: ${this.deterministicBackground}"></w5-img>
                  <w5-img id="edit_hero" class="hero" src="${this?.story?._hero?.cache?.uri || nothing}" style="--deterministic-background: ${this.deterministicBackground}">
                    <sl-icon-button class="edit-button" name="pencil" size="medium" @click="${e => this.heroInput.click()}"></sl-icon-button>
                    <input id="hero_input" type="file" accept="image/png, image/jpeg, image/gif" style="display: none" @change="${e => this.handleFileChange('hero', this.heroInput)}" />
                  </w5-img>
                </div>
              </markdown-editor>
            </sl-tab-panel>
          `} 
        </sl-tab-group>
      </section>
    `;
  }
}
