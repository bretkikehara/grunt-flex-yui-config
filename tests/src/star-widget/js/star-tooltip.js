/*jslint vars: true*/
/**
 * Shows all elements with title tags information in a overlay.
 *
 * @module star.Tooltip
 * @class Tooltip
 * @extends Base
 * @param conf
 *          {Object} Configuration object (see Configuration attributes)
 * @constructor
 * @since 1.0.0
 */
var Tooltip = function () {
  Tooltip.superclass.constructor.apply(this, arguments);
};
Tooltip.NAME = 'star-tooltip';
Tooltip.ATTRS = {
  /**
   * Defines the hide/show animation. See the Y.star.plugin.AnimPlugin module for the details.
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
   * CSS selector to add the tooltip onto.
   *
   * @attribute context
   * @type String
   * @default '*[title]'
   */
  'context' : {
    'value' : '*[title]'
  },
  /**
   * How long to show the tooltip for (in milli-seconds).
   *
   * @attribute timeout
   * @type Number
   * @default 5000
   */
  'timeout' : {
    'value' : 500
  },
  /**
   * The x-offset for the position of the tooltip.
   *
   * @attribute offsetX
   * @type Number
   * @default 10
   */
  'offsetX' : {
    'value' : 10
  },
  /**
   * The y-offset for the position of the tooltip.
   *
   * @attribute offsetY
   * @type Number
   * @default 10
   */
  'offsetY' : {
    'value' : 10
  },
  /**
   * Handle the whether to render the tooltips on instantiation.
   *
   * @attribute render
   * @type boolean
   * @default true
   */
  'render' : {
    'value' : true
  },
  /**
   * Handle the whether to show the tooltips on render.
   *
   * @attribute visible
   * @type boolean
   * @default false
   */
  'visible' : {
    'value' : false
  },
  /**
   * Handles the zIndex.
   *
   * @attribute zIndex
   * @type integer
   * @default 100
   */
  'zIndex' : {
    'value' : 100
  },
  'pause' : {
    'value' : false
  }
};
Y.namespace('star');
Y.star.StarTooltip = Y.extend(Tooltip, Y.Overlay, {
  /**
   * Refreshes the tooltip context.
   *
   * @method refresh
   * @public
   */
  refresh : function () {
    this.detachEvents();
    this.attachEvents();
  },
  /**
   * Attaches the events.
   *
   * @method attachEvents
   * @protected
   */
  attachEvents : function () {
    var filter = function () {
      return true;
    };
    Y.delegate('mouseenter', this.mouseEnterHandler, this.get('context'), filter, this);
    Y.delegate('mouseenter', this.stopTimeout, this.get('boundingBox'), filter, this);
    Y.delegate('mouseleave', this.startTimeout, this.get('context'), filter, this);
    Y.delegate('mouseleave', this.startTimeout, this.get('boundingBox'), filter, this, 250);
    Y.on('mousemove', Y.bind(this.updateXY, this), 'div#doc');
    Y.on('click', Y.bind(this._hide, this));
  },
  /**
   * Detaches the events.
   *
   * @method detachEvents
   * @protected
   */
  detachEvents : function () {
    Y.detach('mouseenter', this.mouseEnterHandler);
    Y.detach('mouseenter', this.stopTimeout);
    Y.detach('mouseleave', this.startTimeout);
    Y.detach('mousemove', this.updateXY);
    Y.detach('click', this._hide);
  },
  /**
   * Initiallizes the tooltip.
   *
   * @method initializer
   * @protected
   */
  initializer : function () {
    this.plug(Y.star.Plugin.WidgetVisibleAnimPlugin);
    this.attachEvents();
    
    Y.Global.on('tooltip:refresh', this.refresh, this);
    Y.Global.on('tooltip:hide', this._hide, this);
  },
  /**
   * Handles the destruction of this object.
   *
   * @method destructor
   * @protected
   */
  destructor : function () {
    this.unplug(Y.star.Plugin.WidgetVisibleAnimPlugin);
    this.detachEvents();
  },
  /**
   * Starts the timer.
   *
   * @method startTimeout
   * @protected
   */
  startTimeout : function (time) {
    var t = parseInt(time, 10) || this.get('timeout');
    this.stopTimeout();
    this.timeout = setTimeout(Y.bind(this._hide, this), t);
  },
  /**
   * Hides this tooltip.
   */
  _hide : function () {
    this.stopTimeout();
    this.hide();
  },
  /**
   * Stops the timer.
   *
   * @method stopTimeout
   * @protected
   */
  stopTimeout : function () {
    // clears the timeout.
    if (this.timeout) {
      Y.log('stop timeout');
      clearTimeout(this.timeout);
    }
  },
  /**
   * Shows the tootips.
   * @param {Object} e
   */
  mouseEnterHandler : function (e) {
    Y.log('mouseenter');
    var node = e.currentTarget;
    // find title.
    var title = Tooltip.getTitle(node);
    // find title on parent element.
    if (!title || title.length === 0) {
      node = node.ancestor(function (n) {
        return !!Tooltip.getTitle(n);
      }, false, 'body');
      title = Tooltip.getTitle(node);
    }
    // no title
    if (!title || title.length === 0) {
      this.stopTimeout();
      this.hide();
      return;
    }
    // store elsewhere if located in title tag.
    if (node.get('title')) {
      node.set('title', '');
      node.setAttribute('data-title', title);
    }
    this.stopTimeout();
    this.updateXY(e);
    this.set('bodyContent', title);
    this.show();
  },
  /**
   * Updates the position on the page on mouse move.
   * @param {Object} e
   */
  updateXY : function (e) {
    // panel content box
    var boundingBox = this.get('boundingBox');
    // defines the default staring place for tooltip.
    var x = e.pageX + this.get('offsetX');
    // defines the default staring place for tooltip.
    var y = e.pageY + this.get('offsetY');
    // content box height
    var h = parseInt(boundingBox.getStyle('height'), 10);
    // content box width
    var w = parseInt(boundingBox.getStyle('width'), 10);
    var vp = boundingBox.get('viewportRegion');
    if (x > vp.right - w) {
      x = e.pageX - w - this.get('offsetX');
    }
    if (x < 10) {
      x = 10;
    }
    if (y > vp.bottom - h) {
      y = e.pageY - h - this.get('offsetY');
    }
    if (y < 10) {
      y = 10;
    }

    /*
     * changed from: this.set('x', x);
     * to: boundingBox.setStyle('left', x + 'px');
     * because of a bug in IE
     */
    boundingBox.setStyle('left', x + 'px');
    boundingBox.setStyle('top', y + 'px');
  }
},
/**
 * Static content.
 */
{
  /**
   * Gets the title.
   *
   * @param {Node} node
   * @protected
   */
  getTitle : function (node) {
    if (!node || !node.getDOMNode) {
      return null;
    }
    var title = node.get('title') || node.getAttribute('data-title');
    if (title.trim) {
      return title.trim();
    }
    return title;
  }
});
/**
 * Old way of calling the tooltips.
 *
 *@deprecated
 */
Y.star.Tooltip = Y.star.StarTooltip;
