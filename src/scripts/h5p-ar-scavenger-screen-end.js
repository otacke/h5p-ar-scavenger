// Import required classes
import ARScavengerFeedbackSection from './h5p-ar-scavenger-feedback-section';
import Util from './h5p-ar-scavenger-util';

/** Class representing the content */
export default class ARScavengerScreenEnd {
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
        retry: 'Retry'
      }
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClose = this.callbacks.onRetry || (() => {});

    // Screen
    this.screen = document.createElement('div');
    this.screen.classList.add('h5p-ar-scavenger-screen-end');

    // End image (optional)
    if (this.params.endScreenImage && this.params.endScreenImage.params && this.params.endScreenImage.params.file) {
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('h5p-ar-scavenger-screen-end-image-wrapper');
      H5P.newRunnable(params.endScreenImage, contentId, H5P.jQuery(imageWrapper), false);
      const image = imageWrapper.querySelector('img');
      image.classList.add('h5p-ar-scavenger-screen-end-image');
      image.style.height = 'auto';
      image.style.width = 'auto';
      this.screen.appendChild(imageWrapper);
    }

    if (this.params.endScreenOutro) {
      const outro = document.createElement('div');
      outro.classList.add('h5p-ar-scavenger-screen-end-outro');
      outro.innerHTML = this.params.endScreenOutro;
      this.screen.appendChild(outro);
    }

    this.feedbackSection = new ARScavengerFeedbackSection({}, {});
    this.screen.appendChild(this.feedbackSection.getDOM());

    // Retry button
    const button = H5P.JoubelUI.createButton({
      class: 'h5p-ar-scavenger-screen-end-button-retry',
      text: this.params.l10n.retry,
      click: this.callbacks.onRetry
    }).get(0);

    this.hide();
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

  /**
   * Set score text.
   * @param {string} [scoreText=''] Score text.
   */
  setScoreText(scoreText = '') {
    this.feedbackSection.setScoreText(scoreText);
  }

  /**
   * Set score.
   * @param {number} [score=0] Score.
   */
  setScore(scoreText = 0) {
    this.feedbackSection.setScore(scoreText);
  }

  /**
   * Set maximum score.
   * @param {number} [score=0] Maximum score.
   */
  setMaxScore(score = 0) {
    this.feedbackSection.setMaxScore(score);
  }
}
