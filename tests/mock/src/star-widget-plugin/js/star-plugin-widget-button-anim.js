/*jslint vars: true*/
/**
 * Defines a plugin to easily animate a panel. Adapted from the
 * http://yuilibrary.com/yui/docs/overlay/overlay-anim-plugin.html example.
 *
 * In action : http://jsfiddle.net/bretkikehara/vFwYk/
 *
 * @module star.Plugin.WidgetButtonAnimPlugin
 * @class WidgetButtonAnimPlugin
 * @extends Y.Plugin.Base
 * @param conf
 *            {Object} Configuration object (see Configuration attributes)
 * @constructor
 * @since 1.0.0
 * @deprecated See the widget class.
 */
var WidgetButtonAnimPlugin = function () {
  WidgetButtonAnimPlugin.superclass.constructor.apply(this, arguments);
};

/*
 * The namespace for the plugin. This will be the property on the widget, which will
 * reference the plugin instance, when it's plugged in
 */
WidgetButtonAnimPlugin.NS = "WidgetButtonAnimPlugin";

/*
 * The NAME of the WidgetButtonAnimPlugin class. Used to prefix events generated
 * by the plugin class.
 */
WidgetButtonAnimPlugin.NAME = "WidgetButtonAnimPlugin";

/*
 * The default set of attributes for the WidgetButtonAnimPlugin class.
 */
WidgetButtonAnimPlugin.ATTRS = {
  /*
   * Default duration. Used by the default animation implementations
   */
  duration : {
    value : 0.4
  },
  to : {
    value : {
      opacity : 1
    }
  },
  from : {
    value : {
      opacity : 0
    }
  }
};

/*
 * Extend the base plugin class.
 */
Y.namespace('star.Plugin');
Y.star.Plugin.WidgetButtonAnimPlugin = Y.extend(WidgetButtonAnimPlugin, Y.Plugin.Base, {
  /**
   * Initates the animation with regards to its host widget.
   *
   * @method initializer
   * @protected
   */
  initializer : function () {
    // stops setting the content, so we can animate before showing new content
    this.doBefore("_uiRemoveButton", this._uiAnimRemoveButton);

    // stops setting the content, so we can animate before showing new content
    this.doBefore("_uiInsertButton", this._beforeInsertButton, this);
    this.doAfter("_uiInsertButton", this._afterInsertButton, this);
  },
  /**
   * Destroys this animation, and returns the host widget to its normal state.
   *
   * @method destructor
   * @protected
   */
  destructor : function () {
    this.detach("_uiRemoveButton", this._uiAnimRemoveButton);
    this.detach("_uiInsertButton", this._beforeInsertButton);
    this.detach("_uiInsertButton", this._afterInsertButton);
  },
  /**
   * Override the host widget's _uiRemoveButton event with this function.
   *
   * @method _uiAnimSetStdMod
   * @protected
   */
  _uiAnimRemoveButton : function (button, section, options) {
    var host = this.get('host');
    var handleEnd = Y.bind(Y.WidgetButtons.prototype._uiRemoveButton, host, button, section, options);
    var anim = Y.mix({
      duration : this.get('duration')
    }, this.get('from'));

    // don't start until the widget has rendered.
    if (host.get("rendered")) {
      button.transition(anim, handleEnd);
      return new Y.Do.Prevent ("WidgetButtonAnimPlugin prevented default show/hide");
    }
  },
  /**
   * Ensures the button is ready to be animated.
   *
   * @method _uiAnimSetStdMod
   * @param {Object} button
   * @protected
   */
  _beforeInsertButton : function (button) {
    button.setStyles(this.get('from'));
  },
  /**
   * Animates the buttons.
   *
   * @param {Object} button
   */
  _afterInsertButton : function (button) {
    var anim = Y.mix({
      duration : this.get('duration')
    }, this.get('to'));
    button.transition(anim);
  }
});
