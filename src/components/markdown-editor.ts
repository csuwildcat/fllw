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

      :host {
        display: flex;
        width: 100%;
        --border-color: #38383b;
        --border-width: 2px;
        --border: var(--border-width) solid var(--border-color);
      }
      
      #editor {
        flex: 1;
      }

      .ink-mde {
        min-height: 100%;
        border: var(--border);
      }

      .ink-mde .ink-mde-editor {
        cursor: text;
        padding: 0;
        align-items: center;
      }

      .ink-mde .ink-mde-toolbar {
        max-width: 100vw;
        align-items: center;
        overflow: hidden;
      }

      .ink-mde .ink-mde-toolbar .ink-mde-container {
        gap: 0;
      }
      
      .ink-mde .cm-editor {
        outline: none;
      }

      .ink-mde .cm-focused {
        outline: none !important;
      }

      .cm-line:only-child:has(br:only-child)::before {
        content: "Your story starts here...";
        position: absolute;
        opacity: 0.3;
      }

      .ink-mde .ink-mde-details {
        background: var(--border-color);
      }

      @media(max-width: 430px) {
        .ink-mde .ink-mde-toolbar {
          position: sticky;
          bottom: 0;
          order: 2;
        }
      }

    `
  ]

  constructor(){
    super();
  }

  async firstUpdated() {
    const editorElement = this.renderRoot.querySelector('#editor');
    this.editor = ink(editorElement, {
      doc: this._content || '',
      interface: {
        attribution: false,
        toolbar: true,
        lists: true
      },
      toolbar: {
        bold: true,
        code: false,
        codeBlock: true,
        heading: true,
        image: true,
        italic: true,
        link: true,
        list: false,
        orderedList: true,
        quote: true,
        taskList: true,
        upload: false,
      },
      hooks: {
        beforeUpdate: () => DOM.fireEvent(this, 'beforeupdate'),
        afterUpdate: () => DOM.fireEvent(this, 'afterupdate')
      },
    });

    const toolbar = editorElement.querySelector('.ink-mde-toolbar');
    const body = editorElement.querySelector('.ink-mde-editor');
    const textarea = editorElement.querySelector('.cm-editor');

    const beforeContent = document.createElement('slot');
          beforeContent.name = 'before-content'
    const afterContent = document.createElement('slot');
          afterContent.name = 'after-content'

    toolbar.setAttribute('part', 'toolbar');
    body.setAttribute('part', 'body'); 
    textarea.setAttribute('part', 'textarea');

    body.prepend(beforeContent);
    body.append(afterContent);

    DOM.addEventDelegate('click', '.ink', e => this.focus(), {
      container: editorElement,
      avoid: '.ink-mde-toolbar'
    });

    DOM.fireEvent(this, 'editor-ready');
  }

  render() {
    return html`<div id="editor" part="editor"></div>`
  }

  focus(){
    this.editor.focus();
  }

  get content(){
    return this.editor.getDoc()
  }

  set content(markdown){
    if (this.editor) {
      delete this._content;
      this.editor.update(markdown || '')
    }
    else this._content = markdown;
  }

}
