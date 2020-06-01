// Import required classes
import Util from './h5p-ar-scavenger-util';

/** Class representing the action */
export default class ARScavengerContentAction {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
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

    // TODO: Move this out of the action wrapper
    this.message = document.createElement('div');
    this.message.style.fontSize = '1.5em';
    this.message.innerHTML = this.params.l10n.nothingToSee;

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
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.container;
  }

  /**
   * Show action.
   */
  show() {
    this.container.classList.remove('h5p-ar-scavenger-display-none');
  }

  /**
   * Show action.
   */
  hide() {
    this.container.classList.add('h5p-ar-scavenger-display-none');
  }

  /**
   * Toggle view between action visible/invisible.
   */
  toggleView(state) {
    if (state === undefined) {
      this.container.classList.toggle('h5p-ar-scavenger-action-mode');
    }
    else if (state) {
      this.container.classList.add('h5p-ar-scavenger-action-mode');
    }
    else {
      this.container.classList.remove('h5p-ar-scavenger-action-mode');
    }
  }

  /**
   * Attach instance to action.
   * @param {H5P.ContentType} instance Instance.
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
