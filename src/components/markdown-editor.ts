import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';

import { ink } from 'ink-mde';
// import * as markdown from  '../utils/markdown.js';

import { DOM } from '../utils/helpers.js';
import './global.js'

@customElement('markdown-editor')
export class MarkdownEditor extends LitElement {
  static styles = [
    css`

      .ink-mde {
        border-color: #38383b;
      }

      .ink-mde .ink-mde-details {
        background-color: #38383b;
      }

      .cm-editor {
        outline: none;
      }

    `
  ]

  async firstUpdated() {
    this.editor = ink(this.renderRoot.querySelector('#editor'), {
      interface: {
        toolbar: true,
        lists: true
      }
    });
  }

  render() {
    return html`<div id="editor"></div>`
  }

  focus(){
    this.editor.focus();
  }

  get content(){
    return this.editor.getDoc()
  }

  set content(markdown){
    this.editor.update(markdown || '')
  }

}
