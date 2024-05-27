import { LitElement, html, css, unsafeCSS, nothing, PropertyValueMap } from 'lit';
import { property, customElement, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import '../components/global.js'
import { DOM, notify } from '../utils/helpers.js';
import PageStyles from '../styles/page.css' assert { type: 'css' };

import '../components/story-list'

@customElement('page-stories')
export class PageStories extends LitElement {

  static styles = [
    PageStyles,
    css`
      
    `
  ]

  @consume({context: AppContext, subscribe: true})
  context;

  @property({ type: String })
  did;

  @property({ type: Boolean, reflect: true })
  owner;

  async onRouteEnter(route, path){
    const params = DOM.getQueryParams();
    await this.context.instance.initialize;
    this.did = path.did;
  }

  render() {
    return html`<story-list did="${this.did}"></story-list>`
  }
}
