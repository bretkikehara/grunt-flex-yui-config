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
var StarPanel = function () {
  StarPanel.superclass.constructor.apply(this, arguments);
};
/**
 * Defines the NAME of the class. Added to the widget's bounding box.
 */
StarPanel.NAME = "panel";
/**
 * Defines the default set of attributes.
 */
StarPanel.ATTRS = {
  /**
   * Defines the hide/show animation. See the Y.star.plugin.AnimPlugin module for
   * the details.
   *
   * @attribute visibleAnimation
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
  "loadAnimation" : {
    "value" : {
      "from" : {
        "opacity" : 0
      },
      "to" : {
        "opacity" : 1
      },
      "easing" : Y.Easing.easeOut,
      "duration" : 0.25
    }
  },
  /**
   * Defines the DOM element to bind the drag on.
   *
   * @attribute dragContextSelector
   * @type String
   */
  'dragContextSelector' : {
    value : '.yui3-widget-hd'
  },
  /**
   * Default zIndex must be above the HTML header.
   */
  'zIndex' : {
    value : 10
  },
  /**
   * Default event handler.
   */
  "on" : {
    "value" : {
      "loadURI" : function (id, o) {
        this.set('bodyContent', o.responseText);
      }
    }
  },
  /**
   * Show when loading.
   */
  "loadingContent" : {
    "value" : "<div style='text-align : center'><img src='/cdn/images/loader/02/wait16.gif'/></div>"
  },
  'bodyContent' : {
    "value" : ''
  }
};
Y.namespace('star');
Y.star.StarPanel = Y.extend(StarPanel, Y.Panel, {
  /**
   * Handles the destruction of this widget.
   *
   * @method destructor
   * @protected
   */
  destructor : function () {
    this.unplug(Y.Plugin.Drag);
    this.unplug(Y.star.Plugin.VisibleAnimPlugin);
  },
  /**
   * Initializes the default panel.
   *
   * @method initializer
   * @protected
   */
  initializer : function () {
    // add drag.
    if (this.get('dragContextSelector')) {
      this.plug(Y.Plugin.Drag, {
        "handles" : [this.get('dragContextSelector')],
        "on" : {
          "drag:end" : function (e) {
            var node = this.get('node');
            if (e.pageY < 10) {
              node.setY(10);
            }
            if (e.pageX < 10) {
              node.setX(10);
            }
          }
        }
      });
    }
    this.plug(Y.star.Plugin.WidgetVisibleAnimPlugin);
    this.plug(Y.star.Plugin.WidgetButtonAnimPlugin);
    // allows us to do an action before actually removing the buttons.
    this.after('removeButtons', this._removeButtons, this);
  },
  /**
   * Clears the panel buttons.
   *
   * @param section (Optional) Section to remove buttons from. Will default to
   * footer.
   * @method _removeButtons
   * @private
   */
  _removeButtons : function (e) {
    var section = e.details[0] || 'footer';
    var buttons = this.get('buttons');
    // clear the buttons.
    Y.Object.each(buttons[section], function (n) {
      this.removeButton(n, section);
    }, this);
  },
  /**
   * Clears the panel buttons.
   *
   * @param section (Optional) Section to remove buttons from. Will default to
   * footer.
   * @method removeButtons
   * @public
   */
  removeButtons : function (widgetSection) {
    // remove the buttons.
    this.fire('removeButtons', widgetSection);
    return this;
  },
  /**
   * Loads this panel with content.
   *
   * @param {Object} uri
   * @param {Object} config
   * @method io
   * @public
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
  /*
   loadContent : function (cfg) {
   var content = null, animComplete = false;
   Y.io('', {
   success : function (id, resp) {
   content = resp.responseText;
   if (animComplete) {
   // fadein set out
   this._loadContent(n, content);
   }
   }
   });
   n.transition('fadeout', Y.bind(function () {
   // can be a dirty read, but we don't care
   n.setHTML((content) ? content : this.get('loadingContent'));
   n.transition('fadein', Y.bind(function () {
   animComplete = true;
   if (!content) {
   // fadein set out
   this._loadContent(n, content);
   }
   }, this));
   }, this));
   },
   _loadContent : function (node, html) {
   node.transition({
   duration : 0.5,
   opacity : 0
   }, function () {
   node.setHTML(html);
   node.transition({
   duration : 0.5
   });
   });
   }*/
});
