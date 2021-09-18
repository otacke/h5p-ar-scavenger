export default class ContentHandlers {
  /**
   * Handle marker found.
   */
  handleMarkerFound(event) {
    if (!this.isShown) {
      return; // Content is not shown
    }

    if (!this.isCameraMode && this.isNarrowScreen) {
      return; // Not using camera
    }

    const markerId = parseInt(event.target.id);
    const marker = this.params.markers[markerId];

    if (marker.actionType === 'h5p') {

      this.instantiateContent(markerId);
      this.instances[markerId].setActivityStarted();

      this.currentInstanceId = markerId;
      this.action.attachInstance(this.instanceDOMs[markerId], markerId);
      this.action.showContent();
      this.action.show();

      if (this.isCameraMode) {
        this.titlebar.toggleButtonActive('switchView', false);
        this.toggleView();
      }

      setTimeout(() => {
        this.instances[markerId].trigger('resize');
      }, 0);
    }
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
   * Handle title screen closed.
   */
  handleTitleScreenClosed() {
    this.screenTitle.hide();
    this.show();

    if (this.titlebar) {
      this.titlebar.focusButton('switchView');
    }

    setTimeout(() => {
      this.callbacks.onResize();
    }, 0);
  }

  /**
   * Handle completed.
   */
  handleCompleted() {
    if (this.params.showEndScreen) {
      this.titlebar.showButton('quit');
      this.titlebar.toggleButtonDisabled('quit', false);
    }
  }

  /**
   * Handle quit.
   */
  handleQuit() {
    if (this.params.showEndScreen) {
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

    if (this.params.showTitleScreen) {
      this.screenTitle.show({ focusStartButton: true });
    }
    else {
      this.show();
    }

    // Will be displayed when necessary
    if (this.params.showEndScreen && this.getMaxScore() > 0) {
      this.titlebar.toggleButtonDisabled('quit', true);
      this.titlebar.showButton('quit');
    }
    else {
      this.titlebar.hideButton('quit');
    }

    setTimeout(() => {
      this.callbacks.onResize();
    }, 0);
  }

  /**
   * Handle activation of overlay button.
   */
  handleSwitchView() {
    const active = !this.titlebar.isButtonActive('switchView');

    const message = (active) ?
      this.params.a11y.actionOpened :
      this.params.a11y.actionClosed;
    this.callbacks.onRead(message);

    this.toggleView();
  }
}
