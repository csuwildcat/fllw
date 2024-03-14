import { LitElement, html, css, render, nothing, unsafeCSS } from 'lit';
import { consume } from '@lit/context';
import { customElement, query, property } from 'lit/decorators.js';

import { AppContext } from '../utils/context.js';

import { DOM, notify } from '../utils/helpers.js';
import { SpinnerMixin, SpinnerStyles } from '../utils/spinner';

import PageStyles from  '../styles/page.css';
const transitionDuration = 300;

@customElement('add-community')
export class MemberList extends SpinnerMixin(LitElement) {

  @consume({context: AppContext, subscribe: true})
  app;

  static styles = [
    unsafeCSS(PageStyles),
    SpinnerStyles,
    css`
      :host {

      }

      sl-tab-group::part(nav) {
        justify-content: center;
      }

      sl-tab::part(base) {
        flex: 1;
      }

      sl-tab-panel::part(base) {
        padding-bottom: 0;
      }

      #existing_community_input {
        flex: 1;
        margin: 0 0.5em 0 0;
      }

    `
  ]

  @query('#new_community_name', true)
  newCommunityName

  @query('#new_community_description', true)
  newCommunityDescription

  @query('#existing_community_input', true)
  existingCommunityInput

  async createCommunity(e){
    const name = this.newCommunityName.value;
    const description = this.newCommunityDescription.value;
    if (!name || !description) {
      notify.error('You must add a name and description to create a new community')
      return;
    }
    const community = await datastore.createCommunity({ data: {
      name,
      description
    }});
    try {
      this.app.instance.addCommunity(community);
      console.log('send', this.app.communities);
      this.app.instance.router.navigateTo(`/communities/${community.id}`);
      DOM.fireEvent(this, 'community-added', {
        detail: {
          community
        }
      })
      notify.success('Your new community was created!')
    }
    catch(e) {
      notify.error('There was a problem creating your new community')
    }
  }

  async lookupExistingCommunity(e){
    console.log(e);

  }

  async addExistingCommunity(e){

  }

  render() {
    return html`
      <sl-tab-group>
        <sl-tab slot="nav" panel="new-community">New Community</sl-tab>
        <sl-tab slot="nav" panel="existing-community">Existing Community</sl-tab>

        <sl-tab-panel name="new-community">
          <sl-input id="new_community_name" label="Community Name" placeholder="Enter name"></sl-input>
          <sl-textarea id="new_community_description" label="Description" placeholder="Enter a brief description"></sl-textarea>
          <sl-button variant="primary" @click="${ e => this.createCommunity() }">Create</sl-button>
        </sl-tab-panel>

        <sl-tab-panel id="existing_community" name="existing-community">
          <div flex="center-y">
            <sl-input id="existing_community_input"
                      placeholder="Enter a Community ID"
                      @keydown="${ e => e.key === 'Enter' && this.lookupExistingCommunity() }"
            ></sl-input>
            <sl-button variant="primary" @click="${ e => this.lookupExistingCommunity() }" slot="suffix">Find</sl-button>
          </div>
          <div id="existing_community_result">
            <!-- Placeholder for lookup result or spinner -->
          </div>
        </sl-tab-panel>
      </sl-tab-group>
    `;
  }
}
