import { LitElement, html, css, unsafeCSS } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import '../components/global.js'
import '../components/markdown-editor.js'
import PageStyles from '../styles/page.css' assert { type: 'css' };
import * as follows from '../utils/follows.js';

@customElement('page-posts')
export class PagePosts extends LitElement {

  static styles = [
    PageStyles,
    css`

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

  @property({ type: String })
  post;

  constructor() {
    super();
    
    //follows.initialize().then(() => this.getLatestPosts())
  }

  async onRouteEnter(route, path){
    this.did = path.did;
    this.post = path.post;
  }

  getPostsAfter(){
    console.log(follows.entries);
  }

  getPostsBefore(){
    console.log(follows.entries);
  }

  resolveDid(){

  }

  render() {
    return html`
      <header>
        ${this.did} ${this.post}
      </header>
      <!-- <div id="placeholder" default-content="cover firstrun">
        <h1>Welcome, let's get started.</h1>
        <sl-button variant="primary" slot="navbar" @click="${ e => this.context.instance.connectModal.show() }">
          <sl-icon slot="prefix" name="box-arrow-in-right"></sl-icon>
          Connect
        </sl-button>
        <sl-icon name="workplace"></sl-icon>   
      </div> -->
    `;
  }
}
