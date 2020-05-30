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
    this.isCameraMode = !this.params.behaviour.showActionOnStartup;

    // Content
    this.container = document.createElement('div');
    this.container.classList.add('h5p-ar-scavenger-container');

    // Titlebar
    this.titlebar = this.createTitleBar();
    this.container.appendChild(this.titlebar.getDOM());

    // TODO: params.markers.length === 0

    // Subject
    this.camera = this.createCamera(
      {
        contentId: this.contentId,
        markers: this.params.markers,
        fallbackHeight: this.params.behaviour.fallbackHeight
      },
      {
        onResize: () => {
          this.resize({fromSubject: true});
        },
        onMarkerFound: (event) => {
          this.handleMarkerFound(event);
        },
        onMarkerLost: (event) => {
          this.handleMarkerLost(event);
        }
      },
      this.isCameraMode
    );

    // Action
    this.action = this.createAction(
      {
        markersLength: this.params.markers.length,
        contentId: this.params.contentId,
        previousState: this.previousState,
      },
      {
        onInstanceReady: (instance) => {
          this.handleInstanceReady(instance);
        }
      },
      this.isCameraMode
    );

    // Panel
    const panel = document.createElement('div');
    panel.classList.add('h5p-ar-scavenger-panel');
    panel.appendChild(this.camera.getDOM());
    panel.appendChild(this.action.getDOM());

    this.container.appendChild(panel);
  }

  /**
   * Handle marker found.
   */
  handleMarkerFound(event) {
    if (!this.isCameraMode && this.isNarrowScreen) {
      return; // Not using camera
    }

    const markerId = parseInt(event.target.id);
    const marker = this.params.markers[markerId];

    if (marker.actionType === 'h5p') {
      this.action.loadContent(markerId, marker.interaction.interaction, this.contentId);
      this.action.showContent();
      this.action.show();

      console.log(this.isCameraMode, this.isNarrowScreen);

      if (this.isCameraMode) {
        this.toggleView();
      }
    }
  }

  /**
   * Handle marker lost.
   */
  handleMarkerLost(event) {
    return event; // Dummy
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
   * @param {boolean} isCameraMode Switch for action mode.
   */
  createCamera(params = {}, callbacks = {}, isCameraMode = true) {
    const camera = new ARScavengerContentCamera(params, callbacks);
    const subjectContainer = camera.getDOM();

    if (!isCameraMode) {
      subjectContainer.classList.add('h5p-ar-scavenger-action-mode');
    }

    // If action is opened and display is too narrow, undisplay subject
    subjectContainer.addEventListener('transitionend', () => {
      if (!isCameraMode) {
        if (subjectContainer.offsetWidth === 0) {
          subjectContainer.classList.add('h5p-ar-scavenger-display-none');
        }
        setTimeout(() => {
          this.resize();
        }, 0);
      }
    });

    return camera;
  }

  /**
   * Create the action DOM.
   * @param {object} params Paremeters for Subject.
   * @param {boolean} isCameraMode Switch for action mode.
   */
  createAction(params = {}, callbacks = {}, isCameraMode = true) {
    const action = new ARScavengerContentAction(params, this.contentId, callbacks);
    const actionContainer = action.getDOM();

    if (!isCameraMode) {
      actionContainer.classList.add('h5p-ar-scavenger-action-mode');
    }
    else {
      actionContainer.classList.add('h5p-ar-scavenger-display-none');
    }

    // Hide wrapper after it has been moved out of sight to prevent receiving tab focus
    actionContainer.addEventListener('transitionend', () => {
      if (this.isCameraMode) {
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
        this.camera.setNarrowView(true);
      }
    }
    else {
      this.camera.show();
      setTimeout(() => {
        this.camera.setNarrowView(false);
      }, 0);

      if (this.isNarrowScreen) {
        this.isNarrowScreen = false;
      }
    }

    if (!params || params.fromSubject !== true) {
      this.camera.resize();
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
        this.camera.resizeIframeHeight(maxHeight);
        this.action.resizeIframeHeight(maxHeight);
      }, 100);
    }
    else {
      // Give browser some time to exit from fullscreen mode
      setTimeout(() => {
        this.camera.resizeIframeHeight(null);
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
    this.camera.show();
    this.action.show();

    // Give DOM time to set display property
    setTimeout(() => {
      this.camera.toggleView();
      this.action.toggleView();

      this.isCameraMode = !this.isCameraMode;

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
