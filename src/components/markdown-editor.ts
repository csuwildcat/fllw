import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';

import { ink } from 'ink-mde';
import * as markdown from  '../utils/markdown.js';

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

  @property({ type: Boolean })
  submit = false;

  async firstUpdated() {
    this.editor = ink(this.renderRoot.querySelector('#editor'), {
      interface: {
        lists: true
      }
    });

    console.log(this.editor, this.renderRoot.querySelector('.cm-editor'));

    this.renderRoot.addEventListener('keydown', e => {
      if (this.submit && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const value = this.content?.trim?.();
        if (value) {
          DOM.fireEvent(this, 'markdown-editor-submit', {
            detail: { value }
          })
        }
        return false;
      }
    }, true)

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

  // #onAfterShow(){
  //   this.codemirror.refresh();
  //   this.modal.setAttribute('open', 'complete');
  // }

}
