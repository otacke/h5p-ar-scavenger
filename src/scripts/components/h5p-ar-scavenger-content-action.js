// Import required classes
import './h5p-ar-scavenger-content-action.scss';
import Util from '@scripts/h5p-ar-scavenger-util';

/** Class representing the action */
export default class ARScavengerContentAction {
  /**
   * @class
   * @param {object} [params] Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks) {
    // Sanitize params
    this.params = Util.extend({
      l10n: {
        nothingToSee: ''
      }
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};

    this.message = document.createElement('div');
    this.message.classList.add('h5p-ar-scavenger-content-action-message');
    this.message.innerText = Util.htmlDecode(this.params.l10n.nothingToSee);

    // Library Wrapper
    this.actionWrapper = document.createElement('div');
    this.actionWrapper.classList.add('h5p-ar-scavenger-content-action-library-wrapper');
    this.actionWrapper.classList.add('h5p-ar-scavenger-display-none');

    // Content
    this.content = document.createElement('div');
    this.content.classList.add('h5p-ar-scavenger-content-action');
    this.content.appendChild(this.actionWrapper);
    this.content.appendChild(this.message);

    // Container
    this.container = document.createElement('div');
    this.container.classList.add('h5p-ar-scavenger-content-action-container');
    this.container.appendChild(this.content);
  }

  /**
   * Set maximum height.
   * @param {number} maxHeight Maximum height for subject.
   */
  resizeIframeHeight(maxHeight) {
    if (typeof maxHeight === 'number') {
      this.container.style.maxHeight = `${maxHeight}px`;
    }
    else {
      this.container.style.maxHeight = '';
    }
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.container;
  }

  /**
   * Show action.
   */
  show() {
    this.container.classList.remove('h5p-ar-scavenger-display-none');
    this.actionWrapper.setAttribute('tabindex', 0);
    this.actionWrapper.focus();
  }

  /**
   * Show action.
   */
  hide() {
    this.actionWrapper.setAttribute('tabindex', -1);
    this.container.classList.add('h5p-ar-scavenger-display-none');
  }

  /**
   * Toggle view between action visible/invisible.
   * @param {boolean} state Toggle state.
   */
  toggleView(state) {
    this.container.classList.toggle('h5p-ar-scavenger-action-mode', state);
  }

  /**
   * Attach instance to action.
   * @param {HTMLElement} instanceDOM Instance.
   */
  attachInstance(instanceDOM) {
    this.content.removeChild(this.actionWrapper);
    this.actionWrapper = instanceDOM;
    this.content.appendChild(this.actionWrapper);
  }

  /**
   * Show content.
   */
  showContent() {
    this.actionWrapper.classList.remove('h5p-ar-scavenger-display-none');
    this.message.classList.add('h5p-ar-scavenger-display-none');
  }

  /**
   * Hide content.
   */
  hideContent() {
    this.actionWrapper.classList.add('h5p-ar-scavenger-display-none');
    this.message.classList.remove('h5p-ar-scavenger-display-none');
  }
}
