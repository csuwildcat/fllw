import { LitElement, html, css, nothing, unsafeCSS } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { AppContext } from '../utils/context.js';

import '../components/global.js'
import '../components/profile-card.js';
import Follows from '../utils/follows.js'
import PageStyles from '../styles/page.css' assert { type: 'css' };
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner.js';
import config from '../config.json' assert { type: 'json' };

@customElement('page-home')
export class PageHome extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  @property({ type: Object })
  context;

  @property({ type: String })
  did;

  static styles = [
    PageStyles,
    SpinnerStyles,
    css`

      #placeholder > div {
        width: 100%;
      }

      #placeholder sl-input {
        width: 90vw;
        max-width: 400px;
        margin: 0 0.5em 0 0;
      }

      #placeholder > sl-icon {
        height: auto;
        width: calc(100% - 4rem);
        max-width: 800px;
      }

      #placeholder > sl-icon::part(svg) {
        height: 100%;
        width: 100%;
        filter: drop-shadow(rgba(255, 255, 255, 0.5) 0px 1px 0px) drop-shadow(rgba(0, 0, 0, 1) 0px 2px 1px);
      }
    `
  ]

  async willUpdate(props) {
    if (props.has('did') && this.did) {
      this.startSpinner(null, { renderImmediate: true });
      await this.context.initialize;
      this.follows = Follows.getInstance();
      this.follows.addEventListener('follows-loaded', e => {
        console.log(this.follows.aggregators);
      })
      await this.follows.initialize;
      this.stopSpinner();
    }
  }

  // getPostsAfter(){
  //   console.log(follows.entries);
  // }

  // getPostsBefore(){
  //   console.log(follows.entries);
  // }

  render() {
    const forceIntro = 0;
    if (!forceIntro && this.context.did) {  
      if (this.follows?.entries?.length) {
        return this.follows.entries.map(follow => {
          return html`${follow.recipient}`
        })
      }
      else {
        return config.suggestedFollows.map(did => html`<profile-card did="${did}"></profile-card>`)
      }
    }
    else {
      return html`
        <div id="placeholder" default-content="cover firstrun">
          <h1>Welcome, let's get started.</h1>
          <sl-button variant="primary" slot="navbar" @click="${ e => this.context.instance.connectModal.show() }">
            <sl-icon slot="prefix" name="box-arrow-in-right"></sl-icon>
            Connect
          </sl-button>
          <sl-icon name="workplace"></sl-icon> 
        </div>
      `
    }
  }
}
