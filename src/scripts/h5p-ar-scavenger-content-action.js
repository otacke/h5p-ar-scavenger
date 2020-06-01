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
      markersLength: 0
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};

    this.interactions = new Array(this.params.markersLength);
    this.interactionsDOMs = new Array(this.params.markersLength);

    // TODO: Move this out of the action wrapper
    this.message = document.createElement('div');
    this.message.style.fontSize = '1.5em';
    this.message.innerHTML = 'Finde den richtigen Marker!';

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
   * @param {number} id Id of interaction,
   */
  attachInstance(instance, id) {
    if (id && id === this.currentInteractionId) {
      return; // Already attached
    }

    // Either preserve current DOM and retrieve existing one or create new one for instance.
    if (this.interactionsDOMs[id]) {
      this.interactionsDOMs[this.currentInteractionId] = this.content.removeChild(this.interactionsDOMs[this.currentInteractionId] || this.actionWrapper);
      this.content.appendChild(this.interactionsDOMs[id]);
    }
    else {
      if (this.currentInteractionId) {
        this.interactionsDOMs[this.currentInteractionId] = this.content.removeChild(this.actionWrapper);
      }
      else {
        this.content.removeChild(this.actionWrapper);
      }

      this.actionWrapper = document.createElement('div');
      this.actionWrapper.classList.add('h5p-ar-scavenger-content-action-library-wrapper');
      instance.attach(H5P.jQuery(this.actionWrapper));
      this.content.appendChild(this.actionWrapper);
    }

    this.currentInteractionId = id;
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
