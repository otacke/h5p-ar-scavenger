// Import required classes
import ARScavengerContent from './h5p-ar-scavenger-content';
import Util from './h5p-ar-scavenger-util';

/** Class representing ARScavenger */
export default class ARScavenger extends H5P.Question {
  /**
   * @constructor
   *
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras={}] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('ar-scavenger'); // CSS class selector for content's iframe: h5p-ar-scavenger

    this.contentId = contentId;

    // TODO: Loading Spinner
    // TODO: Editor: check size attribute for marker
    // TODO: (Model viewer in editor)

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */

    // Sanitize params
    this.params = Util.extend({
      titleScreen: {
        showTitleScreen: false
      },
      canHasFullScreen: H5P.canHasFullScreen,
      markers: [],
      endScreen: {
        showEndScreen: false
      },
      behaviour: {
        enableSolutionsButton: false,
        enableRetry: false,
        fallbackHeight: 400
      },
      l10n: {
        start: 'Start',
        retry: 'Retry',
        nothingToSee: 'Find a marker to see an interaction.'
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
    this.params.markers = this.params.markers.filter(marker =>
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

    if (this.params.canHasFullScreen) {
      this.on('enterFullScreen', () => {
        this.content.setFullScreen(true);
      });

      this.on('exitFullScreen', () => {
        this.content.setFullScreen(false);
      });
    }

    /**
     * Register the DOM elements with H5P.Question
     */
    this.registerDomElements = () => {
      // On desktop, action might be wanted to be open on startup
      this.params.behaviour.showActionOnStartup = this.params.behaviour.showActionOnStartup &&
        document.querySelector('.h5p-container').offsetWidth >= ARScavenger.MIN_WIDTH_FOR_DUALVIEW;

      this.content = new ARScavengerContent(this.params, this.contentId, this.extras, {
        onFullScreen: this.toggleFullScreen,
        onQuit: this.handleCompleted,
        onRead: this.read,
        onResize: this.resize
      });

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());
    };

    /**
     * Handle activation of fullscreen button.
     * @param {object} event Event that is calling.
     */
    this.toggleFullScreen = () => {
      if (H5P.canHasFullScreen !== true) {
        return;
      }

      if (H5P.isFullscreen === true) {
        H5P.exitFullScreen();
      }
      else {
        H5P.fullScreen(H5P.jQuery(document.querySelector('.h5p-container')), this);
      }
    };

    /**
     * Handle content completed.
     */
    this.handleCompleted = () => {
      this.trigger(this.getXAPIAnswerEvent());
    };

    /**
     * Check if result has been submitted or input has been given.
     * @return {boolean} True, if answer was given.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswerGiven = () => this.content.getAnswerGiven();

    /**
     * Get latest score.
     * @return {number} latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => this.content.getScore();

    /**
     * Get maximum possible score
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => this.content.getMaxScore();

    /**
     * Show solutions.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      this.content.showSolutions();
    };

    /**
     * Reset task.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      this.content.reset();
    };

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

    /**
     * Resize.
     */
    this.resize = () => {
      this.trigger('resize', {break: true});
    };

    /**
     * Get xAPI data.
     * @return {object} XAPI statement.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    this.getXAPIData = () => ({
      statement: this.getXAPIAnswerEvent().data.statement
    });

    /**
     * Build xAPI answer event.
     * @return {H5P.XAPIEvent} XAPI answer event.
     */
    this.getXAPIAnswerEvent = () => {
      const xAPIEvent = this.createXAPIEvent('answered');

      xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this, this.getAnswerGiven(), this.isPassed());

      return xAPIEvent;
    };

    /**
     * Create an xAPI event.
     * @param {string} verb Short id of the verb we want to trigger.
     * @return {H5P.XAPIEvent} Event template.
     */
    this.createXAPIEvent = (verb) => {
      const xAPIEvent = this.createXAPIEventTemplate(verb);
      Util.extend(
        xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
        this.getxAPIDefinition());
      return xAPIEvent;
    };

    /**
     * Get the xAPI definition for the xAPI object.
     * @return {object} XAPI definition.
     */
    this.getxAPIDefinition = () => {
      const definition = {};
      definition.name = {'en-US': this.getTitle()};
      definition.description = {'en-US': this.getDescription()};

      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
      definition.interactionType = 'compound';

      return definition;
    };

    /**
     * Determine whether the task has been passed by the user.
     * @return {boolean} True if user passed or task is not scored.
     */
    this.isPassed = () => this.content.getScore() === this.content.getMaxScore();

    /**
     * Get tasks title.
     * @return {string} Title.
     */
    this.getTitle = () => {
      let raw;
      if (this.extras.metadata) {
        raw = this.extras.metadata.title;
      }
      raw = raw || ARScavenger.DEFAULT_DESCRIPTION;

      return H5P.createTitle(raw);
    };

    /**
     * Get tasks description.
     * @return {string} Description.
     */
    this.getDescription = () => this.params.taskDescription || ARScavenger.DEFAULT_DESCRIPTION;

    /**
     * Answer call to return the current state.
     * @return {object} Current state.
     */
    this.getCurrentState = () => {
      return this.content.getCurrentState();
    };
  }
}

/** @constant {string} */
ARScavenger.DEFAULT_DESCRIPTION = 'ARScavenger';

/** @constant {number} */
ARScavenger.MIN_WIDTH_FOR_DUALVIEW = 1024;
