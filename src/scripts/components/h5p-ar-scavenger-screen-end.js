// Import required classes
import './h5p-ar-scavenger-screen-end.scss';
import ARScavengerScreen from './h5p-ar-scavenger-screen';
import ARScavengerFeedbackSection from './h5p-ar-scavenger-feedback-section';

/** Class representing the content */
export default class ARScavengerScreenEnd extends ARScavengerScreen {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks, contentId) {
    super(params, callbacks, contentId);

    this.feedbackSection = new ARScavengerFeedbackSection({}, {});
    this.button.parentNode.insertBefore(this.feedbackSection.getDOM(), this.button);
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
  setScore(score = 0) {
    this.feedbackSection.setScore(score);
  }

  /**
   * Set maximum score.
   * @param {number} [score=0] Maximum score.
   */
  setMaxScore(score = 0) {
    this.feedbackSection.setMaxScore(score);
  }
}
