import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './global.js'
import * as markdown from '../utils/markdown.js';
import PageStyles from '../styles/page.css' assert { type: 'css' };

@customElement('story-item')
export class StoryItem extends LitElement {

  static styles = [
    PageStyles,
    css`

      :host {
        display: block;
        position: relative;
      }

      :host > a {
        display: flex;
        max-height: 11em;
        text-decoration: none;
        color: inherit;
      }

      :host > a:last-child {
        padding-bottom: 0;
        border: none;
      }

      :host > a > w5-img {
        --size: clamp(4em, 20vw, 10em);
        margin-right: 1.5em;
        border-radius: 0.4em;
      }

      #buttons {
        display: flex;
        justify-content: center;
        position: absolute;
        top: 1.65em;
        right: 0.5em;
        z-index: 2;
      }

      #buttons sl-button {
        margin: 0 0.25em;
      }

      #buttons sl-button::part(base) {
        min-height: auto;
        font-weight: bold;
        line-height: 1.75em;
      }

      #buttons sl-button::part(label) {
        padding: 0 0.75em;
      }

      :host .markdown-body {
        position: relative;
        font-size: 0.85em;
        overflow: hidden;
      }

      :host .markdown-body h1 {
        font-size: 1.75em;
      }

      :host .markdown-body h2 {
        font-size: 1.6em;
      }

      :host .markdown-body h3 {
        font-size: 1.45em;
      }

      :host .markdown-body:after {
        content: "";
        display: block;
        position: absolute;
        bottom: 0;
        width: 100%;
        padding: 2em 0 0.8em;
        text-align: center;
        background: linear-gradient(transparent, var(--grey) 90%);
      }

      :host a .markdown-body > :first-child {
        margin-top: 0;
      }

      @media(max-width: 500px) {

        :host > a {
          flex-direction: column;
          height: auto;
          max-height: 20em;
          padding: 0.75em 0 1.25em;
        }

        :host > a > w5-img {
          --size: 100%;
          max-height: 10em;
          margin: 0 0 1em;
        }

        #buttons {
          top: 2.7em;
          right: 1em;
        }
      }
    `
  ]

  @property({ type: String, reflect: true })
  id;

  @property({ type: Boolean })
  owner;

  #record;
  get record() {
    return this.#record;
  }
  set record(record) {
    if (!record) return;
    this.#record = record;
    this.id = record.id;
    this.requestUpdate();
  }

  async deleteStory(){
    const response = await datastore.deleteStory(this.record.id);
    console.log(response);
    DOM.fireEvent(this, 'story-deleted', {
      detail: {
        id: this.record.id
      }
    });
    this.remove();
  }

  async togglePublication(){
    await this.record.update({ published: !this.record.published });
    await this.record.send(this.record.author).catch(e => console.log(e));
    this.requestUpdate();
  }

  render() {
    if (!this.record) return;
    const data = this.record.cache.json;
    const node = markdown.render(data.markdown || '');
    Array.from(node.children).slice(3).forEach(child => child.remove())
    return html`
      <a href="profiles/${this.record.author}/stories/${this.record.id}" flex>
        <w5-img src="https://dweb/${this.record.author}/records/${data.hero}"></w5-img>
        ${node}
      </a>
      ${
        this.owner ?
          html`
            <div id="buttons">
              <sl-button size="small" pill variant="${this.record.published ? 'primary' : 'success'}" @click="${e => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePublication()
              }}">
                ${this.record.published ? 'Unpublish' : 'Publish'}
              </sl-button>
              <sl-button size="small" pill variant="danger" @click="${e => this.deleteStory()}">Delete</sl-button>
            </div>
          ` : 
          nothing
      }
    `
  }
}
