// Import required classes
import './h5p-ar-scavenger-content-camera.scss';
import Util from '@scripts/h5p-ar-scavenger-util.js';

/** @constant {number} WAIT_FOR_VIDEO_MAX_MS Maximum time to wait for video. */
const WAIT_FOR_VIDEO_MAX_MS = 10000;

/** @constant {number} WAIT_FOR_VIDEO_TIMEOUT_MS Timeout for waiting for video. */
const WAIT_FOR_VIDEO_TIMEOUT_MS = 100;

/** Class representing the subject */
export default class ARScavengerContentCamera {
  /**
   * @class
   * @param {object} params Parameter from editor.
   * @param {object[]} params.markers Markers.
   * @param {object} [callbacks] Callbacks.
   * @param {object} [callbacks.onResize] Callbacks.
   */
  constructor(params, callbacks) {
    // Sanitize params
    this.params = Util.extend({
      fallbackHeight: 400
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onResize = this.callbacks.onResize || (() => {});
    this.callbacks.onMarkerFound = this.callbacks.onMarkerFound || (() => {});
    this.callbacks.onMarkerLost = this.callbacks.onMarkerLost || (() => {});

    // Maximum height for camera
    this.maxHeight = null;

    // Content
    this.content = document.createElement('div');
    this.content.classList.add('h5p-ar-scavenger-content-camera');

    this.iframe = this.buildIframe();
    this.content.appendChild(this.iframe);

    // Container
    this.container = document.createElement('div');
    this.container.classList.add('h5p-ar-scavenger-content-camera-container');
    this.container.appendChild(this.content);
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.container;
  }

  /**
   * Set maximum height for subject.
   * @param {number} maxHeight Maximum height for subject.
   */
  resizeIframeHeight(maxHeight) {
    this.maxHeight = (typeof maxHeight === 'number') ? maxHeight : null;
    this.container.style.removeProperty('max-height');
    this.container.style.removeProperty('max-width');

    const style = this.content.currentStyle || window.getComputedStyle(this.content);
    const contentMarginVertical = parseInt(style.marginTop) + parseInt(style.marginBottom);
    const contentMarginHorizontal = parseInt(style.marginLeft) + parseInt(style.marginRight);

    this.videoRatio = this.videoRatio || this.video ? (this.video.offsetWidth / this.video.offsetHeight) : null;

    if (this.maxHeight) {
      this.container.style.maxHeight = `${this.maxHeight}px`;
    }
    const maxWidth = Math.max(this.container.offsetWidth - contentMarginHorizontal, document.body.offsetWidth) ;

    if (this.maxHeight && maxWidth / this.videoRatio > this.maxHeight) {
      this.container.style.maxWidth = `${this.maxHeight * this.videoRatio}px`;
      this.iframe.style.height = `${this.maxHeight - contentMarginVertical}px`;
    }
    else {
      this.container.style.maxWidth = `${document.body.offsetWidth - contentMarginHorizontal}px`;
      this.iframe.style.height =
        `${(this.container.offsetWidth - contentMarginHorizontal) / this.videoRatio || this.params.fallbackHeight}px`;
    }

    this.callbacks.onResize();
  }

  /**
   * Resize.
   */
  resize() {
    this.resizeIframeHeight(this.maxHeight);
  }

  /**
   * Show subject.
   */
  show() {
    this.container.classList.remove('h5p-ar-scavenger-display-none');
  }

  /**
   * Hide subject.
   */
  hide() {
    this.container.classList.add('h5p-ar-scavenger-display-none');
  }

  /**
   * Set view to narrow mode.
   * @param {boolean} [narrow] True will turn to narrow, else false
   */
  setNarrowView(narrow = true) {
    if (narrow) {
      this.container.classList.add('h5p-ar-scavenger-narrow-screen');
    }
    else {
      this.container.classList.remove('h5p-ar-scavenger-narrow-screen');
    }
  }

  /**
   * Toggle view between action visible/invisible.
   */
  toggleView() {
    this.container.classList.toggle('h5p-ar-scavenger-action-mode');
  }

  /**
   * Build iframe.
   * @returns {HTMLElement} iframe.
   */
  buildIframe() {
    const iframe = document.createElement('iframe');
    iframe.classList.add('h5p-ar-scavenger-content-camera-iframe');
    // Feature policy forwarding - hopefully set in parent iframe
    iframe.setAttribute('allow', 'camera *;');
    iframe.setAttribute('tabindex', -1);

    iframe.addEventListener('load', () => {
      if (this.iframeLoaded) {
        return;
      }

      // Will write the iframe contents
      this.handleIframeLoaded(this.iframe);
      this.iframeLoaded = true;
    });

    return iframe;
  }

  /**
   * Build HTML for iframe.
   * @returns {HTMLElement} HTML for iframe.
   */
  buildHTML() {
    const html = document.createElement('html');
    html.appendChild(this.buildHeader());
    html.appendChild(this.buildBody());

    return html;
  }

  /**
   * Build Header.
   * @returns {HTMLElement} Header.
   */
  buildHeader() {
    const head = document.createElement('head');

    // TODO: There must be a way to build the style dynamically from H5P libraries
    const stylesheet = document.createElement('style');
    stylesheet.setAttribute('type', 'text/css');
    stylesheet.innerHTML = '#arjsDebugUIContainer {display: none;} .a-enter-vr,.a-enter-ar  {display: none;}';
    head.appendChild(stylesheet);

    // Load AFrame script
    const scriptAFrame = document.createElement('script');
    scriptAFrame.text = H5P.AFrame.toString();
    head.appendChild(scriptAFrame);

    // Load AR.js script
    const scriptAFrameAR = document.createElement('script');
    scriptAFrameAR.text = H5P.AFrameAR.toString();
    head.appendChild(scriptAFrameAR);

    // Start scripts
    const scriptStarter = document.createElement('script');
    scriptStarter.text  = 'H5PAFrame();';
    scriptStarter.text += 'H5PAFrameAR();';
    head.appendChild(scriptStarter);

    return head;
  }

  /**
   * Build body.
   * @returns {HTMLElement} Body.
   */
  buildBody() {
    const body = document.createElement('body');
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    body.style.padding = '0';

    body.appendChild(this.buildScene());

    return body;
  }

  /**
   * Build Scene.
   * @returns {HTMLElement} Scene.
   */
  buildScene() {
    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; sourceWidth:1920; sourceHeight:1080; debugUIEnabled: false;');

    this.params.markers.forEach((marker, index) => {
      const newMarker = document.createElement('a-marker');
      newMarker.setAttribute('type', 'pattern');
      newMarker.setAttribute('preset', 'custom');
      newMarker.setAttribute('id', index);

      const src = H5P.getPath(marker.markerPattern.path, this.params.contentId);
      newMarker.setAttribute('url', src);

      if (marker.actionType === 'model') {
        const path = marker.model.file.path;
        const extension = path.split('.').slice(-1)[0];
        const id = path.split('/').slice(-1)[0].split('.').slice(0, -1).join('-');

        if (extension === 'gltf' || extension === 'glb') {
          const assetItem = document.createElement('a-asset-item');
          assetItem.setAttribute('id', id);
          assetItem.setAttribute('src', H5P.getPath(path, this.params.contentId));

          const asset = document.createElement('a-asset');
          asset.appendChild(assetItem);
          scene.appendChild(asset);

          // eslint-disable-next-line no-magic-numbers
          const scalePercentage = marker.model.geometry.scale.scale / 100;
          const scale = `${scalePercentage} ${scalePercentage} ${scalePercentage}`;

          const rotationX = marker.model.geometry.rotation.x;
          const rotationY = marker.model.geometry.rotation.y;
          const rotationZ = marker.model.geometry.rotation.z;
          const rotation = `${rotationX} ${rotationY} ${rotationZ}`;
          const position = `${rotationX} ${rotationY} ${rotationZ}`;

          const entity = document.createElement('a-entity');
          entity.setAttribute('gltf-model', `#${  id}`);
          entity.setAttribute('scale', scale);
          entity.setAttribute('rotation', rotation);
          entity.setAttribute('position', position);

          newMarker.appendChild(entity);
        }
        else {
          console.warn('model type not handled');
        }
      }

      if (newMarker) {
        scene.appendChild(newMarker);
      }
    });

    const camera = document.createElement('a-entity');
    camera.setAttribute('camera', '');
    scene.appendChild(camera);

    return scene;
  }

  /**
   * Handle iframe complete. Depends on load timing
   */
  handleIframeComplete() {
    if (this.iframeDocument.readyState !== 'complete') {
      this.iframeDocument.addEventListener('readystatechange', () => {
        if (this.iframeDocument.readyState === 'complete') {
          this.addEventListeners();
        }
      });
    }
    else {
      this.addEventListeners();
    }

    // Set iframe height to video stream height
    this.waitForVideo((video) => {
      this.video = video;
      this.params.fallbackHeight = parseInt(this.video.style.height);

      this.resize();
    });
  }

  /**
   * Wait for video object to.
   * @param {function} callback Callback when video found.
   * @param {number} [timeout] Maximum timeout.
   */
  waitForVideo(callback, timeout = WAIT_FOR_VIDEO_MAX_MS) {
    if (!callback) {
      return;
    }

    if (timeout <= 0) {
      return;
    }

    const video = this.iframeDocument.querySelector('#arjs-video');
    if (video && parseInt(video.style.height) > 0) {
      callback(video);
    }
    else {
      setTimeout(() => {
        this.waitForVideo(callback, timeout - WAIT_FOR_VIDEO_TIMEOUT_MS);
      }, WAIT_FOR_VIDEO_TIMEOUT_MS);
    }
  }

  /**
   * Add event listeners for markers.
   */
  addEventListeners() {
    const markers = Array.from(this.iframeDocument.querySelectorAll('a-marker'));

    markers.forEach((marker) => {
      // Marker found
      marker.addEventListener('markerFound', (event) => {
        this.callbacks.onMarkerFound(event);
      });

      // Marker lost
      marker.addEventListener('markerLost', (event) => {
        this.callbacks.onMarkerLost(event);
      });
    });
  }

  /**
   * Handle iframe loaded.
   * @param {HTMLElement} iframe Iframe.
   */
  handleIframeLoaded(iframe) {
    try {
      const iframeWindow = iframe.contentWindow;

      iframeWindow.addEventListener('resize', this.resize);

      // Write iframe contents
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(this.buildHTML().outerHTML);
      iframe.contentWindow.document.close();

      this.iframeDocument = iframe.contentDocument ? iframe.contentDocument : iframeWindow;

      this.handleIframeComplete();

      setTimeout(() => {
        this.resize();
      }, 0);
    }
    catch (error) {
      console.warn(error);
    }
  }
}
