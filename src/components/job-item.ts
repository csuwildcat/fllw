import { LitElement, html, css, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { format, intervalToDuration, formatDuration } from "date-fns";

import { natives } from '../utils/helpers.js';
import './global.js'

import PageStyles from '../styles/page.css' assert { type: 'css' };

@customElement('job-item')
export class JobItem extends LitElement {
  static styles = [
    PageStyles,
    css`

      :host {
        display: flex;
      }

      :host img {
        box-sizing: border-box;
        align-self: start;
        width: 4em;
        padding: 0.2em;
        border: 1px solid rgba(255 255 255 / 0.25);
        border-radius: 6px;
      }

      :host > div:first-child {
        margin: 0 1em 0 0;
      }

      :host > div:first-child sl-icon-button {
        margin: 0.3em 0 0;
      }

      :host strong {
        margin: 0 0 0.4em;
        font-weight: normal;
      }

      :host small {
        margin: 0 0 0.2em;
        color: rgba(255 255 255 / 0.6);
      }

      :host p {
        white-space: pre-wrap;
      }
    `
  ]

  @property({type: String}) employer = '';
  @property({type: String}) title = '';
  @property({type: String}) url = '';
  @property({type: String}) description = '';
  @property({type: String, attribute: 'start-date' }) startDate = '';
  @property({type: String, attribute: 'end-date' }) endDate = '';

  willUpdate(changedProperties) {
    console.log(changedProperties)
    if (changedProperties.has('startDate') || changedProperties.has('endDate')) {
      this._startDate = new Date(this.startDate);
      this._endDate = this.endDate ? new Date(this.endDate) : null;
      this.duration = formatDuration(
        intervalToDuration({
          start: this._startDate,
          end: this._endDate || new Date()
        }),
        { format: ['years', 'months'] }
      )
    }
  }

  render() {
    return html`
      <div flex="column center-x">
        <img src="https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${this.url}&size=128"/>
        <slot name="left-content"></slot>
      </div>
      <div flex="column align-start">
        <strong>${this.title}</strong>
        <small>${this.employer}</small>
        <small>${format(this._startDate, 'MMM yyy')} - ${this._endDate ? format(this._endDate, 'MMM yyy') : 'Present'} · ${this.duration}</small>
        <p>${this.description}</p>
      </div>
    `;
  }
}
