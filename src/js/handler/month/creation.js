/**
 * @fileoverview Creation handler for month view
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var util = global.tui.util;

var config = require('../../config'),
    domutil = require('../../common/domutil'),
    core = require('./core');

/**
 * @constructor
 * @param {Drag} dragHandler - Drag handler instance.
 * @param {Month} monthView - Month view instance.
 * @param {Base} baseController - Base controller instance.
 */
function MonthCreation(dragHandler, monthView, baseController) {
    /**
     * @type {Drag}
     */
    this.dragHandler = dragHandler;

    /**
     * @type {Month}
     */
    this.monthView = monthView;

    /**
     * @type {Base}
     */
    this.baseController = baseController;

    /**
     * @type {function}
     */
    this.getDate = null;

    /**
     * Cache for dragging session
     * @type {object}
     */
    this._cache = null;

    dragHandler.on('dragStart', this._onDragStart, this);
}

/**
 * Destructor
 */
MonthCreation.prototype.destroy = function() {
    this.dragHandler.off(this);
    this.monthView = this.baseController = this.dragHandler = null;
};

/**
 * Fire before create event
 * @fires {MonthCreation#beforeCreateEvent}
 * @param {object} eventCache - cache data from single dragging session
 */
MonthCreation.prototype._createEvent = function(eventCache) {
    /**
     * @event {MonthCreation#beforeCreateEvent}
     * @type {object}
     * @property {boolean} isAllDay - whether creating event is allday?
     * @property {Date} starts - select start date
     * @property {Date] ends - select end date
     */
    this.fire('beforeCreateEvent', {
        isAllDay: true,
        starts: eventCache.starts,
        ends: eventCache.ends
    });
};

/**
 * DragStart event handler
 * @fires {MonthCreation#month_creation_dragstart}
 * @param {object} dragStartEvent - dragStart event data
 */
MonthCreation.prototype._onDragStart = function(dragStartEvent) {
    var target = dragStartEvent.target,
        eventData;

    if (!domutil.hasClass(target, config.classname('weekday-events'))) {
        return;
    }

    this.dragHandler.on({
        drag: this._onDrag,
        dragEnd: this._onDragEnd
    }, this);

    this.getDate = core(this.monthView);

    eventData = this.getDate(dragStartEvent.originEvent);

    this._cache = {
        starts: new Date(+eventData.date)
    };

    /**
     * @event {MonthCreation#month_creation_dragstart}
     * @type {object}
     * @property {number} x - x index
     * @property {number} y - y index
     * @property {Date} date - drag date
     */
    this.fire('month_creation_dragstart', eventData);
};

/**
 * Drag event handler
 * @fires {MonthCreation#month_creation_drag}
 * @param {object} dragEvent - drag event data
 */
MonthCreation.prototype._onDrag = function(dragEvent) {
    var eventData;

    if (!this.getDate) {
        return;
    }

    eventData = this.getDate(dragEvent.originEvent);
    
    /**
     * @event {MonthCreation#month_creation_drag}
     * @type {object}
     * @property {number} x - x index
     * @property {number} y - y index
     * @property {Date} date - drag date
     */
    this.fire('month_creation_drag', eventData);
};

/**
 * DragEnd event handler
 * @fires {MonthCreation#month_creation_dragend}
 * @param {object} dragEndEvent - drag end event data
 */
MonthCreation.prototype._onDragEnd = function(dragEndEvent) {
    var cache = this._cache,
        eventData;

    this.dragHandler.off({
        drag: this._onDrag,
        dragEnd: this._onDragEnd
    }, this);

    if (!this.getDate) {
        return;
    }

    eventData = this.getDate(dragEndEvent.originEvent);

    cache.ends = new Date(+eventData.date);

    this._createEvent(cache);

    /**
     * @event {MonthCreation#month_creation_dragend}
     * @type {object}
     * @property {number} x - x index
     * @property {number} y - y index
     * @property {Date} date - drag date
     */
    this.fire('month_creation_dragend', eventData);

    this.getDateByMouseEvent = null;

    this._cache = null;
};

util.CustomEvents.mixin(MonthCreation);

module.exports = MonthCreation;
