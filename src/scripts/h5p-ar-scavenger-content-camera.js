// Import required classes
import Util from './h5p-ar-scavenger-util';

/** Class representing the subject */
export default class ARScavengerContentCamera {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} params.website Website.
   * @param {string} params.website.protocol Protocol.
   * @param {string} params.website.url URL.
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

    // Maximum height for subject
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
   * @return {HTMLElement} DOM for this class.
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

    if (this.maxHeight) {
      // Fullscreen
      this.container.style.maxHeight = `${this.maxHeight}px`;
      if (this.iframeBody) {
        this.iframeBody.style.removeProperty('overflow');
      }

      const style = this.content.currentStyle || window.getComputedStyle(this.content);
      const contentMargin = parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);
      this.iframe.style.height = `${this.maxHeight - contentMargin}px`;
    }
    else {
      // Normal view
      this.container.style.removeProperty('max-height');
      if (this.iframeBody) {
        this.iframeBody.style.overflow = 'hidden';
        // this.iframe.style.height = `${this.iframeBody.scrollHeight}px`;
        this.iframe.style.height = `${this.params.fallbackHeight}px`;
      }
      else {
        this.iframe.style.height = `${this.params.fallbackHeight}px`;
      }
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
   * @param {boolean} [narrow = true] True will turn to narrow, else false
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

  buildIframe() {
    // iframe
    const iframe = document.createElement('iframe');
    iframe.classList.add('h5p-ar-scavenger-content-camera-iframe');
    iframe.addEventListener('load', () => {
      if (!this.iframeLoaded) {
        this.handleIframeLoaded(this.iframe);
      }
      this.iframeLoaded = true;
    });

    return iframe;
  }

  buildHTML() {
    this.box1 = document.createElement('a-box');
    this.box1.setAttribute('position', '0 0.5 0');
    this.box1.setAttribute('material', 'color: yellow;');

    this.box2 = document.createElement('a-box');
    this.box2.setAttribute('position', '0 0.5 0');
    this.box2.setAttribute('material', 'color: red;');

    this.box3 = document.createElement('a-box');
    this.box3.setAttribute('position', '0 0.5 0');
    this.box3.setAttribute('material', 'color: green;');

    this.assetItem1 = document.createElement('a-asset-item');
    this.assetItem1.setAttribute('id', 'robo');
    this.assetItem1.setAttribute('src', '/drupal/sites/default/files/h5p/development/h5p-ar-scavenger/dist/robo.gltf');

    this.asset1 = document.createElement('a-asset');
    this.asset1.appendChild(this.assetItem1);

    this.entity1 = document.createElement('a-entity');
    this.entity1.setAttribute('gltf-model', '#robo');
    this.entity1.setAttribute('scale', '1');
    this.entity1.setAttribute('rotation', '0 -90 0');

    this.entity2 = document.createElement('a-entity');
    this.entity2.setAttribute('gltf-model', '#animated-asset');
    this.entity2.setAttribute('scale', '2');

    this.marker1 = document.createElement('a-marker');
    this.marker1.setAttribute('preset', 'hiro');
    this.marker1.appendChild(this.entity1);
    // this.marker1.setAttribute('smooth', 'true');

    this.marker2 = document.createElement('a-marker');
    this.marker2.setAttribute('type', 'pattern');
    this.marker2.setAttribute('preset', 'custom');
    this.marker2.setAttribute('id', 'H5P');
    this.marker2.setAttribute('url', '/drupal/sites/default/files/h5p/development/h5p-ar-scavenger/dist/h5p.patt');
    // this.marker2.appendChild(this.box1);

    this.marker3 = document.createElement('a-marker');
    this.marker3.setAttribute('type', 'pattern');
    this.marker3.setAttribute('preset', 'custom');
    this.marker3.setAttribute('id', 'Minecraft');
    this.marker3.setAttribute('url', '/drupal/sites/default/files/h5p/development/h5p-ar-scavenger/dist/grass.patt');
    this.marker3.appendChild(this.box3);

    this.marker4 = document.createElement('a-marker');
    this.marker4.setAttribute('preset', 'kanji');
    this.marker4.appendChild(this.box2);

    this.camera = document.createElement('a-entity');
    this.camera.setAttribute('camera', '');

    this.scene = document.createElement('a-scene');
    this.scene.setAttribute('embedded', '');
    this.scene.setAttribute('arjs', '');
    this.scene.appendChild(this.asset1);
    this.scene.appendChild(this.marker1);
    this.scene.appendChild(this.marker2);
    this.scene.appendChild(this.marker3);
    this.scene.appendChild(this.marker4);
    this.scene.appendChild(this.camera);

    this.body = document.createElement('body');
    this.body.style.margin = '0';
    this.body.style.overflow = 'hidden';
    this.body.appendChild(this.scene);

    this.script1 = document.createElement('script');
    this.script1.type = 'text/javascript';
    this.script1.src = 'https://aframe.io/releases/1.0.4/aframe.min.js';

    this.script2 = document.createElement('script');
    this.script2.type = 'text/javascript';
    this.script2.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
    this.style = document.createElement('style');
    this.style.innerHTML = '#arjsDebugUIContainer {display: none;} .a-enter-vr {display: none;}';

    this.head = document.createElement('head');
    this.head.appendChild(this.script1);
    this.head.appendChild(this.script2);
    this.head.appendChild(this.style);

    this.html = document.createElement('html');
    this.html.appendChild(this.head);
    this.html.appendChild(this.body);

    return this.html.outerHTML;
  }

  /**
   * Handle iframe loaded.
   * @param {HTMLElement} iframe Iframe.
   */
  handleIframeLoaded(iframe) {
    try {
      const iframeWindow = iframe.contentWindow;

      iframeWindow.addEventListener('resize', () => this.resize);

      // iframe.contentWindow.document.open();
      // iframe.contentWindow.document.write(this.buildHTML());
      // iframe.contentWindow.document.close();

      this.iframeDocument = iframe.contentDocument ? iframe.contentDocument: iframeWindow;

      this.iframeDocument.addEventListener('readystatechange', () => {
        if (this.iframeDocument.readyState === 'interactive') {
          this.iframeBody = this.iframeDocument.body;
          this.iframeBody.style.margin = 0;
          this.iframeBody.style.overflow = 'hidden';
          this.iframeBody.style.padding = 0;
        }

        if (this.iframeDocument.readyState === 'complete') {
          const markers = this.iframeDocument.querySelectorAll('a-marker');
          for (let i = 0; i < markers.length; i++) {
            if (markers[i].getAttribute('id') !== 'H5P') {
              continue;
            }

            markers[i].addEventListener('markerFound', (event) => {
              this.callbacks.onMarkerFound(event);
            });
            markers[i].addEventListener('markerLost', (event) => {
              this.callbacks.onMarkerLost(event);
            });
          }
        }
      });

      setTimeout(() => {
        this.resize();
      }, 0);
    }
    catch (error) {
      console.warn(error);
    }
  }
}
