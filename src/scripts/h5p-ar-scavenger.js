// Import required classes
import './h5p-ar-scavenger.scss';
import ARScavengerContent from './h5p-ar-scavenger-content';
import Util from './h5p-ar-scavenger-util';

/** Class representing ARScavenger */
export default class ARScavenger extends H5P.Question {
  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('ar-scavenger'); // CSS class selector for content's iframe: h5p-ar-scavenger

    this.contentId = contentId;

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */

    // Sanitize params
    this.params = Util.extend({
      showTitleScreen: false,
      canHasFullScreen: this.isRoot() && H5P.fullscreenSupported === true,
      markers: [],
      showEndScreen: false,
      behaviour: {
        enableSolutionsButton: false,
        enableRetry: false,
        overrideShowSolutionButton: 'useBehavioural',
        overrideRetryButton: 'useBehavioural',
        fallbackHeight: 400
      },
      l10n: {
        start: 'Start',
        retry: 'Retry',
        nothingToSee: 'Find a marker to see an interaction.',
        errorBrowserNotSupported: 'It seems that your browser cannot run this content type, unfortunately.',
        errorNoCameraAccess: 'Could not access camera.',
        errorNoCameraSupport: 'Your browser does not seem to support a camera.',
        errorNoMarkers: 'Did someone forget to add markers?',
        warningBrave: 'You seem to be using the Brave browser. Nice! But its strict privacy settings may prevent the camera from working.',
        initializingContent: 'Initializing content. Please don\'t forget to allow camera access.'
      },
      a11y: {
        buttonFullScreenEnter: 'Enter fullscreen mode',
        buttonFullScreenExit: 'Exit fullscreen mode',
        buttonSwitchViewAction: 'Switch to an exercise',
        buttonSwitchViewCamera: 'Switch to the camera',
        buttonSwitchViewDisabled: 'You cannot switch the view right now',
        buttonQuit: 'Quit exercise',
        buttonQuitDisabled: 'You have not yet completed all exercises',
        actionOpened: 'The view has switched to an exercise.',
        actionClosed: 'The view has switched to the camera.',
      },
      minWidthForDualView: ARScavenger.MIN_WIDTH_FOR_DUALVIEW
    }, params);

    // Filter out incomplete markers
    this.params.markers = this.params.markers.filter((marker) =>
      marker.markerImage && marker.markerPattern &&
        (
          marker.actionType === 'h5p' && marker.interaction && marker.interaction.interaction ||
          marker.actionType === 'model' && marker.model && marker.model.file
        )
    );

    // Sanitize extras
    this.extras = Util.extend({
      metadata: {
        title: 'ARScavenger',
      }
    }, extras);

    const defaultLanguage = extras.metadata.defaultLanguage || 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    if (this.params.canHasFullScreen) {
      this.on('enterFullScreen', () => {
        setTimeout(() => {
          this.content.setFullScreen(true);
          this.isInFullScreen = true;
        }, 250); // Needs time to get into fullscreen for window.innerHeight
      });

      this.on('exitFullScreen', () => {
        this.isInFullScreen = false;
        this.content.setFullScreen(false);
      });
    }

    /**
     * Resize Listener.
     */
    this.on('resize', (event) => {
      // Initial resizing of content after DOM is ready.
      if (event.data && event.data.break === true) {
        return;
      }

      this.content.resize();
    });
  }

  /**
   * Register the DOM elements with H5P.Question
   */
  registerDomElements() {
    // On desktop, action might be wanted to be open on startup
    this.params.behaviour.showActionOnStartup = this.params.behaviour.showActionOnStartup &&
      document.querySelector('.h5p-container').offsetWidth >= ARScavenger.MIN_WIDTH_FOR_DUALVIEW;

    this.content = new ARScavengerContent(this.params, this.contentId, this.extras, {
      onFullScreen: () => {
        this.toggleFullScreen();
      },
      onQuit: () => {
        this.handleCompleted();
      },
      onRead: (text) => {
        this.read(text);
      },
      onResize: () => {
        this.resize();
      }
    });

    // Register content with H5P.Question
    this.setContent(this.content.getDOM());

    // Handle screen orientation change
    if (screen && screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        this.handleScreenOrientationChanged();
      });
    }
    else {
      // Deprecated, but screen.orientation not supported by iOS - surprise!
      window.addEventListener('change', () => {
        this.handleScreenOrientationChanged();
      });
    }
  }

  /**
   * Handle activation of fullscreen button.
   */
  toggleFullScreen() {
    if (!this.params.canHasFullScreen) {
      return;
    }

    if (H5P.isFullscreen === true) {
      H5P.exitFullScreen();
    }
    else {
      H5P.fullScreen(H5P.jQuery(document.querySelector('.h5p-container')), this);
    }
  }

  /**
   * Handle content completed.
   */
  handleCompleted() {
    // Let xAPI event of children trigger first
    setTimeout(() => {
      const xAPIData = this.getXAPIData();
      // interactionType is 'compound' for H5P report, but invalid xAPI spec
      xAPIData.statement.object.definition.interactionType = 'other';
      const xAPIEvent = new H5P.XAPIEvent();
      xAPIEvent.data.children = xAPIData.children;
      xAPIEvent.data.statement = xAPIData.statement;

      this.trigger(xAPIEvent);
    }, 0);
  }

  /**
   * Handle screen orientation changed.
   */
  handleScreenOrientationChanged() {
    if (this.isInFullScreen) {
      this.content.setFullScreen(true);
    }
    else {
      this.resize();
    }
  }

  /**
   * Check if result has been submitted or input has been given.
   * @returns {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  getAnswerGiven() {
    return this.content.getAnswerGiven();
  }

  /**
   * Get latest score.
   * @returns {number} latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return this.content.getScore();
  }

  /**
   * Get maximum possible score
   * @returns {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    return this.content.getMaxScore();
  }

  /**
   * Show solutions.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {
    this.content.showSolutions();
  }

  /**
   * Reset task.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.content.reset();
  }

  /**
   * Resize.
   */
  resize() {
    this.trigger('resize', { break: true });
  }

  /**
   * Get xAPI data.
   * @returns {object} XAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    return {
      children: this.content.getXAPIDataFromChildren(),
      statement: this.getXAPIAnswerEvent().data.statement
    };
  }

  /**
   * Build xAPI answer event.
   * @returns {H5P.XAPIEvent} XAPI answer event.
   */
  getXAPIAnswerEvent() {
    const xAPIEvent = this.createXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this, this.getAnswerGiven(), this.isPassed());

    return xAPIEvent;
  }

  /**
   * Create an xAPI event.
   * @param {string} verb Short id of the verb we want to trigger.
   * @returns {H5P.XAPIEvent} Event template.
   */
  createXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    Util.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());
    return xAPIEvent;
  }

  /**
   * Get the xAPI definition for the xAPI object.
   * @returns {object} XAPI definition.
   */
  getxAPIDefinition() {
    const definition = {};
    definition.name = {};
    definition.name[this.languageTag] = this.getTitle();
    // Fallback for h5p-php-reporting, expects en-US
    definition.name['en-US'] = definition.name[this.languageTag];
    definition.description = {};
    definition.description[this.languageTag] = this.getDescription();
    // Fallback for h5p-php-reporting, expects en-US
    definition.description['en-US'] = definition.description[this.languageTag];

    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'compound';

    return definition;
  }

  /**
   * Determine whether the task has been passed by the user.
   * @returns {boolean} True if user passed or task is not scored.
   */
  isPassed() {
    return this.content.getScore() === this.content.getMaxScore();
  };

  /**
   * Get tasks title.
   * @returns {string} Title.
   */
  getTitle() {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || ARScavenger.DEFAULT_DESCRIPTION;

    return H5P.createTitle(raw);
  }

  /**
   * Get tasks description.
   * @returns {string} Description.
   */
  getDescription() {
    return this.params.taskDescription || ARScavenger.DEFAULT_DESCRIPTION;
  }

  /**
   * Answer call to return the current state.
   * @returns {object} Current state.
   */
  getCurrentState() {
    return this.content.getCurrentState();
  }
}

/** @constant {string} */
ARScavenger.DEFAULT_DESCRIPTION = 'ARScavenger';

/** @constant {number} */
ARScavenger.MIN_WIDTH_FOR_DUALVIEW = 1024;
