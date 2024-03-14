import { css, unsafeCSS } from 'lit';
import { DOM } from './helpers';
import '../components/global.js'

const transitionDuration = 300;

export const SpinnerStyles = css`
  .spinner-mixin {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    background: var(--sl-panel-background-color);
    inset: 0;
    opacity: 0;
    transition: opacity ${transitionDuration}ms ease;
    z-index: 1000;
    pointer-events: none;
  }

  .spinner-mixin[spinner-show] {
    opacity: 1;
    pointer-events: all;
  }
`;

export const SpinnerMixin = (BaseClass) => class extends BaseClass {

  constructor() {
    super();
    let firstUpdatedResolve;
    const original = this.firstUpdated;
    this.#firstUpdatedPromise = new Promise(res => firstUpdatedResolve = res);
    this.firstUpdated = async (props) => {
      firstUpdatedResolve();
      await original?.call(this, props);
    };
  }

  private #firstUpdatedPromise;

  private #spinnerTransitionEnd(e){
    if (e.propertyName === 'opacity' && getComputedStyle(e.target).opacity === '0') {
      e.target.remove();
    }
  }

  private #createSpinnerElement() {
    const node = document.createElement('div');
          node.classList.add('spinner-mixin');
          node.ontransitionend = e => this.#spinnerTransitionEnd(e);
          node.appendChild(document.createElement('sl-spinner'));
    return node;
  }

  async startSpinner(selector, options = {}){
    await this.#firstUpdatedPromise;
    const host = selector ? this.shadowRoot.querySelector(selector) : this.shadowRoot;
    let spinner = host.querySelector('.spinner-mixin');
    if (spinner) {
      spinner.setAttribute('spinner-show', '');
      return;
    }
    spinner = this.#createSpinnerElement();
    host.append(spinner);
    if (options.minimum) spinner._spinnerMixinDelay = DOM.delay(options.minimum);
    options.renderImmediate ? spinner.setAttribute('spinner-show', '') : DOM.skipFrame(() => spinner.setAttribute('spinner-show', ''));
    await DOM.delay(transitionDuration);
  }

  async stopSpinner(selector){
    const host = selector ? this.shadowRoot.querySelector(selector) : this.shadowRoot;
    const spinner = host.querySelector('.spinner-mixin');
    await spinner?._spinnerMixinDelay;
    spinner?.removeAttribute?.('spinner-show');
    if (document.visibilityState === 'hidden') {
      spinner.remove();
    }
  }

};