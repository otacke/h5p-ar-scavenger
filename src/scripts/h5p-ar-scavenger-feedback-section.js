// Import required classes
import Util from './h5p-ar-scavenger-util';

/** Class representing the content */
export default class ARScavengerFeedbackSection {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};

    // Feedback section
    this.feedbackSection = document.createElement('div');
    this.feedbackSection.classList.add('h5p-ar-scavenger-feedback-section');

    this.scoreText = document.createElement('div');
    this.scoreText.classList.add('h5p-ar-scavenger-score-text');
    this.scoreText.innerText = '';
    this.feedbackSection.appendChild(this.scoreText);

    this.scoreBar = H5P.JoubelUI.createScoreBar(0);
    this.scoreBar.setScore(-1); // Won't update otherwise because maxScore is set later
    this.scoreBar.appendTo(H5P.jQuery(this.feedbackSection));
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.feedbackSection;
  }

  /**
   * Show feedback section.
   */
  show() {
    this.feedbackSection.classList.remove('h5p-ar-scavenger-display-none');
  }

  /**
   * Hide feedback section.
   */
  hide() {
    this.feedbackSection.classList.add('h5p-ar-scavenger-display-none');
  }

  /**
  * Set score.
  * @param {number} [score=0] Score.
  */
  setScore(score = 0) {
    this.scoreBar.setScore(score);
  }

  /**
   * Set maximum score.
   * @param {number} [score=0] Maximum score.
   */
  setMaxScore(score = 0) {
    this.scoreBar.setMaxScore(score);
  }

  /**
   * Set score text.
   * @param {string} [scoreText=''] Score text.
   */
  setScoreText(scoreText = '') {
    this.scoreText.innerText = Util.htmlDecode(scoreText);
  }
}
