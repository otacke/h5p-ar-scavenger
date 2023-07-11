// Import required classes
import './h5p-ar-scavenger-screen-end.scss';
import ARScavengerScreen from './h5p-ar-scavenger-screen';
import ARScavengerFeedbackSection from './h5p-ar-scavenger-feedback-section';

/** Class representing the end screen */
export default class ARScavengerScreenEnd extends ARScavengerScreen {
  /**
   * @class
   * @param {object} [params] Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   * @param {number} contentId Content id.
   */
  constructor(params = {}, callbacks = {}, contentId) {
    super(params, callbacks, contentId);

    this.feedbackSection = new ARScavengerFeedbackSection({}, {});
    this.button.parentNode.insertBefore(this.feedbackSection.getDOM(), this.button);
  }

  /**
   * Set score text.
   * @param {string} [scoreText] Score text.
   */
  setScoreText(scoreText = '') {
    this.feedbackSection.setScoreText(scoreText);
  }

  /**
   * Set score.
   * @param {number} [score] Score.
   */
  setScore(score = 0) {
    this.feedbackSection.setScore(score);
  }

  /**
   * Set maximum score.
   * @param {number} [score] Maximum score.
   */
  setMaxScore(score = 0) {
    this.feedbackSection.setMaxScore(score);
  }
}
