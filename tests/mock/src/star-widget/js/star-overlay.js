/*jslint vars: true*/
/**
 * Easily adds animation and drag to the panel.
 *
 * @module star.StarPanel
 * @class StarPanel
 * @extends  Y.Panel
 * @param conf
 *            {Object} Configuration object (see Configuration attributes)
 * @constructor
 * @since 1.0.0
 */
var StarOverlay = function () {
  StarOverlay.superclass.constructor.apply(this, arguments);
};
/**
 * Defines the NAME of the class. Added to the widget's bounding box.
 */
StarOverlay.NAME = "star-overlay";
/**
 * Defines the default set of attributes.
 */
StarOverlay.ATTRS = {
  /**
   * Defines the hide/show animation. See the Y.star.plugin.AnimPlugin module for
   * the details.
   *
   * @attribute animation
   * @type Object
   */
  'visibleAnimation' : {
    "value" : {
      'duration' : 0.25,
      'to' : {
        "opacity" : 1
      },
      'from' : {
        "opacity" : 0
      },
      'easing' : 'ease'
    }
  },
  /**
   * Default zIndex must be above the HTML header.
   */
  'zIndex' : {
    "value" : 10
  },
  /**
   * Show when loading.
   */
  "loadingContent" : {
    "value" : "<div style='text-align : center'><img src='/cdn/images/loader/02/wait16.gif'/></div>"
  }
};
Y.namespace('star');
Y.star.StarOverlay = Y.extend(StarOverlay, Y.Overlay, {
  /**
   * Handles the destruction of this widget.
   *
   * @method destructor
   * @protected
   */
  destructor : function () {
    this.unplug(Y.star.Plugin.WidgetVisibleAnimPlugin);
  },
  /**
   * Initializes the default panel.
   *
   * @method initializer
   * @protected
   */
  initializer : function () {
    this.plug(Y.star.Plugin.WidgetVisibleAnimPlugin);
    this.plug(Y.star.Plugin.WidgetContentAnimPlugin);
  },
  /**
   * Loads this panel with content.
   *
   * @param {Object} uri
   * @param {Object} config
   */
  io : function (uri, config) {
    // fill in the configs as necessary.
    var cfg = Y.mix(config, {
      "method" : 'post',
      "context" : this,
      "on" : {
        "success" : function (id, o) {
          this.set('bodyContent', o.responseText);
          Y.Global.fire('tooltip:refresh');
        }
      }
    });
    return Y.io(uri, cfg);
  }
});
