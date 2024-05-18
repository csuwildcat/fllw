
import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { DOM } from '../utils/helpers.js';

@customElement('detail-box')
export class DetailBox extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        max-height: 10em;
        transition: max-height 0.3s ease;
        overflow: hidden;
      }

      #content {
        padding: 0 0 2.5em;
      }

      #toggle {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: absolute;
        bottom: 0;
        width: 100%;
        font-size: 80%;
        text-align: center;
        overflow: hidden;
        cursor: pointer;
      }

        :host(:not([overflow])) #toggle {
          display: none;
        }

      #toggle::before {
        content: "▿ See More";
        margin: 0.75em 0;
        padding: 0.25em 0.4em 0.35em 0.4em;
        border-radius: 3px;
        background: #000;
        box-shadow: 0 1px 3px 1px rgba(0 0 0 / 75%);
        border: 1px solid rgba(255 255 255 / 25%);
      }

        #toggle:hover::before {
          border-color: rgba(255 255 255 / 50%);
        }

        :host([open]) #toggle::before {
          content: "🞪 Close"
        }

      #toggle::after {
        content: "";
        display: block;
        position: absolute;
        bottom: -1em;
        height: 1em;
        width: calc(100% - 3em);
        border-radius: 100%;
        box-shadow: 0 0 1.5em 1em rgba(0 0 0 / 50%);
      }

        :host([open]) #toggle::after {
          opacity: 0.25;
        }
    `
  ]

  @property({ type: Boolean, reflect: true }) open = false;

  @query('#content', true) content;

  firstUpdated(){
    DOM.addEventDelegate('click', '[detail-box-toggle]', e => {
      this.toggle();
    }, { container: this })

    this.addEventListener('transitionend', e => {
      if (e.target === this && e.propertyName === 'max-height') {
        this.style.maxHeight = this.hasAttribute('open') ? 'none' : null;
      }
    });

    const resizeObserver = new ResizeObserver(() => this.#detectOverflow());
    resizeObserver.observe(this.content);
    this.#detectOverflow()
  }

  #detectOverflow(){
    if (this.content.scrollHeight > this.offsetHeight) {
      this.setAttribute('overflow', '')
    }
    else this.removeAttribute('overflow')
  }

  updated(changedProperties) {
    if (changedProperties.has('open')) {
      if (this.open) {
        if (this.offsetHeight < this.content.scrollHeight) {
          this.style.maxHeight = this.content.scrollHeight + 'px';
        }
      }
      else {
        this.style.maxHeight = this.content.scrollHeight + 'px';
        const scroll = this.scrollHeight;
        this.style.removeProperty('max-height');
      }
    }
  }

  toggle() {
    this.open = !this.open;
  }

  render(){
    return html`
      <section id="content" part="content"><slot></slot></section>
      <div id="toggle" part="toggle" detail-box-toggle></div>
    `
  }

}
