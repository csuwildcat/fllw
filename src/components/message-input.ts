import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { Editor } from 'bytemd'
import * as markdown from  '../utils/markdown.js';

import ScrollStyles from '../styles/scroll.js'
import { DOM, notify } from '../utils/helpers.js';
import './global.js'

export interface MessageInput {
  editor: Editor
  codemirror: any
}

@customElement('message-input')
export class MessageInput extends LitElement {
  static styles = [
    markdown.styles,
    ScrollStyles({ theme: 'light' }),
    css`

      :host {
        overflow: hidden;
        background: none;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.04);
      }

      .bytemd {
        height: auto;
        max-height: 100%;
        background: none;
        border-radius: inherit;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }

      .bytemd-toolbar {
        padding: 0.3em 0.2em;
        color: #fff;
        background: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .bytemd-toolbar-left > *:is([bytemd-tippy-path="0"], [bytemd-tippy-path="14"], [bytemd-tippy-path="15"]) {
        display: none;
      }

      .bytemd-toolbar-icon:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .bytemd-toolbar-right,
      .bytemd-status {
        display: none;
      }

      .bytemd-body {
        height: auto;
        max-height: 400px;
      }

      .bytemd-editor {
        width: 100%;
      }

      .bytemd-preview {
        background: none;
      }

      .bytemd-editor .CodeMirror .CodeMirror-lines,
      .bytemd-preview .markdown-body {
        margin: 0;
      }

      .bytemd-editor .CodeMirror {
        height: auto;
        color: #fff;
        background: none;
      }

      .CodeMirror-code {
        padding-bottom: 1em;
        font-family: var(--font-family);
      }

      .CodeMirror-lines {
        padding: 1em 0 !important;
      }

      .CodeMirror-line {
        padding: 0px 1em !important;
      }

        .cm-header {
          color: #90aed6 !important;
        }

        .cm-comment {
          color: #c89e74 !important;
        }

      .CodeMirror-cursor {
        border-color: #bbb !important;
      }

      .CodeMirror-selected {
        background: rgba(255,255,255,0.1) !important;
      }

      .CodeMirror-selected:not(:first-child) {
        margin-left: -11px;
      }



      .bytemd .CodeMirror-scroll {
        overflow-x: hidden !important;
      }

      .bytemd-preview {
        background: none;
      }

      .bytemd-preview .markdown-body {
        padding: 1em;
        font-size: 14px;
      }

    `
  ]

  async firstUpdated() {
    this.editor = new Editor({
      target: this.renderRoot,
      props: {
        value: '',
        plugins: markdown.plugins,
      },
      placeholder: 'Enter a message',
      previewDebounce: 10
    })

    this.codemirror = this.renderRoot.querySelector('.CodeMirror').CodeMirror;

    this.renderRoot.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.cancelBubble = true;
        e.preventDefault();
        const value = this.content?.trim?.();
        if (value) {
          DOM.fireEvent(this, 'message-input-submit', {
            detail: { value }
          })
        }
        return false;
      }
      this.content = this.codemirror.getValue()
    }, true)

    this.renderRoot.addEventListener('keyup', e => {
      this.content = this.codemirror.getValue()
    })
  }

  get content(){
    return this.codemirror.getValue()
  }

  set content(markdown){
    this.editor.$set({ value: markdown || '' })
  }

  // #onAfterShow(){
  //   this.codemirror.refresh();
  //   this.modal.setAttribute('open', 'complete');
  // }

}
