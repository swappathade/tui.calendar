/**
 * @fileoverview Move handler for Allday view.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var util = global.ne.util;
var common = require('../../common/common');
var domutil = require('../../common/domutil');
var AlldayCore = require('./core');
var AlldayMoveGuide = require('./moveGuide');

var checkExpectedConditionIDRx = /^schedule-view-allday-event(-title)?$/;
var parseViewIDRx = /^schedule-view-allday-monthweek[\s]schedule-view-(\d+)/;

/**
 * @constructor
 * @implements {Handler}
 * @mixes AlldayCore
 * @mixes CustomEvents
 * @param {Drag} [dragHandler] - Drag handler instance.
 * @param {Allday} [alldayView] - MonthWeek view instance.
 * @param {Base} [baseController] - Base controller instance.
 */
function AlldayMove(dragHandler, alldayView, baseController) {
    /**
     * Drag handler instance.
     * @type {Drag}
     */
    this.dragHandler = dragHandler;

    /**
     * allday view instance.
     * @type {Allday}
     */
    this.alldayView = alldayView;

    /**
     * Base controller instance.
     * @type {Base}
     */
    this.baseController = baseController;

    /**
     * @type {number}
     */
    this._dragStartXIndex = null;

    dragHandler.on({
        dragStart: this._onDragStart
    }, this);

    /**
     * @type {AlldayMoveGuide}
     */
    this.guide = new AlldayMoveGuide(this);
}

/**
 * Check dragstart target is expected conditions for this handler.
 * @param {HTMLElement} target - dragstart event handler's target element.
 * @returns {boolean|MonthWeek} return MonthWeek view instance when satiate condition.
 */
AlldayMove.prototype.checkExpectedCondition = function(target) {
    var cssClass = domutil.getClass(target),
        parentView,
        matches;

    if (!checkExpectedConditionIDRx.test(cssClass)) {
        return false;
    }

    parentView = domutil.closest(target, '.schedule-view-allday-monthweek');

    if (!parentView) {
        return false;
    }

    cssClass = domutil.getClass(parentView);
    matches = cssClass.match(parseViewIDRx);

    if (!matches || matches.length < 2) {
        return false;
    }

    return util.pick(this.alldayView.childs.items, matches[1]);
};

/**
 * DragStart event handler method.
 * @emits AlldayMove#allday_move_dragstart
 * @param {object} dragStartEventData - Drag#dragStart event handler event data.
 */
AlldayMove.prototype._onDragStart = function(dragStartEventData) {
    var target = dragStartEventData.target,
        result = this.checkExpectedCondition(target),
        controller = this.baseController,
        eventBlockElement,
        modelID,
        targetModel,
        getEventDataFunc,
        eventData;

    if (!result) {
        return;
    }

    eventBlockElement = domutil.closest(target, '.schedule-view-allday-event-block');
    modelID = domutil.getData(eventBlockElement, 'id');
    targetModel = controller.events.items[modelID];

    if (!targetModel) {
        return;
    }

    getEventDataFunc = this.getEventDataFunc = this._retriveEventData(this.alldayView);
    eventData = getEventDataFunc(dragStartEventData.originEvent);
    this._dragStartXIndex = eventData.xIndex;

    util.extend(eventData, {
        eventBlockElement: eventBlockElement,
        model: targetModel
    });

    this.dragHandler.on({
        drag: this._onDrag,
        dragEnd: this._onDragEnd,
        click: this._onClick
    }, this);

    /**
     * @event AlldayMove#allday_move_dragstart
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     * @property {Event} model - data object of model isntance.
     * @property {HTMLDivElement} eventBlockElement - target event block element.
     */
    this.fire('allday_move_dragstart', eventData);
};


/**
 * Drag event handler method.
 * @emits AlldayMove#allday_move_drag
 * @param {object} dragEventData - Drag#drag event handler eventdata.
 */
AlldayMove.prototype._onDrag = function(dragEventData) {
    var getEventDataFunc = this.getEventDataFunc;

    if (!getEventDataFunc) {
        return;
    }

    /**
     * @event AlldayMove#allday_move_drag
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     */
    this.fire('allday_move_drag', getEventDataFunc(dragEventData.originEvent));
};

/**
 * DragEnd event hander method.
 * @emits AlldayMove#allday_move_dragend
 * @param {object} dragEndEventData - Drag#DragEnd event handler data.
 * @param {string} [overrideEventName] - override emitted event name when supplied.
 */
AlldayMove.prototype._onDragEnd = function(dragEndEventData, overrideEventName) {
    var getEventDataFunc = this.getEventDataFunc;

    if (!getEventDataFunc) {
        return;
    }

    this.dragHandler.off({
        drag: this._onDrag,
        dragEnd: this._onDragEnd,
        click: this._onClick
    }, this);

    /**
     * @event AlldayMove#allday_move_dragend
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     */
    this.fire(overrideEventName || 'allday_move_dragend', getEventDataFunc(dragEndEventData.originEvent));

    this.getEventDataFunc = this._dragStartXIndex = null;
};

/**
 * Click event handler method.
 * @emits AlldayMove#allday_move_click
 * @param {object} clickEventData - Drag#Click event handler data.
 */
AlldayMove.prototype._onClick = function(clickEventData) {
    /**
     * @event AlldayMove#allday_move_click
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     */
    this._onDragEnd(clickEventData, 'allday_move_click');
};

common.mixin(AlldayCore, AlldayMove);
util.CustomEvents.mixin(AlldayMove);

module.exports = AlldayMove;
