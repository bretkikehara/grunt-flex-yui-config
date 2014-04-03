/*jslint vars: true*/
/**
 * Defines a plugin to easily animate a panel. Adapted from the
 * http://yuilibrary.com/yui/docs/overlay/overlay-anim-plugin.html example.
 *
 * In action : http://jsfiddle.net/bfRyY/1/
 *
 * @module star.Plugin.WidgetContentAnimPlugin
 * @class WidgetContentAnimPlugin
 * @extends Y.Plugin.Base
 * @param conf
 *            {Object} Configuration object (see Configuration attributes)
 * @constructor
 * @since 1.0.0
 */
var WidgetContentAnimPlugin = function () {
  WidgetContentAnimPlugin.superclass.constructor.apply(this, arguments);
},
// content suffix
CONTENT_SUFFIX = "Content";
/*
 * The namespace for the plugin. This will be the property on the widget, which
 * will
 * reference the plugin instance, when it's plugged in
 */
WidgetContentAnimPlugin.NS = "WidgetContentAnimPlugin";
/*
 * The NAME of the WidgetContentAnimPlugin class. Used to prefix events generated
 * by the plugin class.
 */
WidgetContentAnimPlugin.NAME = "WidgetContentAnimPlugin";
/*
 * The default set of attributes for the WidgetContentAnimPlugin class.
 */
WidgetContentAnimPlugin.ATTRS = {
  /*
   * Default duration. Used by the default animation implementations
   */
  "duration" : {
    "value" : 0.2
  },
  "to" : {
    "value" : {
      "opacity" : 1
    }
  },
  "from" : {
    "value" : {
      "opacity" : 0
    }
  },
  /*
   * Default animation instance used for showing the widget (opacity fade-in)
   */
  "animVisible" : {
    "valueFn" : function () {
      var host = this.get('host');
      if (!host.get('bodyContent')) {
        host.set('bodyContent', '');
      }
      var node = host.getStdModNode('body', true);
      var anim = new Y.Anim ({
        node : node,
        to : this.get('to'),
        duration : this.get("duration")
      });
      // Set initial opacity, to avoid initial flicker
      node.setStyles(this.get('from'));
      // Clean up, on destroy. Where supported, remove
      // opacity set using style. Else make 100% opaque
      anim.on("destroy", function () {
        var node = this.get('node');
        node.setStyles(this.get('to'));
        if (Y.UA.ie) {
          node.setStyle("opacity", 1);
        }
        else {
          node.setStyle("opacity", "");
        }
      });
      return anim;
    }
  },
  /*
   * Default animation instance used for hiding the widget (opacity fade-out)
   */
  "animHidden" : {
    "valueFn" : function () {
      var host = this.get('host');
      if (!host.get('bodyContent')) {
        host.set('bodyContent', '');
      }
      var node = host.getStdModNode('body', true);
      return new Y.Anim ({
        node : node,
        to : this.get('from'),
        duration : this.get("duration")
      });
    }
  }
};
/*
 * Extend the base plugin class.
 */
Y.namespace('star.Plugin');
Y.star.Plugin.WidgetContentAnimPlugin = Y.extend(WidgetContentAnimPlugin, Y.Plugin.Base, {
  /**
   * Initates the animation with regards to its host widget.
   *
   * @method initializer
   * @protected
   */
  initializer : function () {
    this._bindAnimVisible();
    this._bindAnimHidden();
    // stops setting the content, so we can animate before showing new content
    this.doBefore("_uiSetStdMod", this._uiAnimSetStdMod);
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
    animVis.stop();
    animVis.destroy();
    animHide.stop();
    animHide.destroy();
    this.detach("_uiSetStdMod", this._uiAnimSetStdMod);
  },
  /**
   * Override the host widget's _uiSetStdMod event with this function.
   *
   * @method _uiAnimSetStdMod
   * @protected
   */
  _uiAnimSetStdMod : function (section, content, where) {
    var animVis = this.get("animVisible"),
    // hidden animation.
    animHide = this.get("animHidden");
    var host = this.get('host');
    if (host.get("rendered") && 'body' === section) {
      // temp store for the content.
      this.set('content', content);
      this.set('where', where);
      if (host.get('bodyContent').length > 0) {
        animVis.stop();
        animHide.run();
      }
      else {
        animHide.stop();
        animVis.run();
      }
      return new Y.Do.Prevent ("WidgetContentAnimPlugin prevented default show/hide");
    }
  },
  /**
   * Since the host widget's visible function is prevented, use a modified
   * version of the host
   * function.
   *
   * @method _uiSetStdMod
   * @private
   */
  _uiSetStdMod : function () {
    var content = this.get('content');
    var section = 'body';
    var where = this.get('where');
    var host = this.get('host');
    // Using isValue, so that "" is valid content
    if (Y.Lang.isValue(content)) {
      var node = host.getStdModNode(section, true);
      host._addStdModContent(node, content, where);
      host.set(section + CONTENT_SUFFIX, host._getStdModContent(section), {
        src : Y.Widget.UI_SRC
      });
    }
    else {
      host._eraseStdMod(section);
    }
    host.fire("contentUpdate");
  },
  /**
   * Binds the show animation to the widget.
   *
   * @method _bindAnimVisible
   * @private
   */
  _bindAnimVisible : function () {
    var animVis = this.get("animVisible");
    // Setup original visibility handling (for show) before starting to animate
    animVis.on("start", Y.bind(function () {
      this._uiSetStdMod();
    }, this));
  },
  /**
   * Binds the hide animation to the widget.
   *
   * @method _bindAnimHidden
   * @private
   */
  _bindAnimHidden : function () {
    var animHidden = this.get("animHidden");
    var animVis = this.get("animVisible");
    // Setup original visibility handling (for hide) after completing animation
    animHidden.after("end", Y.bind(function () {
      animVis.run();
    }, this));
  }
});
