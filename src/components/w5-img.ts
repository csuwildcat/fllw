import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('w5-img')
export class W5Image extends LitElement {
  static styles = [
    css`

      :host {
        --size: 6rem;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        width: var(--size);
        height: var(--size);
        flex-shrink: 0;
      }

      #image {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        border: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        filter: drop-shadow(0px 1px 1px rgba(0, 0, 0, 1));
        z-index: 2;
      }

      #image[loaded] {
        opacity: 1;
      }

      [part="fallback"] {
        position: absolute;
        top: 50%;
        left: 50%;
        width: auto;
        margin: 0;
        padding: 0;
        font-size: 3rem;
        z-index: 1;
        transform: translate(-50%, -50%);
        transition: opacity 0.3s ease;
      }

      :host([loaded]) [part="fallback"] {
        opacity: 0;
      }
    `
  ]

  static properties = {
    src: {
      type: String
    },
    fallback: {
      type: String
    }
  };

  @query('#image', true)
  image

  updated(props){
    if (props.has('src')) {
      this.removeAttribute('loaded');
      if (this.image) {
        this.image.removeAttribute('loaded');
        this.image.src = this.src;
      }
    }
  }

  loaded(){
    this.setAttribute('loaded', '')
    this?.image.setAttribute('loaded', '')
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <img id="image" part="image" src="${ ifDefined(this.src) }" @load="${e => this.loaded() }" @error="${ e => DOM.fireEvent(this, 'error', { detail: { originalTarget: this } }) }"/>
      ${ this?.fallback?.match(/^[a-zA-Z0-9]+:/) ? html`<img part="fallback" src="${this.fallback}">` : html`<sl-icon part="fallback" name="${this.fallback || 'image'}"></sl-icon>` }
      <slot></slot>
    `;
  }
}
