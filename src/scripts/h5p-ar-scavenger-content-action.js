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

    // if (this.params.action && this.params.action.library) {
    //   this.actionMachineName = this.params.action.library.split(' ')[0];
    // }

    this.message = document.createElement('div');
    this.message.style.fontSize = '1.5em';
    this.message.innerHTML = 'Finde den richtigen Marker!';

    // Library Wrapper
    this.actionWrapper = document.createElement('div');
    this.actionWrapper.classList.add('h5p-ar-scavenger-content-action-library-wrapper');
    this.actionWrapper.classList.add('h5p-ar-scavenger-display-none');

    // // Create instance or failure message
    // if (this.actionMachineName !== undefined && contentId) {
    //   this.instanceAction = H5P.newRunnable(
    //     this.params.action,
    //     contentId,
    //     H5P.jQuery(this.actionWrapper),
    //     false,
    //     {previousState: this.params.previousState}
    //   );
    //
    //   // Return instance to content
    //   this.callbacks.onInstanceReady(this.instanceAction);
    // }
    // else {
    //   this.actionWrapper.innerHTML = 'Could not load content.';
    // }

    // Content
    const content = document.createElement('div');
    content.classList.add('h5p-ar-scavenger-content-action');
    content.appendChild(this.message);
    content.appendChild(this.actionWrapper);

    // Container
    this.container = document.createElement('div');
    this.container.classList.add('h5p-ar-scavenger-content-action-container');
    this.container.appendChild(content);
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

  loadContent(params, contentId) {
    // TODO: store instances once loaded and bring them back instead if available
    if (params.library) {
      this.actionMachineName = params.library.split(' ')[0];
    }

    // Create instance or failure message
    if (this.actionMachineName !== undefined && contentId) {
      this.instanceAction = H5P.newRunnable(
        params,
        contentId,
        H5P.jQuery(this.actionWrapper),
        false,
        {previousState: this.params.previousState}
      );

      // Return instance to content
      this.callbacks.onInstanceReady(this.instanceAction);
    }
    else {
      this.actionWrapper.innerHTML = 'Could not load content.';
    }
  }

  showContent() {
    this.actionWrapper.classList.remove('h5p-ar-scavenger-display-none');
    this.message.classList.add('h5p-ar-scavenger-display-none');
  }

  hideContent() {
    this.actionWrapper.classList.add('h5p-ar-scavenger-display-none');
    this.message.classList.remove('h5p-ar-scavenger-display-none');
  }
}
