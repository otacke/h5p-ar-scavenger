// Import required classes
import ARScavengerContentTitlebar from './h5p-ar-scavenger-content-titlebar';
import ARScavengerContentCamera from './h5p-ar-scavenger-content-camera';
import ARScavengerContentAction from './h5p-ar-scavenger-content-action';
import ARScavengerScreenEnd from './h5p-ar-scavenger-screen-end';
import ARScavengerScreenTitle from './h5p-ar-scavenger-screen-title';

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
    this.callbacks.onRead = this.callbacks.onCompleted || (() => null);
    this.callbacks.onRead = this.callbacks.onRead || (() => {});
    this.callbacks.onResize = this.callbacks.onResize || (() => {});

    this.isCameraMode = true;

    // Initialize instances
    this.instancesInitialized = 0;
    this.instances = [];
    this.instanceDOMs = [];

    // Initialize instances
    this.params.markers.forEach((marker) => {
      if (marker.actionType !== 'h5p') {
        this.instances.push(null);
        this.instanceDOMs.push(null);
        this.handleInstanceInitialized();
        return;
      }

      const interaction = marker.interaction.interaction;

      // Create new instance replacing action wrapper DOM
      if (interaction.library) {
        this.actionMachineName = interaction.library.split(' ')[0];
      }

      // Create instance or failure message
      if (this.actionMachineName !== undefined && contentId) {
        const actionWrapper = document.createElement('div');
        actionWrapper.classList.add('h5p-ar-scavenger-content-action-library-wrapper');

        const instance = H5P.newRunnable(
          interaction,
          contentId,
          H5P.jQuery(actionWrapper),
          true
        );
        H5P.externalDispatcher.once('initialized', () => {
          this.handleInstanceInitialized();
        });
        this.instances.push(instance);
        this.instanceDOMs.push(actionWrapper);
      }
      else {
        this.instances.push(null);
        this.instanceDOMs.push(null);
        this.handleInstanceInitialized();
      }
    });

    // Screen content (container)
    this.container = document.createElement('div');
    this.container.classList.add('h5p-ar-scavenger-screen-content');

    // TODO: For debugging
    window.addEventListener('keydown', (event) => {
      if (event.keyCode === 220) { // <
        this.handleCompleted();
      }
      if (event.keyCode === 49) { // 1
        this.handleMarkerFound({target: {id: 0}});
      }
      if (event.keyCode === 50) { // 2
        this.handleMarkerFound({target: {id: 1}});
      }
      if (event.keyCode === 51) { // 3
        this.handleMarkerFound({target: {id: 2}});
      }
    });

    // Screen: Title
    if (this.params.titleScreen.showTitleScreen) {
      this.screenTitle = this.buildTitleScreen();
      this.container.appendChild(this.screenTitle.getDOM());
    }

    // Screen: Content
    // TODO: Put in separate build function (screenContent as class with show/hide)
    this.screenContent = document.createElement('div');
    this.screenContent.classList.add('h5p-ar-scavenger-content-container');
    this.screenContent.classList.add('h5p-ar-scavenger-display-none');
    this.container.appendChild(this.screenContent);

    // Titlebar
    this.titlebar = this.buildTitleBar();
    this.screenContent.appendChild(this.titlebar.getDOM());

    // TODO: params.markers.length === 0

    // Subject
    this.camera = this.buildCamera(
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
    this.action = this.buildAction(
      {
        markersLength: this.params.markers.length
      }
    );

    // Panel
    const panel = document.createElement('div');
    panel.classList.add('h5p-ar-scavenger-panel');
    panel.appendChild(this.camera.getDOM());
    panel.appendChild(this.action.getDOM());

    this.screenContent.appendChild(panel);

    // Screen: End
    if (this.params.endScreen.showEndScreen) {
      this.screenEnd = this.buildEndScreen();
      this.container.appendChild(this.screenEnd.getDOM());
    }
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
      this.action.attachInstance(this.instanceDOMs[markerId], markerId);
      this.action.showContent();
      this.action.show();

      if (this.isCameraMode) {
        this.toggleView();
      }
    }
  }

  /**
   * Handle instance initalized.
   */
  handleInstanceInitialized() {
    this.instancesInitialized++;
    if (this.instancesInitialized === this.params.markers.length) {
      // TODO: Allow start
      console.log('All instances initalized');
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
  buildTitleBar() {
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
   * Build title screen
   */
  buildTitleScreen() {
    const params = this.params.titleScreen;
    params.l10n = {
      'start': this.params.l10n.start
    };

    const titleScreen = new ARScavengerScreenTitle(
      params,
      {
        onClose: () => {
          this.handleTitleScreenClosed();
        }
      },
      this.contentId);

    return titleScreen;
  }

  /**
   * Build title screen
   */
  buildEndScreen() {
    const params = this.params.endScreen;
    params.l10n = {
      'retry': this.params.l10n.retry
    };

    const endScreen = new ARScavengerScreenEnd(
      params,
      {
        onRetry: () => {
          this.handleRetry();
        }
      },
      this.contentId);

    return endScreen;
  }

  /**
   * Handle title screen closed.
   */
  handleTitleScreenClosed() {
    this.screenTitle.hide();
    this.screenContent.classList.remove('h5p-ar-scavenger-display-none');

    setTimeout(() => {
      this.callbacks.onResize();
    }, 0);
  }

  /**
   * Handle complete.
   */
  handleCompleted() {
    if (this.params.endScreen.showEndScreen) {
      const score = this.getScore();
      const maxScore = this.getMaxScore();

      const scoreText = H5P.Question
        .determineOverallFeedback(this.params.endScreen.overallFeedback, score / maxScore)
        .replace('@score', score)
        .replace('@total', maxScore);

      this.screenEnd.setScoreText(scoreText);
      this.screenEnd.setMaxScore(this.getMaxScore());

      this.screenContent.classList.add('h5p-ar-scavenger-display-none');
      this.screenEnd.show();

      // Put this here to allow animation to be visible
      this.screenEnd.setScore(this.getScore());
    }

    setTimeout(() => {
      this.callbacks.onResize();
    }, 0);
  }

  /**
   * Handle retry.
   */
  handleRetry() {
    // Reset all interactions
    this.reset();

    this.screenEnd.hide();

    if (this.params.titleScreen.showTitleScreen) {
      this.screenTitle.show();
    }
    else {
      this.screenContent.classList.remove('h5p-ar-scavenger-display-none');
    }

    setTimeout(() => {
      this.callbacks.onResize();
    }, 0);
  }

  /**
   * Create subject DOM.
   * @param {object} params Parameters for Subject.
   * @param {object} callbacks Callbacks.
   * @param {boolean} isCameraMode Switch for action mode.
   */
  buildCamera(params = {}, callbacks = {}, isCameraMode = true) {
    const camera = new ARScavengerContentCamera({
      contentId: params.contentId,
      fallbackHeight: params.fallbackHeight,
      markers: params.markers.map(marker => ({
        actionType: marker.actionType,
        markerPattern: marker.markerPattern,
        model: marker.model
      }))
    }, callbacks);
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
  buildAction(params = {}) {
    const action = new ARScavengerContentAction(params);
    action.hide();

    // Hide wrapper after it has been moved out of sight to prevent receiving tab focus
    action.getDOM().addEventListener('transitionend', () => {
      if (this.isCameraMode) {
        action.hide();
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
   * Check if result has been submitted or input has been given.
   * @return {boolean} True, if answer was given.
   */
  getAnswerGiven() {
    return this.instances.some((instance => (instance && typeof instance.getAnswerGiven === 'function' && instance.getAnswerGiven())));
  }

  /**
   * Get latest score.
   * @return {number} latest score.
   */
  getScore() {
    return this.instances.reduce((score, instance) => {
      return score + ((instance && typeof instance.getScore === 'function') ? instance.getScore() : 0);
    }, 0);
  }

  /**
   * Get maximum possible score
   * @return {number} Score necessary for mastering.
   */
  getMaxScore() {
    return this.instances.reduce((maxScore, instance) => {
      return maxScore + ((instance && typeof instance.getMaxScore === 'function') ? instance.getMaxScore() : 0);
    }, 0);
  }

  /**
   * Show solutions.
   */
  showSolutions() {
    this.instances.forEach((instance) => {
      if (instance && typeof instance.showSolutions === 'function') {
        instance.showSolutions();
      }
    });
  }

  /**
   * Reset task.
   */
  reset() {
    this.instances.forEach((instance) => {
      if (instance && typeof instance.resetTask === 'function') {
        instance.resetTask();
      }
    });
  }

  /**
   * Get current state to be saved.
   * @return {object} CurrentState.
   */
  getCurrentState() {
    // TODO
    return {};
  }
}
