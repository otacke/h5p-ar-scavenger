import ARScavengerContentAction from './components/h5p-ar-scavenger-content-action';
import ARScavengerContentCamera from './components/h5p-ar-scavenger-content-camera';
import ARScavengerContentTitlebar from './components/h5p-ar-scavenger-content-titlebar';
import ARScavengerScreenEnd from './components/h5p-ar-scavenger-screen-end';
import ARScavengerScreenStart from './components/h5p-ar-scavenger-screen-start';
import Util from './h5p-ar-scavenger-util';

export default class ContentSetup {
  constructor() {}

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
        onClickButtonSwitchView: () => this.handleSwitchView()
      }
    );
  }

  /**
   * Build title screen
   */
  buildTitleScreen() {
    return new ARScavengerScreenStart(
      {
        id: 'title',
        screenImage: this.params.titleScreen.titleScreenImage,
        screenText: this.params.titleScreen.titleScreenIntroduction,
        l10n: { 'buttonText': this.params.l10n.start }
      },
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
    return new ARScavengerScreenEnd(
      {
        id: 'end',
        screenImage: this.params.endScreen.endScreenImage,
        screenText: this.params.endScreen.endScreenOutro,
        l10n: { 'buttonText': this.params.l10n.retry }
      },
      {
        onClose: () => {
          this.handleRetry();
        }
      },
      this.contentId);
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
    if (this.params.showTitleScreen) {
      this.hide();
      this.screenTitle.show();
    }
    this.screenContent.removeChild(this.messages);

    // Titlebar
    this.titlebar = this.buildTitleBar();

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
          this.resize({ fromSubject: true });
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
    if (this.params.showEndScreen) {
      this.screenEnd = this.buildEndScreen();
      this.container.appendChild(this.screenEnd.getDOM());
    }

    this.instantiateMarkers();

    // Instantiate contents
    this.instances.forEach((instance, index) => {
      if (!instance) {
        return;
      }

      this.instantiateContent(index);
    });

    // Will be displayed when necessary
    if (this.params.showEndScreen && this.getMaxScore() > 0) {
      this.titlebar.showButton('quit');
    }
    else {
      this.titlebar.hideButton('quit');
    }

    // No view switcher required
    if (this.instancesH5P === 0) {
      this.titlebar.hideButton('switchView');
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

        // Was supposed to be instantiated once a marker is found only
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
}
