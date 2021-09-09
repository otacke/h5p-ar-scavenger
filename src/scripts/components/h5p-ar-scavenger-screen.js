import './h5p-ar-scavenger-screen.scss';

/** Class representing a screen */
export default class ARScavengerScreen {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks, contentId) {
    this.params = params;

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClose = callbacks.onClose || (() => {});

    this.baseClassName = 'h5p-ar-scavenger-screen';

    // Screen
    this.screen = document.createElement('div');
    this.screen.classList.add(`${this.baseClassName}`);
    if (this.params.id) {
      this.screen.classList.add(`${this.baseClassName}-${this.params.id}`);
    }

    // image (optional)
    if (this.params.screenImage && this.params.screenImage.params && this.params.screenImage.params.file) {
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add(`${this.baseClassName}-image-wrapper`);
      if (this.params.screenText) {
        imageWrapper.classList.add('small-margin-bottom');
      }

      H5P.newRunnable(params.screenImage, contentId, H5P.jQuery(imageWrapper), false);
      const image = imageWrapper.querySelector('img');
      image.classList.add(`${this.baseClassName}-image`);
      image.style.height = 'auto';
      image.style.width = 'auto';

      const bar = document.createElement('div');
      bar.classList.add(`${this.baseClassName}-image-bar`);
      imageWrapper.appendChild(bar);

      this.screen.appendChild(imageWrapper);
    }

    if (this.params.screenText) {
      const introduction = document.createElement('div');
      introduction.classList.add(`${this.baseClassName}-text`);
      introduction.innerHTML = this.params.screenText;
      this.screen.appendChild(introduction);
    }

    // button
    this.button = H5P.JoubelUI.createButton({
      class: `${this.baseClassName}-button-close`,
      text: this.params.l10n.buttonText,
      click: this.callbacks.onClose
    }).get(0);

    this.hide();
    this.screen.appendChild(this.button);
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
   * @param {object} params Parameters.
   * @param {boolean} [focusStartButton] If true, start button will get focus.
   */
  show(params = {}) {
    this.screen.classList.remove('h5p-ar-scavenger-display-none');

    if (params.focusStartButton) {
      this.button.focus();
    }
  }

  /**
   * Hide title screen.
   */
  hide() {
    this.screen.classList.add('h5p-ar-scavenger-display-none');
  }
}
