// Import required classes
import Util from './h5p-ar-scavenger-util';

/** Class representing the content */
export default class ARScavengerContentTitlebar {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {string} params.title Title.
   * @param {object} params.a11y Accessibility strings.
   * @param {string} params.a11y.buttonToggleActive Text for inactive button.
   * @param {string} params.a11y.buttonToggleInactive Text for inactive button.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onbuttonToggle] Handles click.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      title: '',
      toggleButtonActiveOnStartup: true,
      a11y: {
        buttonToggleActive: 'toggle',
        buttonToggleInactive: 'toggle'
      }
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onButtonToggle = this.callbacks.onButtonToggle || (() => {});

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-ar-scavenger-title-bar');

    // Toggle button
    this.buttonToggle = document.createElement('div');
    this.buttonToggle.classList.add('h5p-ar-scavenger-button-overlay');
    this.buttonToggle.setAttribute('aria-pressed', this.params.toggleButtonActiveOnStartup);
    this.buttonToggle.setAttribute('role', 'button');
    this.buttonToggle.setAttribute('tabindex', '0');
    if (this.params.toggleButtonActiveOnStartup === true) {
      this.buttonToggle.classList.add('h5p-ar-scavenger-active');
      this.buttonToggle.setAttribute('aria-label', this.params.a11y.buttonToggleActive);
      this.buttonToggle.setAttribute('title', this.params.a11y.buttonToggleActive);
    }
    else {
      this.buttonToggle.setAttribute('aria-label', this.params.a11y.buttonToggleInActive);
      this.buttonToggle.setAttribute('title', this.params.a11y.buttonToggleInActive);
    }

    this.buttonToggle.addEventListener('click', this.callbacks.onButtonToggle);
    this.buttonToggle.addEventListener('keypress', this.callbacks.onButtonToggle);

    // Title
    const titleDOM = document.createElement('div');
    titleDOM.classList.add('h5p-ar-scavenger-title');
    titleDOM.innerHTML = this.params.title;

    this.titleBar.appendChild(this.buttonToggle);
    this.titleBar.appendChild(titleDOM);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Toggle the button state.
   * @return {boolean} True, if button is active, else false.
   */
  toggleOverlayButton() {
    const active = this.buttonToggle.classList.toggle('h5p-ar-scavenger-active');

    const buttonLabel = (active) ?
      this.params.a11y.buttonToggleActive :
      this.params.a11y.buttonToggleInactive;

    this.buttonToggle.setAttribute('aria-label', buttonLabel);
    this.buttonToggle.setAttribute('aria-pressed', active);
    this.buttonToggle.setAttribute('title', buttonLabel);

    return active;
  }
}
