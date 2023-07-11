// Import required classes
import './h5p-ar-scavenger-content.scss';
import Util from './h5p-ar-scavenger-util';
import ContentSetup from './h5p-ar-scavenger-content-setup.js';
import ContentHandlers from './h5p-ar-scavenger-content-handlers.js';

/** Class representing the content */
export default class ARScavengerContent {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {number} contentId Content ID.
   * @param {object} [extras] Extras incl. previous state.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, contentId, extras, callbacks) {
    Util.addMixins(ARScavengerContent, [ContentSetup, ContentHandlers]);

    this.params = params;
    this.contentId = contentId;
    this.extras = extras || {};
    this.extras.previousState = this.extras.previousState || [];

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onFullScreen = this.callbacks.onFullScreen || (() => {});
    this.callbacks.onQuit = this.callbacks.onQuit || (() => null);
    this.callbacks.onRead = this.callbacks.onRead || (() => {});
    this.callbacks.onResize = this.callbacks.onResize || (() => {});

    this.isCameraMode = true;

    // Initialize instances
    this.instancesInitialized = 0;
    this.instances = [];
    this.instanceDOMs = [];
    this.instancesH5P = 0;
    this.tasksH5P = 0;

    this.markersFound = new Array(this.params.markers.length);

    // Screen content (container)
    this.container = document.createElement('div');
    this.container.classList.add('h5p-ar-scavenger-screen-content');

    // Screen: Title
    if (this.params.showTitleScreen) {
      this.screenTitle = this.buildTitleScreen();
      this.container.appendChild(this.screenTitle.getDOM());
    }

    // Screen: Content
    this.screenContent = document.createElement('div');
    this.screenContent.classList.add('h5p-ar-scavenger-content-container');
    this.container.appendChild(this.screenContent);

    this.messages = document.createElement('div');
    this.messages.classList.add('h5p-ar-scavenger-content-message');

    this.messages.innerText = Util.htmlDecode(this.params.l10n.initializingContent);
    this.screenContent.appendChild(this.messages);

    let errorMessages = [];

    // No markers set?
    if (params.markers.length === 0) {
      errorMessages.push(this.params.l10n.errorNoMarkers);
    }

    // IE11
    if (window.navigator.userAgent.indexOf('Trident/') !== -1) {
      errorMessages.push(this.params.l10n.errorBrowserNotSupported);
    }

    // Brave
    if (window.Brave) {
      errorMessages.push(this.params.l10n.warningBrave);
    }

    // Check camera access.
    if (!window.navigator.mediaDevices || !window.navigator.mediaDevices.getUserMedia) {
      errorMessages.push(this.params.l10n.errorNoCameraSupport);
    }

    if (errorMessages.length !== 0) {
      this.handleInitializationFailed(errorMessages);
      return;
    }

    // Camera access
    window.navigator.mediaDevices.getUserMedia({
      video: { // Potentially 4K
        width: 4096,
        height: 2160
      }
    }).then((stream) => {
      // Free stream, otherwise some devices fail as camera seems to be in use
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      this.handleInitializationSucceeded();
    }).catch((error) => {
      const message = `${this.params.l10n.errorNoCameraAccess} ${error.message}`;
      console.warn(message);
      this.handleInitializationFailed([message]);
    });

    this.handleTitleScreenClosed();
  }

  /**
   * Instantiate H5P content.
   * @param {number} id Id of instance dummy to be instantiated.
   */
  instantiateContent(id) {
    if (!this.instances[id].uninstantiated) {
      return; // Already instantiated
    }

    const params = this.instances[id].uninstantiated;
    const index = params.index;
    const machineName = params.machineName;

    // Override instance settings for "Show solution button"
    if (this.params.behaviour.overrideShowSolutionButton === 'always') {
      params.interaction.params.behaviour.enableSolutionsButton = true;
    }
    else if (this.params.behaviour.overrideShowSolutionButton === 'never') {
      params.interaction.params.behaviour.enableSolutionsButton = false;
    }

    // Override instance settings for "Retry button"
    if (this.params.behaviour.overrideRetryButton === 'always') {
      params.interaction.params.behaviour.enableRetry = true;
    }
    else if (this.params.behaviour.overrideRetryButton === 'never') {
      params.interaction.params.behaviour.enableRetry = false;
    }

    this.instances[id] = H5P.newRunnable(
      params.interaction,
      params.contentId,
      H5P.jQuery(params.actionWrapper),
      true,
      { previousState: params.previousState }
    );

    this.instances[id].on('resize', () => {
      this.resize({ fromAction: true });
    });

    if (Util.isTask(this.instances[id], machineName)) {
      this.tasksH5P++;

      // Listen for instance completion
      this.instances[id].on('xAPI', (event) => {
        if (event.getVerb() !== 'answered' && event.getVerb() !== 'completed') {
          return; // not relevant
        }

        // Run this after the current event has been sent
        setTimeout(() => {
          this.handleMarkerGotCompleted(index);
        }, 0);
      });
    }
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.container;
  }

  /**
   * Show content.
   */
  show() {
    this.screenContent.classList.remove('h5p-ar-scavenger-display-none');
    this.isShown = true;
  }

  /**
   * Hide content.
   */
  hide() {
    this.screenContent.classList.add('h5p-ar-scavenger-display-none');
    this.isShown = false;
  }

  /**
   * Resize content.
   * @param {object} params Parameters.
   */
  resize(params) {
    if (!this.camera) {
      // Possibly no markers or not initialized correctly
      this.callbacks.onResize();
      return;
    }

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

      // FullScreen button cannot know about exiting full screen with escape key
      this.titlebar.toggleButtonActive('fullscreen', false);
    }
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
   * @returns {boolean} True, if answer was given.
   */
  getAnswerGiven() {
    return this.instances.some(((instance) => (instance && typeof instance.getAnswerGiven === 'function' && instance.getAnswerGiven())));
  }

  /**
   * Get latest score.
   * @returns {number} latest score.
   */
  getScore() {
    return this.instances.reduce((score, instance) => {
      return score + ((instance && typeof instance.getScore === 'function') ? instance.getScore() : 0);
    }, 0);
  }

  /**
   * Get maximum possible score
   * @returns {number} Score necessary for mastering.
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
    for (let i = 0; i < this.markersFound.length; i++) {
      if (this.markersFound[i]) {
        this.markersFound[i].completed = false;
      }
    }

    this.titlebar.toggleButtonActive('switchView', false);
    this.titlebar.toggleButtonActive('quit', false);
    this.titlebar.toggleButtonDisabled('quit', true);

    if (!this.isCameraMode) {
      this.toggleView();
    }

    this.instances.forEach((instance) => {
      if (instance && typeof instance.resetTask === 'function') {
        instance.resetTask();
      }
    });

    this.action.hideContent();
  }

  /**
   * Get xAPI data from all exercise instances.
   * @returns {object[]} XAPI data of all exercise instances.
   */
  getXAPIDataFromChildren() {
    return this.instances
      .map((child)  => {
        if (child && typeof child.getXAPIData === 'function') {
          return child.getXAPIData();
        }
      })
      .filter((data) => !!data);
  }

  /**
   * Get current state to be saved.
   * @returns {object} CurrentState.
   */
  getCurrentState() {
    return this.instances.map((instance) => {
      if (!instance || typeof instance.getCurrentState !== 'function') {
        return {};
      }

      return instance.getCurrentState();
    });
  }
}
