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
      story-list:not([more-content]) > sl-button {
        display: none;
      }
    `
  ]

  @consume({context: AppContext, subscribe: true})
  context;

  @property({ type: String })
  did;

  @property({ type: Boolean, reflect: true })
  owner;

  @query('#story_list', true)
  stortList;

  async onRouteEnter(route, path){
    const params = DOM.getQueryParams();
    await this.context.instance.initialize;
    this.did = path.did;
  }

  render() {
    return html`
      <story-list did="${this.did}">
        <sl-button slot="content-end" @click="${ e => this.storyList.getStories() }">Load More</sl-button>
      </story-list>
    `
  }
}
