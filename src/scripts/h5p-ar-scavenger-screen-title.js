// Import required classes
import Util from './h5p-ar-scavenger-util';

/** Class representing the content */
export default class ARScavengerScreenTitle {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks, contentId) {
    // Set missing params
    this.params = Util.extend({
      l10n: {
        start: 'Start'
      }
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClose = this.callbacks.onClose || (() => {});

    // Screen
    this.screen = document.createElement('div');
    this.screen.classList.add('h5p-ar-scavenger-screen-title');

    // Title image (optional)
    if (this.params.titleScreenImage && this.params.titleScreenImage.params && this.params.titleScreenImage.params.file) {
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('h5p-ar-scavenger-screen-title-image-wrapper');
      H5P.newRunnable(params.titleScreenImage, contentId, H5P.jQuery(imageWrapper), false);
      const image = imageWrapper.querySelector('img');
      image.classList.add('h5p-ar-scavenger-screen-title-image');
      image.style.height = 'auto';
      image.style.width = 'auto';
      this.screen.appendChild(imageWrapper);
    }

    if (this.params.titleScreenIntroduction) {
      const introduction = document.createElement('div');
      introduction.classList.add('h5p-ar-scavenger-screen-title-introduction');
      introduction.innerHTML = this.params.titleScreenIntroduction;
      this.screen.appendChild(introduction);
    }

    // Start button
    const button = H5P.JoubelUI.createButton({
      class: 'h5p-ar-scavenger-screen-title-button-start',
      text: this.params.l10n.start,
      click: this.callbacks.onClose
    }).get(0);

    this.screen.appendChild(button);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.screen;
  }

  /**
   * Show title screen.
   */
  show() {
    this.screen.classList.remove('h5p-ar-scavenger-display-none');
  }

  /**
   * Hide title screen.
   */
  hide() {
    this.screen.classList.add('h5p-ar-scavenger-display-none');
  }
}
