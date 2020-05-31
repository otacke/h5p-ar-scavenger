// Import required classes
import Util from './h5p-ar-scavenger-util';

/** Class representing the action */
export default class ARScavengerContentAction {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} params.action Library parameters.
   * @param {number} params.contentId Content Id.
   * @param {object} [params.previousState] PreviousState.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [params.callbacks.onInstanceReady] Callback for instance ready for content.
   */
  constructor(params, contentId, callbacks) {
    // Sanitize params
    this.params = Util.extend({
      previousState: {}
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onInstanceReady = this.callbacks.onInstanceReady || (() => {});

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
   * Show subject.
   */
  show() {
    this.container.classList.remove('h5p-ar-scavenger-display-none');
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

  loadContent(id, params, contentId) {
    if (id && id === this.currentInteractionId) {
      return; // Already displayed
    }

    // TODO: Clean up the control flow

    if (this.interactions[id]) {
      // We have an instance for that id already

      // Backup current DOM and restore previous one
      this.interactionsDOMs[this.currentInteractionId] = this.content.removeChild(this.interactionsDOMs[this.currentInteractionId] || this.actionWrapper);
      this.content.appendChild(this.interactionsDOMs[id]);

      this.currentInteractionId = id;

      // Return instance to content
      this.callbacks.onInstanceReady(this.interactions[id]);
      return;
    }
    else {
      if (this.currentInteractionId) {
        // We have a previous node

        // Backup current DOM and append new blank action wrapper to be replaced by instance DOM
        this.interactionsDOMs[this.currentInteractionId] = this.content.removeChild(this.interactionsDOMs[this.currentInteractionId] || this.actionWrapper);
        this.actionWrapper = document.createElement('div');
        this.actionWrapper.classList.add('h5p-ar-scavenger-content-action-library-wrapper');
        this.content.appendChild(this.actionWrapper);
      }

      // Create new instance replacing action wrapper DOM
      if (params.library) {
        this.actionMachineName = params.library.split(' ')[0];
      }

      // Create instance or failure message
      if (this.actionMachineName !== undefined && contentId) {
        this.interactions[id] = H5P.newRunnable(
          params,
          contentId,
          H5P.jQuery(this.actionWrapper),
          false,
          {previousState: this.params.previousState}
        );

        // Return instance to content
        this.callbacks.onInstanceReady(this.interactions[id]);
      }
      else {
        this.actionWrapper.innerHTML = 'Could not load content.';
      }

      this.currentInteractionId = id;
    }
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

  /**
   * Reset all interactions.
   */
  resetTask() {
    this.interactions.forEach((interaction) => {
      if (typeof interaction.resetTask === 'function') {
        interaction.resetTask();
      }
    });
  }
}
