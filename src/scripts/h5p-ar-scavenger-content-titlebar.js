// Import required classes
import ARScavengerButton from './h5p-ar-scavenger-button';
import Util from './h5p-ar-scavenger-util';

/** Class representing the content */
export default class ARScavengerContentTitlebar {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {boolean} params.canHasFullScreen If true, will have fullscreen button.
   * @param {boolean} params.buttonQuit If true, will have quit button.
   * @param {string} params.title Title.
   * @param {object} params.a11y Accessibility strings.
   * @param {string} params.a11y.buttonEditActive Text for inactive button.
   * @param {string} params.a11y.buttonEditInactive Text for inactive button.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onbuttonEdit] Handles click.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      title: '',
      a11y: {
      }
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClickButtonFullScreen = this.callbacks.onClickButtonFullScreen || (() => {});
    this.callbacks.onClickButtonQuit = this.callbacks.onClickButtonQuit || (() => {});
    this.callbacks.onClickButtonSwitchView = this.callbacks.onClickButtonSwitchView || (() => {});

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-ar-scavenger-title-bar');

    this.buttons = {};

    this.buttons['switchView'] = new ARScavengerButton(
      {
        a11y: {
          inactive: this.params.a11y.buttonSwitchViewAction,
          active: this.params.a11y.buttonSwitchViewCamera,
          disabled: this.params.a11y.buttonSwitchViewDisabled,
        },
        classes: [
          'h5p-ar-scavenger-button',
          'h5p-ar-scavenger-button-switch-view'
        ],
        type: 'toggle'
      },
      {
        onClick: this.callbacks.onClickButtonSwitchView
      }
    );
    this.titleBar.appendChild(this.buttons['switchView'].getDOM());

    if (this.params.buttonQuit) {
      this.buttons['quit'] = new ARScavengerButton(
        {
          a11y: {
            active: this.params.a11y.buttonQuit,
            disabled: this.params.a11y.buttonQuitDisabled,
          },
          classes: [
            'h5p-ar-scavenger-button',
            'h5p-ar-scavenger-button-quit'
          ],
          disabled: true,
          type: 'pulse'
        },
        {
          onClick: this.callbacks.onClickButtonQuit
        }
      );
      this.titleBar.appendChild(this.buttons['quit'].getDOM());
    }

    // Title
    const titleDOM = document.createElement('div');
    titleDOM.classList.add('h5p-ar-scavenger-title');
    titleDOM.innerHTML = this.params.title;

    this.titleBar.appendChild(titleDOM);

    if (this.params.canHasFullScreen) {
      this.buttons['fullscreen'] = new ARScavengerButton(
        {
          a11y: {
            active: this.params.a11y.buttonFullScreenExit,
            inactive: this.params.a11y.buttonFullScreenEnter
          },
          classes: [
            'h5p-ar-scavenger-button',
            'h5p-ar-scavenger-button-fullscreen'
          ],
          disabled: false,
          type: 'toggle'
        },
        {
          onClick: callbacks.onClickButtonFullScreen
        }
      );
      this.titleBar.appendChild(this.buttons['fullscreen'].getDOM());
    }
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Toggle button acrive state.
   * @param {string} buttonId Button id.
   * @param {boolean} state Desired state.
   */
  toggleButtonActive(buttonId, state) {
    if (!this.buttons[buttonId]) {
      return;
    }

    // Toggle current state
    if (typeof state !== 'boolean') {
      state = !this.buttons[buttonId].isActive();
    }

    if (state === true) {
      this.buttons[buttonId].activate();
    }
    else {
      this.buttons[buttonId].deactivate();
    }
  }

  /**
   * Toggle button disabled state.
   * @param {string} buttonId Button id.
   * @param {boolean} state Desired state.
   */
  toggleButtonDisabled(buttonId, state) {
    if (!this.buttons[buttonId]) {
      return;
    }

    if (state === true || !this.buttons[buttonId].isDisabled()) {
      this.buttons[buttonId].disable();
    }
    else {
      this.buttons[buttonId].enable();
    }
  }

  /**
   * Determine whether a button is active.
   * @param {string} buttonId Button id.
   * @return {boolean|null} Button active state or null if buttonId not found.
   */
  isButtonActive(buttonId) {
    if (!this.buttons[buttonId]) {
      return null;
    }
    else {
      return this.buttons[buttonId].isActive();
    }
  }

  /**
   * Determine whether a button is disabled.
   * @param {string} buttonId Button id.
   * @return {boolean|null} Button disabled state or null if buttonId not found.
   */
  isButtonDisabled(buttonId) {
    if (!this.buttons[buttonId]) {
      return null;
    }
    else {
      return this.buttons[buttonId].isDisabled();
    }
  }
}
