import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import '../components/global.js'
import '../components/markdown-editor.js'
import PageStyles from  '../styles/page.css';

@customElement('page-story')
export class PageStory extends LitElement {

  static styles = [
    unsafeCSS(PageStyles),
    css`

      #header {
        padding: 0.7em 0.65em 0.6em;
      }

      #owner_nav {
        margin: 0 0 0 auto;
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
    `
  ]

  @consume({context: AppContext, subscribe: true})
  context;

  @property({ type: String })
  did;

  @property({ type: Object })
  story;

  constructor() {
    super();
    //follows.initialize().then(() => this.getLatestPosts())
  }

  async onRouteEnter(route, path){
    console.log(123)
    await this.context.instance.initialize;
    this.did = path.did;
    this.owner = this.did === this.context.did;
    const currentStory = this?.story?.id;
    if (!currentStory || currentStory !== path.story) {
      if (path.story) {
        this.story = await datastore.readStory(path.story, { from: this.did });
      }
      else {
        this.story = await datastore.createStory();
        router.navigateTo(`/profiles/${this.did}/stories/${this.story.id}`);
      }
    }
    
  }

  resolveDid(){

  }

  render() {
    const data = this?.story?.cache?.json || {};
    return html`
      <header id="header" flex="center-y">
        ${this.did} ${this?.story?.id}
        ${
          !this.owner ? nothing : html`
            <nav id="owner_nav">
              <sl-radio-group size="small" value="view">
                <sl-radio-button value="view">
                  <sl-icon slot="prefix" name="eye"></sl-icon>
                  View
                </sl-radio-button>
                <sl-radio-button value="edit">
                  <sl-icon slot="prefix" name="pencil"></sl-icon>
                  Edit
                </sl-radio-button>
              </sl-radio-group>
            </nav>`
        }
      </header>
      <sl-tab-group>
        <sl-tab-panel name="view" active>This is the view tab panel.</sl-tab-panel>
        ${ !this.owner ? nothing : html`<sl-tab-panel name="edit">This is the edit tab panel.</sl-tab-panel>` } 
      </sl-tab-group>
    `;
  }
}
