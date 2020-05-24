// Import required classes
import ARScavengerContentTitlebar from './h5p-ar-scavenger-content-titlebar';
import ARScavengerContentCamera from './h5p-ar-scavenger-content-camera';
import ARScavengerContentAction from './h5p-ar-scavenger-content-action';

/** Class representing the content */
export default class ARScavengerContent {
  /**
   * @constructor
   *
   * @param {object} params Parameters.
   * @param {number} contentId Content ID.
   * @param {object} [extras] Extras incl. previous state.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, contentId, extras, callbacks) {
    this.params = params;
    this.contentId = contentId;
    this.extras = extras;

    // Previous state
    this.previousState = extras.previousState || {};

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onRead = this.callbacks.onRead || (() => {});
    this.callbacks.onResize = this.callbacks.onResize || (() => {});

    // Action mode = action page active
    this.isActionMode = !this.params.behaviour.showActionOnStartup;

    // Content
    this.container = document.createElement('div');
    this.container.classList.add('h5p-ar-scavenger-container');

    // Titlebar
    this.titlebar = this.createTitleBar();
    this.container.appendChild(this.titlebar.getDOM());

    // Subject
    this.subject = this.createSubject(
      {
        website: this.params.website,
        fallbackHeight: this.params.behaviour.fallbackHeight
      },
      {
        onResize: () => {
          this.resize({fromSubject: true});
        },
        onMarkerFound: () => {
          if (this.found) {
            return;
          }

          this.found = true;
          this.action.showContent();
          this.action.show();

          if (this.isActionMode) {
            this.toggleView();
          }
        },
        onMarkerLost: () => {
          // this.action.hideContent();
        }
      },
      this.isActionMode
    );

    // Action
    this.action = this.createAction(
      {
        action: this.params.action,
        contentId: this.params.contentId,
        previousState: this.previousState,
      },
      {
        onInstanceReady: (instance) => {
          this.handleInstanceReady(instance);
        }
      },
      this.isActionMode
    );

    // Panel
    const panel = document.createElement('div');
    panel.classList.add('h5p-ar-scavenger-panel');
    panel.appendChild(this.subject.getDOM());
    panel.appendChild(this.action.getDOM());

    this.container.appendChild(panel);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.container;
  }

  /**
   * Create titlebar.
   * @return {ARScavengerContentTitlebar} Titlebar.
   */
  createTitleBar() {
    return new ARScavengerContentTitlebar(
      {
        title: this.extras.metadata.title,
        toggleButtonActiveOnStartup: this.params.behaviour.showActionOnStartup,
        a11y: {
          buttonToggleActive: this.params.a11y.buttonToggleCloseAction,
          buttonToggleInactive: this.params.a11y.buttonToggleOpenAction
        }
      },
      {
        onButtonToggle: (event) => this.handlebuttonToggle(event)
      }
    );
  }

  /**
   * Create subject DOM.
   * @param {object} params Parameters for Subject.
   * @param {object} callbacks Callbacks.
   * @param {boolean} isActionMode Switch for action mode.
   */
  createSubject(params = {}, callbacks = {}, isActionMode = true) {
    const subject = new ARScavengerContentCamera(params, callbacks);
    const subjectContainer = subject.getDOM();

    if (!isActionMode) {
      subjectContainer.classList.add('h5p-ar-scavenger-action-mode');
    }

    // If action is opened and display is too narrow, undisplay subject
    subjectContainer.addEventListener('transitionend', () => {
      if (!isActionMode) {
        if (subjectContainer.offsetWidth === 0) {
          subjectContainer.classList.add('h5p-ar-scavenger-display-none');
        }
        setTimeout(() => {
          this.resize();
        }, 0);
      }
    });

    return subject;
  }

  /**
   * Create the action DOM.
   * @param {object} params Paremeters for Subject.
   * @param {boolean} isActionMode Switch for action mode.
   */
  createAction(params = {}, callbacks = {}, isActionMode = true) {
    const action = new ARScavengerContentAction(params, this.contentId, callbacks);
    const actionContainer = action.getDOM();

    if (!isActionMode) {
      actionContainer.classList.add('h5p-ar-scavenger-action-mode');
    }
    else {
      actionContainer.classList.add('h5p-ar-scavenger-display-none');
    }

    // Hide wrapper after it has been moved out of sight to prevent receiving tab focus
    actionContainer.addEventListener('transitionend', () => {
      if (this.isActionMode) {
        actionContainer.classList.add('h5p-ar-scavenger-display-none');
      }
      setTimeout(() => {
        this.resize();
      }, 0);
    });

    return action;
  }

  /**
   * Resize content.
   */
  resize(params) {
    // Not done using media query because display needs to be not-none first
    if (this.container.offsetWidth < this.params.minWidthForDualView) {
      // Only want to trigger toggleMedium once when mode actually changes
      if (!this.isNarrowScreen) {
        this.isNarrowScreen = true;

        // Triggers a transition, display set to none afterwards by listener
        this.subject.setNarrowView(true);
      }
    }
    else {
      this.subject.show();
      setTimeout(() => {
        this.subject.setNarrowView(false);
      }, 0);

      if (this.isNarrowScreen) {
        this.isNarrowScreen = false;
      }
    }

    if (!params || params.fromSubject !== true) {
      this.subject.resize();
    }

    this.callbacks.onResize();
  }

  /**
   * Set dimensions to fullscreen.
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  setFullScreen(enterFullScreen = false) {
    if (enterFullScreen === true) {
      // Give browser some time to go to fullscreen mode and return proper viewport height
      setTimeout(() => {
        const maxHeight = window.innerHeight - this.titlebar.getDOM().offsetHeight;
        this.subject.resizeIframeHeight(maxHeight);
        this.action.resizeIframeHeight(maxHeight);
      }, 100);
    }
    else {
      // Give browser some time to exit from fullscreen mode
      setTimeout(() => {
        this.subject.resizeIframeHeight(null);
        this.action.resizeIframeHeight(null);
      }, 100);
    }
  }

  /**
   * Handle activation of overlay button.
   * @param {object} event Event that is calling.
   */
  handlebuttonToggle(event) {
    if (event && event.type === 'keypress' && event.keyCode !== 13 && event.keyCode !== 32) {
      return;
    }

    const active = this.titlebar.toggleOverlayButton();

    const message = (active) ?
      this.params.a11y.actionOpened :
      this.params.a11y.actionClosed;
    this.callbacks.onRead(message);

    this.toggleView();
  }

  /**
   * Toggle between subject and action.
   */
  toggleView() {
    // Show hidden containers to allow transition
    this.subject.show();
    this.action.show();

    // Give DOM time to set display property
    setTimeout(() => {
      this.subject.toggleView();
      this.action.toggleView();

      this.isActionMode = !this.isActionMode;

      this.resize();
    }, 0);
  }

  /**
   * Handle instance ready callback.
   * @param {object} instance H5P content type instance.
   */
  handleInstanceReady(instance) {
    if (!instance || typeof instance !== 'object') {
      return;
    }

    this.instanceAction = instance;
  }

  /**
   * Get action instance.
   * @return {object} H5P content type instance.
   */
  getInstanceAction() {
    return this.instanceAction;
  }

  /**
   * Check if result has been submitted or input has been given.
   * @return {boolean} True, if answer was given.
   */
  getAnswerGiven() {
    const instance = this.getInstanceAction();
    return (instance && instance.getAnswerGiven) ? instance.getAnswerGiven() : false;
  }

  /**
   * Get latest score.
   * @return {number} latest score.
   */
  getScore() {
    const instance = this.getInstanceAction();
    return (instance && instance.getScore) ? instance.getScore() : 0;
  }
  /**
   * Get maximum possible score
   * @return {number} Score necessary for mastering.
   */
  getMaxScore() {
    const instance = this.getInstanceAction();
    return (instance && instance.getMaxScore) ? instance.getMaxScore() : 0;
  }

  /**
   * Show solutions.
   */
  showSolutions() {
    const instance = this.getInstanceAction();
    if (instance && instance.showSolutions) {
      instance.showSolutions();
    }
  }

  /**
   * Reset task.
   */
  reset() {
    const instance = this.getInstanceAction();
    if (instance && instance.resetTask) {
      instance.resetTask();
    }
  }

  /**
   * Get current state to be saved.
   * @return {object} CurrentState.
   */
  getCurrentState() {
    const instance = this.getInstanceAction();
    return (!instance || !instance.getCurrentState) ? undefined : instance.getCurrentState();
  }
}
