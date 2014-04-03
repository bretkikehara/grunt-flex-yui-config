/*jslint vars: true*/
/**
 * Defines a plugin to easily animate a panel. Adapted from the
 * http://yuilibrary.com/yui/docs/overlay/overlay-anim-plugin.html example.
 *
 * In action : http://jsfiddle.net/bfRyY/1/
 *
 * @module star.Plugin.WidgetVisibleAnimPlugin
 * @class WidgetVisibleAnimPlugin
 * @extends Y.Plugin.Base
 * @param conf
 *            {Object} Configuration object (see Configuration attributes)
 * @constructor
 * @since 1.0.0
 * @deprecated See the widget class.
 */
var WidgetVisibleAnimPlugin = function () {
  WidgetVisibleAnimPlugin.superclass.constructor.apply(this, arguments);
};
/*
 * The namespace for the plugin. This will be the property on the widget, which
 * will
 * reference the plugin instance, when it's plugged in
 */
WidgetVisibleAnimPlugin.NS = "WidgetVisibleAnimPlugin";
/*
 * The NAME of the WidgetVisibleAnimPlugin class. Used to prefix events generated
 * by the plugin class.
 */
WidgetVisibleAnimPlugin.NAME = "WidgetVisibleAnimPlugin";
/*
 * The default set of attributes for the WidgetVisibleAnimPlugin class.
 */
WidgetVisibleAnimPlugin.ATTRS = {
  /*
   * Default animation instance used for showing the widget (opacity fade-in)
   */
  animVisible : {
    valueFn : function () {
      var host = this.get('host');
      var node = host.get('boundingBox');
      var toAnim = host.get('visibleAnimation.to');
      var anim = new Y.Anim ({
        "node" : node,
        "to" : toAnim,
        "duration" : host.get('visibleAnimation.duration')
      });
      // Set initial opacity, to avoid initial flicker
      if (!host.get("visible")) {
        if (toAnim.opacity) {
          node.setStyle('opacity', 0);
        }
      }
      // Clean up, on destroy. Where supported, remove
      // opacity set using style. Else make 100% opaque
      anim.on("destroy", function () {
        var node = this.get('node');
        if (toAnim.opacity) {
          if (Y.UA.ie) {
            node.setStyle("opacity", 1);
          }
          else {
            node.setStyle("opacity", "");
          }
        }
      });
      return anim;
    }
  },
  /*
   * Default animation instance used for hiding the widget (opacity fade-out)
   */
  animHidden : {
    valueFn : function () {
      var host = this.get('host');
      var node = host.get('boundingBox');
      return new Y.Anim ({
        node : node,
        to : host.get('visibleAnimation.from'),
        duration : host.get('visibleAnimation.duration')
      });
    }
  }
};
/*
 * Extend the base plugin class.
 */
Y.namespace('star.Plugin');
Y.star.Plugin.WidgetVisibleAnimPlugin = Y.extend(WidgetVisibleAnimPlugin, Y.Plugin.Base, {
  /**
   * Initates the animation with regards to its host widget.
   *
   * @method initializer
   * @protected
   */
  initializer : function () {
    var host = this.get('host');
    this._bindAnimVisible();
    this._bindAnimHidden();
    this.after("animVisibleChange", this._bindAnimVisible);
    this.after("animHiddenChange", this._bindAnimHidden);
    // Override default _uiSetVisible method, with custom animated method
    this.doBefore("_uiSetVisible", this._uiAnimSetVisible);
    // update the animation object.
    host.after('visibleAnimationChange', this.visibleAnimationChange, this);
  },
  /**
   * Destroys this animation, and returns the host widget to its normal state.
   *
   * @method destructor
   * @protected
   */
  destructor : function () {
    var animVis = this.get("animVisible"),
    // hidden animation.
    animHide = this.get("animHidden");
    var host = this.get('host');
    animVis.stop();
    animVis.destroy();
    animHide.stop();
    animHide.destroy();
    host.detach('visibleAnimationChange', this.visibleAnimationChange);
  },
  /**
   * Updates the visible animation object.
   *
   * @method visibleAnimationChange
   * @protected
   */
  visibleAnimationChange : function () {
    var animVis = this.get("animVisible"),
    // hidden animation.
    animHide = this.get("animHidden");
    var host = this.get('host');
    var anim = host.get('visibleAnimation');
    animVis.set('to', anim.to);
    animHide.set('to', anim.from);
  },
  /**
   * Override the host widget's _uiSetVisible event with this function.
   *
   * @method _uiAnimSetVisible
   * @protected
   */
  _uiAnimSetVisible : function (val) {
    var animVis = this.get("animVisible"),
    // hidden animation.
    animHide = this.get("animHidden");
    var host = this.get('host');
    if (host.get("rendered")) {
      if (val) {
        animHide.stop();
        animVis.run();
      }
      else {
        animVis.stop();
        animHide.run();
      }
      return new Y.Do.Prevent ("WidgetVisibleAnimPlugin prevented default show/hide");
    }
  },
  /**
   * Sets the visible state for the UI
   *
   * @method _uiSetVisible
   * @protected
   * @param {boolean} val
   */
  _uiSetVisible : function () {
    var host = this.get('host');
    var bb = host.get('boundingBox');
    var name = host.getClassName("hidden");
    //TODO Fix me.
    bb.toggleClass(name);
  },
  /**
   * Binds the show animation to the widget.
   *
   * @method _bindAnimVisible
   * @private
   */
  _bindAnimVisible : function () {
    var animVisible = this.get("animVisible");
    // Setup original visibility handling (for show) before starting to animate
    animVisible.on("start", this._uiSetVisible, this);
  },
  /**
   * Binds the hide animation to the widget.
   *
   * @method _bindAnimHidden
   * @private
   */
  _bindAnimHidden : function () {
    var animHidden = this.get("animHidden");
    // Setup original visibility handling (for hide) after completing animation
    animHidden.after("end", this._uiSetVisible, this);
  }
});
