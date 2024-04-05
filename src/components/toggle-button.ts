import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';

@customElement('toggle-button')
export class ToggleButton extends LitElement {

  static properties = {
    _states: { type: String, attribute: 'states' },
    currentIndex: { type: Number, state: true },
  };

  constructor() {
    super();
    this._states = 'View,Edit'; // Default states as a string
    this.currentIndex = 0; // Start at the first state
  }

  static styles = css`
    :host {
      display: inline-block;
    }
  `;

  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback(name, oldVal, newVal);
    if (name === 'states' && newVal !== oldVal) {
      this.states = newVal.split(',').map(state => state.trim());
      this.currentIndex = 0; // Reset to first state
    }
  }

  // Function to toggle the state
  toggleState() {
    this.currentIndex = (this.currentIndex + 1) % this.states.length;
  }

  render() {
    return html`
      <sl-button @click="${this.toggleState}">
        ${this.states[this.currentIndex]}
      </sl-button>
    `;
  }
}

customElements.define('toggle-button', ToggleButton);