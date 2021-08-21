// Import required classes
import ARScavengerContentTitlebar from './h5p-ar-scavenger-content-titlebar';
import ARScavengerContentCamera from './h5p-ar-scavenger-content-camera';
import ARScavengerContentAction from './h5p-ar-scavenger-content-action';
import ARScavengerScreenEnd from './h5p-ar-scavenger-screen-end';
import ARScavengerScreenStart from './h5p-ar-scavenger-screen-start';
import Util from './h5p-ar-scavenger-util';

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
    if (this.params.titleScreen.showTitleScreen) {
      this.screenTitle = this.buildTitleScreen();
      this.container.appendChild(this.screenTitle.getDOM());
    }

    // Screen: Content
    this.screenContent = document.createElement('div');
    this.screenContent.classList.add('h5p-ar-scavenger-content-container');
    if (this.params.titleScreen.showTitleScreen) {
      this.hide();
    }
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
    window.navigator.mediaDevices.getUserMedia({video: {width: 4096, height: 2160}})
      .then((stream) => {
        // Free stream, otherwise some devices fail as camera seems to be in use
        stream.getTracks().forEach((track) => {
          track.stop();
        });

        this.handleInitializationSucceeded();
      })
      .catch((error) => {
        const message = `${this.params.l10n.errorNoCameraAccess} ${error.message}`;
        console.warn(message);
        this.handleInitializationFailed([message]);
      });
  }

  /**
   * Handle failing of initialization.
   * @param {string[]} errorMessages Error messages to display.
   */
  handleInitializationFailed(errorMessages = []) {
    this.messages.innerHTML = '';
    this.messages.classList.add('h5p-ar-scavenger-content-message-error');

    errorMessages.forEach((message) => {
      const entry = document.createElement('p');
      entry.innerText = Util.htmlDecode(message);
      this.messages.appendChild(entry);
    });
  }

  /**
   * Handle initialization if camera is accessible.
   */
  handleInitializationSucceeded() {
    this.screenContent.removeChild(this.messages);

    // Titlebar
    this.titlebar = this.buildTitleBar();
    if (!this.params.endScreen.showEndScreen) {
      this.titlebar.hideButton('quit');
    }

    this.screenContent.appendChild(this.titlebar.getDOM());

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
    this.action = this.buildAction({
      l10n: {
        nothingToSee: this.params.l10n.nothingToSee
      }
    }, {});

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

    this.instantiateMarkers();

    // Will be displayed when necessary
    this.titlebar.hideButton('quit');

    // No view switcher required
    if (this.instancesH5P === 0) {
      this.titlebar.hideButton('switchView');
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

      this.instantiateContent(markerId);

      this.currentInstanceId = markerId;
      this.action.attachInstance(this.instanceDOMs[markerId], markerId);
      this.action.showContent();
      this.action.show();
      this.titlebar.toggleButtonActive('switchView', true);

      if (this.isCameraMode) {
        this.toggleView();
      }
    }
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

    this.instances[id] = H5P.newRunnable(
      params.interaction,
      params.contentId,
      H5P.jQuery(params.actionWrapper),
      true,
      {previousState: params.previousState}
    );

    this.instances[id].on('resize', () => {
      this.resize({fromAction: true});
    });

    if (this.isTask(this.instances[id], machineName)) {
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
   * Instantiate all markers.
   */
  instantiateMarkers() {
    this.params.markers.forEach((marker, index) => {
      // Sanitization
      this.markersFound[index] = this.markersFound[index] || {
        actionType: marker.actionType,
        completed: false
      };

      if (marker.actionType !== 'h5p') {
        this.instances.push(null);
        this.instanceDOMs.push(null);
        return;
      }

      const interaction = marker.interaction.interaction;

      let actionMachineName;
      // Create new instance replacing action wrapper DOM
      if (interaction.library) {
        actionMachineName = interaction.library.split(' ')[0];
      }

      // Create instance
      if (actionMachineName !== undefined && this.contentId) {
        const actionWrapper = document.createElement('div');
        actionWrapper.classList.add('h5p-ar-scavenger-content-action-library-wrapper');

        const previousState = this.extras.previousState[index] !== null ?
          this.extras.previousState[index] :
          undefined;

        // Will be instantiated once a marker is found
        const instanceDummy = {
          uninstantiated: {
            interaction: interaction,
            contentId: this.contentId,
            actionWrapper: actionWrapper,
            previousState: previousState,
            index: index,
            machineName: actionMachineName
          },
          on: () => {},
          trigger: () => {}
        };

        this.instancesH5P++;

        this.instances.push(instanceDummy);
        this.instanceDOMs.push(actionWrapper);
      }
      else {
        this.instances.push(null);
        this.instanceDOMs.push(null);
      }
    });
  }

  /**
   * Handle marker got completed.
   * @param {number} id Marker's id.
   */
  handleMarkerGotCompleted(id) {
    this.markersFound[id].completed = true;

    const markersCompleted = this.markersFound.reduce((sum, marker) => {
      return sum + ((marker && marker.completed) ? 1 : 0);
    }, 0);

    // All tasks completed
    if (markersCompleted === this.tasksH5P) {
      this.handleCompleted();
    }
  }

  /**
   * Handle marker lost.
   */
  handleMarkerLost(event) {
    return event; // Dummy
  }

  /**
   * Check whether an H5P instance is a task.
   * @param {H5P.ContentType} instance H5P instance.
   * @param {string} machineName H5P MachineName.
   */
  isTask(instance, machineName) {
    // Course Presentations loads subcontent dynamically, can't trust getMaxScore
    if (machineName === 'H5P.CoursePresentation') {
      return instance.isTask;
    }

    return (instance.getMaxScore && instance.getMaxScore() > 0);
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
        a11y: {
          buttonFullScreenEnter: this.params.a11y.buttonFullScreenEnter,
          buttonFullScreenExit: this.params.a11y.buttonFullScreenExit,
          buttonSwitchViewAction: this.params.a11y.buttonSwitchViewAction,
          buttonSwitchViewCamera: this.params.a11y.buttonSwitchViewCamera,
          buttonSwitchViewDisabled: this.params.a11y.buttonSwitchViewDisabled,
          buttonQuit: this.params.a11y.buttonQuit,
          buttonQuitDisabled: this.params.a11y.buttonQuitDisabled,
        },
        canHasFullScreen: this.params.canHasFullScreen
      },
      {
        onClickButtonFullScreen: (event) => this.callbacks.onFullScreen(event),
        onClickButtonQuit: (event) => this.handleQuit(event),
        onClickButtonSwitchView: (event) => this.handleSwitchView(event)
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

    return new ARScavengerScreenStart(
      params,
      {
        onClose: () => {
          this.handleTitleScreenClosed();
        }
      },
      this.contentId);
  }

  /**
   * Build title screen
   */
  buildEndScreen() {
    const params = this.params.endScreen;
    params.l10n = {
      'retry': this.params.l10n.retry
    };

    return new ARScavengerScreenEnd(
      params,
      {
        onRetry: () => {
          this.handleRetry();
        }
      },
      this.contentId);
  }

  /**
   * Show content.
   */
  show() {
    this.screenContent.classList.remove('h5p-ar-scavenger-display-none');
  }

  /**
   * Hide content.
   */
  hide() {
    this.screenContent.classList.add('h5p-ar-scavenger-display-none');
  }

  /**
   * Handle title screen closed.
   */
  handleTitleScreenClosed() {
    this.screenTitle.hide();
    this.show();

    setTimeout(() => {
      this.callbacks.onResize();
    }, 0);
  }

  /**
   * Handle completed.
   */
  handleCompleted() {
    this.titlebar.showButton('quit');
    this.titlebar.toggleButtonDisabled('quit', false);
  }

  /**
   * Handle quit.
   */
  handleQuit() {
    if (this.params.endScreen.showEndScreen) {
      const score = this.getScore();
      const maxScore = this.getMaxScore();

      const scoreText = H5P.Question
        .determineOverallFeedback(this.params.endScreen.overallFeedback, score / maxScore)
        .replace('@score', score)
        .replace('@total', maxScore);

      this.screenEnd.setScoreText(scoreText);
      this.screenEnd.setMaxScore(this.getMaxScore());

      this.hide();
      this.screenEnd.show();

      setTimeout(() => {
        // Put this here to allow animation to be visible
        this.screenEnd.setScore(this.getScore());

        this.callbacks.onResize();
      }, 0);
    }

    this.callbacks.onQuit();
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
      this.show();
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
      }

      setTimeout(() => {
        if (this.instances[this.currentInstanceId]) {
          this.instances[this.currentInstanceId].trigger('resize');
        }
        this.resize();
      }, 100);
    });

    return camera;
  }

  /**
   * Create the action DOM.
   * @param {object} params Paremeters for Subject.
   */
  buildAction(params = {}, callbacks = {}) {
    const action = new ARScavengerContentAction(params, callbacks);
    action.hide();

    // Hide wrapper after it has been moved out of sight to prevent receiving tab focus
    action.getDOM().addEventListener('transitionend', () => {
      if (this.isCameraMode) {
        action.hide();
      }

      setTimeout(() => {
        if (this.instances[this.currentInstanceId]) {
          this.instances[this.currentInstanceId].trigger('resize');
        }
        this.resize();
      }, 0);
    });

    return action;
  }

  /**
   * Resize content.
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
   * Handle activation of overlay button.
   * @param {object} event Event that is calling.
   */
  handleSwitchView(event) {
    if (event && event.type === 'keypress' && event.keyCode !== 13 && event.keyCode !== 32) {
      return;
    }

    const active = !this.titlebar.isButtonActive('switchView');

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
  }

  /**
   * Get xAPI data from all exercise instances.
   * @return {object[]} XAPI data of all exercise instances.
   */
  getXAPIDataFromChildren() {
    return this.instances
      .map(child  => {
        if (child && typeof child.getXAPIData === 'function') {
          return child.getXAPIData();
        }
      })
      .filter(data => !!data);
  }

  /**
   * Get current state to be saved.
   * @return {object} CurrentState.
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
