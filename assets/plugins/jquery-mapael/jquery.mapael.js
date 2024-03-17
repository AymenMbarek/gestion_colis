/*!
 *
 * Jquery Mapael - Dynamic maps jQuery plugin (based on raphael.js)
 * Requires jQuery, raphael.js and jquery.mousewheel
 *
 * Version: 2.2.0
 *
 * Copyright (c) 2017 Vincent Brouté (https://www.vincentbroute.fr/mapael)
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
 *
 * Thanks to Indigo744
 *
 */
(function (factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('jquery'), require('raphael'), require('jquery-mousewheel'));
    } else if (typeof define === 'function' && define.amd) {
        define(['jquery', 'raphael', 'mousewheel'], factory);
    } else {
        factory(jQuery, Raphael, jQuery.fn.mousewheel);
    }
}(function ($, Raphael, mousewheel, undefined) {

    "use strict";
    var pluginName = "mapael";
    var version = "2.2.0";

    /*
     * Mapael constructor
     * Init instance vars and call init()
     * @param container the DOM element on which to apply the plugin
     * @param options the complete options to use
     */
    var Mapael = function (container, options) {
        var self = this;
        self.container = container;
        self.$container = $(container);
        self.options = self.extendDefaultOptions(options);
        self.zoomTO = 0;
        self.zoomCenterX = 0;
        self.zoomCenterY = 0;
        self.previousPinchDist = 0;
        self.zoomData = {
            zoomLevel: 0,
            zoomX: 0,
            zoomY: 0,
            panX: 0,
            panY: 0
        };

        self.currentViewBox = {
            x: 0, y: 0, w: 0, h: 0
        };
        self.panning = false;
        self.zoomAnimID = null;
        self.zoomAnimStartTime = null;
        self.zoomAnimCVBTarget = null;
        self.$map = $("." + self.options.map.cssClass, self.container);
        self.initialMapHTMLContent = self.$map.html();
        self.$tooltip = {};
        self.paper = {};
        self.areas = {};
        self.plots = {};
        self.links = {};
        self.legends = {};
        self.mapConf = {};
        self.customEventHandlers = {};
        self.init();
    };

    /*
     * Mapael Prototype
     * Defines all methods and properties needed by Mapael
     * Each mapael object inherits their properties and methods from this prototype
     */
    Mapael.prototype = {

        /* Filtering TimeOut value in ms
         * Used for mouseover trigger over elements */
        MouseOverFilteringTO: 120,
        /* Filtering TimeOut value in ms
         * Used for afterPanning trigger when panning */
        panningFilteringTO: 150,
        /* Filtering TimeOut value in ms
         * Used for mouseup/touchend trigger when panning */
        panningEndFilteringTO: 50,
        /* Filtering TimeOut value in ms
         * Used for afterZoom trigger when zooming */
        zoomFilteringTO: 150,
        /* Filtering TimeOut value in ms
         * Used for when resizing window */
        resizeFilteringTO: 150,

        /*
         * Initialize the plugin
         * Called by the constructor
         */
        init: function () {
            var self = this;
            if (self.options.map.cssClass === "" || $("." + self.options.map.cssClass, self.container).length === 0) {
                throw new Error("The map class `" + self.options.map.cssClass + "` doesn't exists");
            }
            self.$tooltip = $("<div>").addClass(self.options.map.tooltip.cssClass).css("display", "none");
            self.$map.empty().append(self.$tooltip);
            if ($[pluginName] && $[pluginName].maps && $[pluginName].maps[self.options.map.name]) {
                self.mapConf = $[pluginName].maps[self.options.map.name];
            } else if ($.fn[pluginName] && $.fn[pluginName].maps && $.fn[pluginName].maps[self.options.map.name]) {
                self.mapConf = $.fn[pluginName].maps[self.options.map.name];
                if (window.console && window.console.warn) {
                    window.console.warn("Extending $.fn.mapael is deprecated (map '" + self.options.map.name + "')");
                }
            } else {
                throw new Error("Unknown map '" + self.options.map.name + "'");
            }
            self.paper = new Raphael(self.$map[0], self.mapConf.width, self.mapConf.height);
            if (self.isRaphaelBBoxBugPresent() === true) {
                self.destroy();
                throw new Error("Can't get boundary box for text (is your container hidden? See #135)");
            }
            self.$container.addClass(pluginName);

            if (self.options.map.tooltip.css) self.$tooltip.css(self.options.map.tooltip.css);
            self.setViewBox(0, 0, self.mapConf.width, self.mapConf.height);
            if (self.options.map.width) {
                self.paper.setSize(self.options.map.width, self.mapConf.height * (self.options.map.width / self.mapConf.width));
            } else {
                self.initResponsiveSize();
            }
            $.each(self.mapConf.elems, function (id) {
                self.areas[id] = {};
                self.areas[id].options = self.getElemOptions(
                    self.options.map.defaultArea,
                    (self.options.areas[id] ? self.options.areas[id] : {}),
                    self.options.legend.area
                );
                self.areas[id].mapElem = self.paper.path(self.mapConf.elems[id]);
            });
            if (self.options.map.beforeInit) self.options.map.beforeInit(self.$container, self.paper, self.options);
            $.each(self.mapConf.elems, function (id) {
                self.initElem(id, 'area', self.areas[id]);
            });
            self.links = self.drawLinksCollection(self.options.links);
            $.each(self.options.plots, function (id) {
                self.plots[id] = self.drawPlot(id);
            });
            self.$container.on("zoom." + pluginName, function (e, zoomOptions) {
                self.onZoomEvent(e, zoomOptions);
            });

            if (self.options.map.zoom.enabled) {
                self.initZoom(self.mapConf.width, self.mapConf.height, self.options.map.zoom);
            }
            if (self.options.map.zoom.init !== undefined) {
                if (self.options.map.zoom.init.animDuration === undefined) {
                    self.options.map.zoom.init.animDuration = 0;
                }
                self.$container.trigger("zoom", self.options.map.zoom.init);
            }
            self.createLegends("area", self.areas, 1);
            self.createLegends("plot", self.plots, self.paper.width / self.mapConf.width);
            self.$container.on("update." + pluginName, function (e, opt) {
                self.onUpdateEvent(e, opt);
            });
            self.$container.on("showElementsInRange." + pluginName, function (e, opt) {
                self.onShowElementsInRange(e, opt);
            });
            self.initDelegatedMapEvents();
            self.initDelegatedCustomEvents();
            if (self.options.map.afterInit) self.options.map.afterInit(self.$container, self.paper, self.areas, self.plots, self.options);

            $(self.paper.desc).append(" and Mapael " + self.version + " (https://www.vincentbroute.fr/mapael/)");
        },

        /*
         * Destroy mapael
         * This function effectively detach mapael from the container
         *   - Set the container back to the way it was before mapael instanciation
         *   - Remove all data associated to it (memory can then be free'ed by browser)
         *
         * This method can be call directly by user:
         *     $(".mapcontainer").data("mapael").destroy();
         *
         * This method is also automatically called if the user try to call mapael
         * on a container already containing a mapael instance
         */
        destroy: function () {
            var self = this;
            self.$container.off("." + pluginName);
            self.$map.off("." + pluginName);
            if (self.onResizeEvent) $(window).off("resize." + pluginName, self.onResizeEvent);
            self.$map.empty();
            self.$map.html(self.initialMapHTMLContent);
            $.each(self.legends, function(legendType) {
                $.each(self.legends[legendType], function(legendIndex) {
                    var legend = self.legends[legendType][legendIndex];
                    legend.container.empty();
                    legend.container.html(legend.initialHTMLContent);
                });
            });
            self.$container.removeClass(pluginName);
            self.$container.removeData(pluginName);
            self.container = undefined;
            self.$container = undefined;
            self.options = undefined;
            self.paper = undefined;
            self.$map = undefined;
            self.$tooltip = undefined;
            self.mapConf = undefined;
            self.areas = undefined;
            self.plots = undefined;
            self.links = undefined;
            self.customEventHandlers = undefined;
        },

        initResponsiveSize: function () {
            var self = this;
            var resizeTO = null;
            var handleResize = function(isInit) {
                var containerWidth = self.$map.width();

                if (self.paper.width !== containerWidth) {
                    var newScale = containerWidth / self.mapConf.width;
                    self.paper.setSize(containerWidth, self.mapConf.height * newScale);
                    if (isInit !== true && self.options.legend.redrawOnResize) {
                        self.createLegends("plot", self.plots, newScale);
                    }
                }
            };

            self.onResizeEvent = function() {
                clearTimeout(resizeTO);
                resizeTO = setTimeout(function () {
                    handleResize();
                }, self.resizeFilteringTO);
            };
            $(window).on("resize." + pluginName, self.onResizeEvent);
            handleResize(true);
        },

        /*
         * Extend the user option with the default one
         * @param options the user options
         * @return new options object
         */
        extendDefaultOptions: function (options) {
            options = $.extend(true, {}, Mapael.prototype.defaultOptions, options);
            $.each(['area', 'plot'], function (key, type) {
                if ($.isArray(options.legend[type])) {
                    for (var i = 0; i < options.legend[type].length; ++i)
                        options.legend[type][i] = $.extend(true, {}, Mapael.prototype.legendDefaultOptions[type], options.legend[type][i]);
                } else {
                    options.legend[type] = $.extend(true, {}, Mapael.prototype.legendDefaultOptions[type], options.legend[type]);
                }
            });

            return options;
        },

        /*
         * Init all delegated events for the whole map:
         *  mouseover
         *  mousemove
         *  mouseout
         */
        initDelegatedMapEvents: function() {
            var self = this;
            var dataTypeToElementMapping = {
                'area'  : self.areas,
                'area-text' : self.areas,
                'plot' : self.plots,
                'plot-text' : self.plots,
                'link' : self.links,
                'link-text' : self.links
            };

            /* Attach mouseover event delegation
             * Note: we filter the event with a timeout to reduce the firing when the mouse moves quickly
             */
            var mapMouseOverTimeoutID;
            self.$container.on("mouseover." + pluginName, "[data-id]", function () {
                var elem = this;
                clearTimeout(mapMouseOverTimeoutID);
                mapMouseOverTimeoutID = setTimeout(function() {
                    var $elem = $(elem);
                    var id = $elem.attr('data-id');
                    var type = $elem.attr('data-type');

                    if (dataTypeToElementMapping[type] !== undefined) {
                        self.elemEnter(dataTypeToElementMapping[type][id]);
                    } else if (type === 'legend-elem' || type === 'legend-label') {
                        var legendIndex = $elem.attr('data-legend-id');
                        var legendType = $elem.attr('data-legend-type');
                        self.elemEnter(self.legends[legendType][legendIndex].elems[id]);
                    }
                }, self.MouseOverFilteringTO);
            });

            /* Attach mousemove event delegation
             * Note: timeout filtering is small to update the Tooltip position fast
             */
            var mapMouseMoveTimeoutID;
            self.$container.on("mousemove." + pluginName, "[data-id]", function (event) {
                var elem = this;
                clearTimeout(mapMouseMoveTimeoutID);
                mapMouseMoveTimeoutID = setTimeout(function() {
                    var $elem = $(elem);
                    var id = $elem.attr('data-id');
                    var type = $elem.attr('data-type');

                    if (dataTypeToElementMapping[type] !== undefined) {
                        self.elemHover(dataTypeToElementMapping[type][id], event);
                    } else if (type === 'legend-elem' || type === 'legend-label') {
                        /* Nothing to do */
                    }

                }, 0);
            });

            /* Attach mouseout event delegation
             * Note: we don't perform any timeout filtering to clear & reset elem ASAP
             * Otherwise an element may be stuck in 'hover' state (which is NOT good)
             */
            self.$container.on("mouseout." + pluginName, "[data-id]", function () {
                var elem = this;
                clearTimeout(mapMouseOverTimeoutID);
                clearTimeout(mapMouseMoveTimeoutID);
                var $elem = $(elem);
                var id = $elem.attr('data-id');
                var type = $elem.attr('data-type');

                if (dataTypeToElementMapping[type] !== undefined) {
                    self.elemOut(dataTypeToElementMapping[type][id]);
                } else if (type === 'legend-elem' || type === 'legend-label') {
                    var legendIndex = $elem.attr('data-legend-id');
                    var legendType = $elem.attr('data-legend-type');
                    self.elemOut(self.legends[legendType][legendIndex].elems[id]);
                }
            });

            /* Attach click event delegation
             * Note: we filter the event with a timeout to avoid double click
             */
            self.$container.on("click." + pluginName, "[data-id]", function (evt, opts) {
                var $elem = $(this);
                var id = $elem.attr('data-id');
                var type = $elem.attr('data-type');

                if (dataTypeToElementMapping[type] !== undefined) {
                    self.elemClick(dataTypeToElementMapping[type][id]);
                } else if (type === 'legend-elem' || type === 'legend-label') {
                    var legendIndex = $elem.attr('data-legend-id');
                    var legendType = $elem.attr('data-legend-type');
                    self.handleClickOnLegendElem(self.legends[legendType][legendIndex].elems[id], id, legendIndex, legendType, opts);
                }
            });
        },

        /*
         * Init all delegated custom events
         */
        initDelegatedCustomEvents: function() {
            var self = this;

            $.each(self.customEventHandlers, function(eventName) {
                var fullEventName = eventName + '.' + pluginName + ".custom";
                self.$container.off(fullEventName).on(fullEventName, "[data-id]", function (e) {
                    var $elem = $(this);
                    var id = $elem.attr('data-id');
                    var type = $elem.attr('data-type').replace('-text', '');

                    if (!self.panning &&
                        self.customEventHandlers[eventName][type] !== undefined &&
                        self.customEventHandlers[eventName][type][id] !== undefined)
                    {
                        var elem = self.customEventHandlers[eventName][type][id];
                        elem.options.eventHandlers[eventName](e, id, elem.mapElem, elem.textElem, elem.options);
                    }
                });
            });

        },

        /*
         * Init the element "elem" on the map (drawing text, setting attributes, events, tooltip, ...)
         *
         * @param id the id of the element
         * @param type the type of the element (area, plot, link)
         * @param elem object the element object (with mapElem), it will be updated
         */
        initElem: function (id, type, elem) {
            var self = this;
            var $mapElem = $(elem.mapElem.node);
            if (elem.options.href) {
                elem.options.attrs.cursor = "pointer";
                if (elem.options.text) elem.options.text.attrs.cursor = "pointer";
            }
            elem.mapElem.attr(elem.options.attrs);
            $mapElem.attr({
                "data-id": id,
                "data-type": type
            });
            if (elem.options.cssClass !== undefined) {
                $mapElem.addClass(elem.options.cssClass);
            }
            if (elem.options.text && elem.options.text.content !== undefined) {
                var textPosition = self.getTextPosition(elem.mapElem.getBBox(), elem.options.text.position, elem.options.text.margin);
                elem.options.text.attrs.text = elem.options.text.content;
                elem.options.text.attrs.x = textPosition.x;
                elem.options.text.attrs.y = textPosition.y;
                elem.options.text.attrs['text-anchor'] = textPosition.textAnchor;
                elem.textElem = self.paper.text(textPosition.x, textPosition.y, elem.options.text.content);
                elem.textElem.attr(elem.options.text.attrs);
                $(elem.textElem.node).attr({
                    "data-id": id,
                    "data-type": type + '-text'
                });
            }
            if (elem.options.eventHandlers) self.setEventHandlers(id, type, elem);
            self.setHoverOptions(elem.mapElem, elem.options.attrs, elem.options.attrsHover);
            if (elem.textElem) self.setHoverOptions(elem.textElem, elem.options.text.attrs, elem.options.text.attrsHover);
        },

        /*
         * Init zoom and panning for the map
         * @param mapWidth
         * @param mapHeight
         * @param zoomOptions
         */
        initZoom: function (mapWidth, mapHeight, zoomOptions) {
            var self = this;
            var mousedown = false;
            var previousX = 0;
            var previousY = 0;
            var fnZoomButtons = {
                "reset": function () {
                    self.$container.trigger("zoom", {"level": 0});
                },
                "in": function () {
                    self.$container.trigger("zoom", {"level": "+1"});
                },
                "out": function () {
                    self.$container.trigger("zoom", {"level": -1});
                }
            };
            $.extend(self.zoomData, {
                zoomLevel: 0,
                panX: 0,
                panY: 0
            });
            $.each(zoomOptions.buttons, function(type, opt) {
                if (fnZoomButtons[type] === undefined) throw new Error("Unknown zoom button '" + type + "'");
                var $button = $("<div>").addClass(opt.cssClass)
                    .html(opt.content)
                    .attr("title", opt.title);
                $button.on("click." + pluginName, fnZoomButtons[type]);
                self.$map.append($button);
            });
            if (self.options.map.zoom.mousewheel) {
                self.$map.on("mousewheel." + pluginName, function (e) {
                    var zoomLevel = (e.deltaY > 0) ? 1 : -1;
                    var coord = self.mapPagePositionToXY(e.pageX, e.pageY);

                    self.$container.trigger("zoom", {
                        "fixedCenter": true,
                        "level": self.zoomData.zoomLevel + zoomLevel,
                        "x": coord.x,
                        "y": coord.y
                    });

                    e.preventDefault();
                });
            }
            if (self.options.map.zoom.touch) {
                self.$map.on("touchstart." + pluginName, function (e) {
                    if (e.originalEvent.touches.length === 2) {
                        self.zoomCenterX = (e.originalEvent.touches[0].pageX + e.originalEvent.touches[1].pageX) / 2;
                        self.zoomCenterY = (e.originalEvent.touches[0].pageY + e.originalEvent.touches[1].pageY) / 2;
                        self.previousPinchDist = Math.sqrt(Math.pow((e.originalEvent.touches[1].pageX - e.originalEvent.touches[0].pageX), 2) + Math.pow((e.originalEvent.touches[1].pageY - e.originalEvent.touches[0].pageY), 2));
                    }
                });

                self.$map.on("touchmove." + pluginName, function (e) {
                    var pinchDist = 0;
                    var zoomLevel = 0;

                    if (e.originalEvent.touches.length === 2) {
                        pinchDist = Math.sqrt(Math.pow((e.originalEvent.touches[1].pageX - e.originalEvent.touches[0].pageX), 2) + Math.pow((e.originalEvent.touches[1].pageY - e.originalEvent.touches[0].pageY), 2));

                        if (Math.abs(pinchDist - self.previousPinchDist) > 15) {
                            var coord = self.mapPagePositionToXY(self.zoomCenterX, self.zoomCenterY);
                            zoomLevel = (pinchDist - self.previousPinchDist) / Math.abs(pinchDist - self.previousPinchDist);
                            self.$container.trigger("zoom", {
                                "fixedCenter": true,
                                "level": self.zoomData.zoomLevel + zoomLevel,
                                "x": coord.x,
                                "y": coord.y
                            });
                            self.previousPinchDist = pinchDist;
                        }
                        return false;
                    }
                });
            }
            self.$map.on("dragstart", function() {
                return false;
            });
            var panningMouseUpTO = null;
            var panningMouseMoveTO = null;
            $("body").on("mouseup." + pluginName + (zoomOptions.touch ? " touchend." + pluginName : ""), function () {
                mousedown = false;
                clearTimeout(panningMouseUpTO);
                clearTimeout(panningMouseMoveTO);
                panningMouseUpTO = setTimeout(function () {
                    self.panning = false;
                }, self.panningEndFilteringTO);
            });

            self.$map.on("mousedown." + pluginName + (zoomOptions.touch ? " touchstart." + pluginName : ""), function (e) {
                clearTimeout(panningMouseUpTO);
                clearTimeout(panningMouseMoveTO);
                if (e.pageX !== undefined) {
                    mousedown = true;
                    previousX = e.pageX;
                    previousY = e.pageY;
                } else {
                    if (e.originalEvent.touches.length === 1) {
                        mousedown = true;
                        previousX = e.originalEvent.touches[0].pageX;
                        previousY = e.originalEvent.touches[0].pageY;
                    }
                }
            }).on("mousemove." + pluginName + (zoomOptions.touch ? " touchmove." + pluginName : ""), function (e) {
                var currentLevel = self.zoomData.zoomLevel;
                var pageX = 0;
                var pageY = 0;

                clearTimeout(panningMouseUpTO);
                clearTimeout(panningMouseMoveTO);

                if (e.pageX !== undefined) {
                    pageX = e.pageX;
                    pageY = e.pageY;
                } else {
                    if (e.originalEvent.touches.length === 1) {
                        pageX = e.originalEvent.touches[0].pageX;
                        pageY = e.originalEvent.touches[0].pageY;
                    } else {
                        mousedown = false;
                    }
                }

                if (mousedown && currentLevel !== 0) {
                    var offsetX = (previousX - pageX) / (1 + (currentLevel * zoomOptions.step)) * (mapWidth / self.paper.width);
                    var offsetY = (previousY - pageY) / (1 + (currentLevel * zoomOptions.step)) * (mapHeight / self.paper.height);
                    var panX = Math.min(Math.max(0, self.currentViewBox.x + offsetX), (mapWidth - self.currentViewBox.w));
                    var panY = Math.min(Math.max(0, self.currentViewBox.y + offsetY), (mapHeight - self.currentViewBox.h));

                    if (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5) {
                        $.extend(self.zoomData, {
                            panX: panX,
                            panY: panY,
                            zoomX: panX + self.currentViewBox.w / 2,
                            zoomY: panY + self.currentViewBox.h / 2
                        });
                        self.setViewBox(panX, panY, self.currentViewBox.w, self.currentViewBox.h);

                        panningMouseMoveTO = setTimeout(function () {
                            self.$map.trigger("afterPanning", {
                                x1: panX,
                                y1: panY,
                                x2: (panX + self.currentViewBox.w),
                                y2: (panY + self.currentViewBox.h)
                            });
                        }, self.panningFilteringTO);

                        previousX = pageX;
                        previousY = pageY;
                        self.panning = true;
                    }
                    return false;
                }
            });
        },

        /*
         * Map a mouse position to a map position
         *      Transformation principle:
         *          ** start with (pageX, pageY) absolute mouse coordinate
         *          - Apply translation: take into accounts the map offset in the page
         *          ** from this point, we have relative mouse coordinate
         *          - Apply homothetic transformation: take into accounts initial factor of map sizing (fullWidth / actualWidth)
         *          - Apply homothetic transformation: take into accounts the zoom factor
         *          ** from this point, we have relative map coordinate
         *          - Apply translation: take into accounts the current panning of the map
         *          ** from this point, we have absolute map coordinate
         * @param pageX: mouse client coordinate on X
         * @param pageY: mouse client coordinate on Y
         * @return map coordinate {x, y}
         */
        mapPagePositionToXY: function(pageX, pageY) {
            var self = this;
            var offset = self.$map.offset();
            var initFactor = (self.options.map.width) ? (self.mapConf.width / self.options.map.width) : (self.mapConf.width / self.$map.width());
            var zoomFactor = 1 / (1 + (self.zoomData.zoomLevel * self.options.map.zoom.step));
            return {
                x: (zoomFactor * initFactor * (pageX - offset.left)) + self.zoomData.panX,
                y: (zoomFactor * initFactor * (pageY - offset.top)) + self.zoomData.panY
            };
        },

        /*
         * Zoom on the map
         *
         * zoomOptions.animDuration zoom duration
         *
         * zoomOptions.level        level of the zoom between minLevel and maxLevel (absolute number, or relative string +1 or -1)
         * zoomOptions.fixedCenter  set to true in order to preserve the position of x,y in the canvas when zoomed
         *
         * zoomOptions.x            x coordinate of the point to focus on
         * zoomOptions.y            y coordinate of the point to focus on
         * - OR -
         * zoomOptions.latitude     latitude of the point to focus on
         * zoomOptions.longitude    longitude of the point to focus on
         * - OR -
         * zoomOptions.plot         plot ID to focus on
         * - OR -
         * zoomOptions.area         area ID to focus on
         * zoomOptions.areaMargin   margin (in pixels) around the area
         *
         * If an area ID is specified, the algorithm will override the zoom level to focus on the area
         * but it may be limited by the min/max zoom level limits set at initialization.
         *
         * If no coordinates are specified, the zoom will be focused on the center of the current view box
         *
         */
        onZoomEvent: function (e, zoomOptions) {
            var self = this;
            var panX;
            var panY;
            var panWidth;
            var panHeight;
            var zoomLevel = self.zoomData.zoomLevel;
            var previousRelativeZoomLevel = 1 + self.zoomData.zoomLevel * self.options.map.zoom.step;
            var relativeZoomLevel;

            var animDuration = (zoomOptions.animDuration !== undefined) ? zoomOptions.animDuration : self.options.map.zoom.animDuration;

            if (zoomOptions.area !== undefined) {
                /* An area is given
                 * We will define x/y coordinate AND a new zoom level to fill the area
                 */
                if (self.areas[zoomOptions.area] === undefined) throw new Error("Unknown area '" + zoomOptions.area + "'");
                var areaMargin = (zoomOptions.areaMargin !== undefined) ? zoomOptions.areaMargin : 10;
                var areaBBox = self.areas[zoomOptions.area].mapElem.getBBox();
                var areaFullWidth = areaBBox.width + 2 * areaMargin;
                var areaFullHeight = areaBBox.height + 2 * areaMargin;
                zoomOptions.x = areaBBox.cx;
                zoomOptions.y = areaBBox.cy;
                zoomLevel = Math.min(Math.floor((self.mapConf.width / areaFullWidth - 1) / self.options.map.zoom.step),
                                     Math.floor((self.mapConf.height / areaFullHeight - 1) / self.options.map.zoom.step));

            } else {
                if (zoomOptions.level !== undefined) {
                    if (typeof zoomOptions.level === "string") {
                        if ((zoomOptions.level.slice(0, 1) === '+') || (zoomOptions.level.slice(0, 1) === '-')) {
                            zoomLevel = self.zoomData.zoomLevel + parseInt(zoomOptions.level, 10);
                        } else {
                            zoomLevel = parseInt(zoomOptions.level, 10);
                        }
                    } else {
                        if (zoomOptions.level < 0) {
                            zoomLevel = self.zoomData.zoomLevel + zoomOptions.level;
                        } else {
                            zoomLevel = zoomOptions.level;
                        }
                    }
                }

                if (zoomOptions.plot !== undefined) {
                    if (self.plots[zoomOptions.plot] === undefined) throw new Error("Unknown plot '" + zoomOptions.plot + "'");

                    zoomOptions.x = self.plots[zoomOptions.plot].coords.x;
                    zoomOptions.y = self.plots[zoomOptions.plot].coords.y;
                } else {
                    if (zoomOptions.latitude !== undefined && zoomOptions.longitude !== undefined) {
                        var coords = self.mapConf.getCoords(zoomOptions.latitude, zoomOptions.longitude);
                        zoomOptions.x = coords.x;
                        zoomOptions.y = coords.y;
                    }

                    if (zoomOptions.x === undefined) {
                        zoomOptions.x = self.currentViewBox.x + self.currentViewBox.w / 2;
                    }

                    if (zoomOptions.y === undefined) {
                        zoomOptions.y = self.currentViewBox.y + self.currentViewBox.h / 2;
                    }
                }
            }
            zoomLevel = Math.min(Math.max(zoomLevel, self.options.map.zoom.minLevel), self.options.map.zoom.maxLevel);
            relativeZoomLevel = 1 + zoomLevel * self.options.map.zoom.step;
            panWidth = self.mapConf.width / relativeZoomLevel;
            panHeight = self.mapConf.height / relativeZoomLevel;

            if (zoomLevel === 0) {
                panX = 0;
                panY = 0;
            } else {
                if (zoomOptions.fixedCenter !== undefined && zoomOptions.fixedCenter === true) {
                    panX = self.zoomData.panX + ((zoomOptions.x - self.zoomData.panX) * (relativeZoomLevel - previousRelativeZoomLevel)) / relativeZoomLevel;
                    panY = self.zoomData.panY + ((zoomOptions.y - self.zoomData.panY) * (relativeZoomLevel - previousRelativeZoomLevel)) / relativeZoomLevel;
                } else {
                    panX = zoomOptions.x - panWidth / 2;
                    panY = zoomOptions.y - panHeight / 2;
                }
                panX = Math.min(Math.max(0, panX), self.mapConf.width - panWidth);
                panY = Math.min(Math.max(0, panY), self.mapConf.height - panHeight);
            }
            if (relativeZoomLevel === previousRelativeZoomLevel && panX === self.zoomData.panX && panY === self.zoomData.panY) return;

            if (animDuration > 0) {
                self.animateViewBox(panX, panY, panWidth, panHeight, animDuration, self.options.map.zoom.animEasing);
            } else {
                self.setViewBox(panX, panY, panWidth, panHeight);
                clearTimeout(self.zoomTO);
                self.zoomTO = setTimeout(function () {
                    self.$map.trigger("afterZoom", {
                        x1: panX,
                        y1: panY,
                        x2: panX + panWidth,
                        y2: panY + panHeight
                    });
                }, self.zoomFilteringTO);
            }

            $.extend(self.zoomData, {
                zoomLevel: zoomLevel,
                panX: panX,
                panY: panY,
                zoomX: panX + panWidth / 2,
                zoomY: panY + panHeight / 2
            });
        },

        /*
         * Show some element in range defined by user
         * Triggered by user $(".mapcontainer").trigger("showElementsInRange", [opt]);
         *
         * @param opt the options
         *  opt.hiddenOpacity opacity for hidden element (default = 0.3)
         *  opt.animDuration animation duration in ms (default = 0)
         *  opt.afterShowRange callback
         *  opt.ranges the range to show:
         *  Example:
         *  opt.ranges = {
         *      'plot' : {
         *          0 : {
         *              'min': 1000,
         *              'max': 1200
         *          },
         *          1 : {
         *              'min': 10,
         *              'max': 12
         *          }
         *      },
         *      'area' : {
         *          {'min': 10, 'max': 20}
         *      }
         *  }
         */
        onShowElementsInRange: function(e, opt) {
            var self = this;
            if (opt.animDuration === undefined) {
                opt.animDuration = 0;
            }
            if (opt.hiddenOpacity === undefined) {
                opt.hiddenOpacity = 0.3;
            }
            if (opt.ranges && opt.ranges.area) {
                self.showElemByRange(opt.ranges.area, self.areas, opt.hiddenOpacity, opt.animDuration);
            }
            if (opt.ranges && opt.ranges.plot) {
                self.showElemByRange(opt.ranges.plot, self.plots, opt.hiddenOpacity, opt.animDuration);
            }
            if (opt.ranges && opt.ranges.link) {
                self.showElemByRange(opt.ranges.link, self.links, opt.hiddenOpacity, opt.animDuration);
            }
            if (opt.afterShowRange) opt.afterShowRange();
        },

        /*
         * Show some element in range
         * @param ranges: the ranges
         * @param elems: list of element on which to check against previous range
         * @hiddenOpacity: the opacity when hidden
         * @animDuration: the animation duration
         */
        showElemByRange: function(ranges, elems, hiddenOpacity, animDuration) {
            var self = this;
            var elemsFinalOpacity = {};
            if (ranges.min !== undefined || ranges.max !== undefined) {
                ranges = {0: ranges};
            }
            $.each(ranges, function (valueIndex) {
                var range = ranges[valueIndex];
                if (range.min === undefined && range.max === undefined) {
                    return true;
                }
                $.each(elems, function (id) {
                    var elemValue = elems[id].options.value;
                    if (typeof elemValue !== "object") {
                        elemValue = [elemValue];
                    }
                    if (elemValue[valueIndex] === undefined) {
                        return true;
                    }
                    if ((range.min !== undefined && elemValue[valueIndex] < range.min) ||
                        (range.max !== undefined && elemValue[valueIndex] > range.max)) {
                        elemsFinalOpacity[id] = hiddenOpacity;
                    } else {
                        elemsFinalOpacity[id] = 1;
                    }
                });
            });
            $.each(elemsFinalOpacity, function (id) {
                self.setElementOpacity(elems[id], elemsFinalOpacity[id], animDuration);
            });
        },

        /*
         * Set element opacity
         * Handle elem.mapElem and elem.textElem
         * @param elem the element
         * @param opacity the opacity to apply
         * @param animDuration the animation duration to use
         */
        setElementOpacity: function(elem, opacity, animDuration) {
            var self = this;
            if (opacity > 0) {
                elem.mapElem.show();
                if (elem.textElem) elem.textElem.show();
            }

            self.animate(elem.mapElem, {"opacity": opacity}, animDuration, function () {
                if (opacity === 0) elem.mapElem.hide();
            });

            self.animate(elem.textElem, {"opacity": opacity}, animDuration, function () {
                if (opacity === 0) elem.textElem.hide();
            });
        },

        /*
         * Update the current map
         *
         * Refresh attributes and tooltips for areas and plots
         * @param opt option for the refresh :
         *  opt.mapOptions: options to update for plots and areas
         *  opt.replaceOptions: whether mapsOptions should entirely replace current map options, or just extend it
         *  opt.opt.newPlots new plots to add to the map
         *  opt.newLinks new links to add to the map
         *  opt.deletePlotKeys plots to delete from the map (array, or "all" to remove all plots)
         *  opt.deleteLinkKeys links to remove from the map (array, or "all" to remove all links)
         *  opt.setLegendElemsState the state of legend elements to be set : show (default) or hide
         *  opt.animDuration animation duration in ms (default = 0)
         *  opt.afterUpdate hook that allows to add custom processing on the map
         */
        onUpdateEvent: function (e, opt) {
            var self = this;
            if (typeof opt !== "object")  return;

            var i = 0;
            var animDuration = (opt.animDuration) ? opt.animDuration : 0;
            var fnRemoveElement = function (elem) {

                self.animate(elem.mapElem, {"opacity": 0}, animDuration, function () {
                    elem.mapElem.remove();
                });

                self.animate(elem.textElem, {"opacity": 0}, animDuration, function () {
                    elem.textElem.remove();
                });
            };
            var fnShowElement = function (elem) {
                elem.mapElem.attr({opacity: 0});
                if (elem.textElem) elem.textElem.attr({opacity: 0});
                self.setElementOpacity(
                    elem,
                    (elem.mapElem.originalAttrs.opacity !== undefined) ? elem.mapElem.originalAttrs.opacity : 1,
                    animDuration
                );
            };

            if (typeof opt.mapOptions === "object") {
                if (opt.replaceOptions === true) self.options = self.extendDefaultOptions(opt.mapOptions);
                else $.extend(true, self.options, opt.mapOptions);
                if (opt.mapOptions.areas !== undefined || opt.mapOptions.plots !== undefined || opt.mapOptions.legend !== undefined) {
                    $("[data-type='legend-elem']", self.$container).each(function (id, elem) {
                        if ($(elem).attr('data-hidden') === "1") {
                            $(elem).trigger("click", {hideOtherElems: false, animDuration: animDuration});
                        }
                    });
                }
            }
            if (typeof opt.deletePlotKeys === "object") {
                for (; i < opt.deletePlotKeys.length; i++) {
                    if (self.plots[opt.deletePlotKeys[i]] !== undefined) {
                        fnRemoveElement(self.plots[opt.deletePlotKeys[i]]);
                        delete self.plots[opt.deletePlotKeys[i]];
                    }
                }
            } else if (opt.deletePlotKeys === "all") {
                $.each(self.plots, function (id, elem) {
                    fnRemoveElement(elem);
                });
                self.plots = {};
            }
            if (typeof opt.deleteLinkKeys === "object") {
                for (i = 0; i < opt.deleteLinkKeys.length; i++) {
                    if (self.links[opt.deleteLinkKeys[i]] !== undefined) {
                        fnRemoveElement(self.links[opt.deleteLinkKeys[i]]);
                        delete self.links[opt.deleteLinkKeys[i]];
                    }
                }
            } else if (opt.deleteLinkKeys === "all") {
                $.each(self.links, function (id, elem) {
                    fnRemoveElement(elem);
                });
                self.links = {};
            }
            if (typeof opt.newPlots === "object") {
                $.each(opt.newPlots, function (id) {
                    if (self.plots[id] === undefined) {
                        self.options.plots[id] = opt.newPlots[id];
                        self.plots[id] = self.drawPlot(id);
                        if (animDuration > 0) {
                            fnShowElement(self.plots[id]);
                        }
                    }
                });
            }
            if (typeof opt.newLinks === "object") {
                var newLinks = self.drawLinksCollection(opt.newLinks);
                $.extend(self.links, newLinks);
                $.extend(self.options.links, opt.newLinks);
                if (animDuration > 0) {
                    $.each(newLinks, function (id) {
                        fnShowElement(newLinks[id]);
                    });
                }
            }
            $.each(self.areas, function (id) {
                if ((typeof opt.mapOptions === "object" &&
                    (
                        (typeof opt.mapOptions.map === "object" && typeof opt.mapOptions.map.defaultArea === "object") ||
                        (typeof opt.mapOptions.areas === "object" && typeof opt.mapOptions.areas[id] === "object") ||
                        (typeof opt.mapOptions.legend === "object" && typeof opt.mapOptions.legend.area === "object")
                    )) || opt.replaceOptions === true
                ) {
                    self.areas[id].options = self.getElemOptions(
                        self.options.map.defaultArea,
                        (self.options.areas[id] ? self.options.areas[id] : {}),
                        self.options.legend.area
                    );
                    self.updateElem(self.areas[id], animDuration);
                }
            });
            $.each(self.plots, function (id) {
                if ((typeof opt.mapOptions ==="object" &&
                    (
                        (typeof opt.mapOptions.map === "object" && typeof opt.mapOptions.map.defaultPlot === "object") ||
                        (typeof opt.mapOptions.plots === "object" && typeof opt.mapOptions.plots[id] === "object") ||
                        (typeof opt.mapOptions.legend === "object" && typeof opt.mapOptions.legend.plot === "object")
                    )) || opt.replaceOptions === true
                ) {
                    self.plots[id].options = self.getElemOptions(
                        self.options.map.defaultPlot,
                        (self.options.plots[id] ? self.options.plots[id] : {}),
                        self.options.legend.plot
                    );

                    self.setPlotCoords(self.plots[id]);
                    self.setPlotAttributes(self.plots[id]);

                    self.updateElem(self.plots[id], animDuration);
                }
            });
            $.each(self.links, function (id) {
                if ((typeof opt.mapOptions === "object" &&
                    (
                        (typeof opt.mapOptions.map === "object" && typeof opt.mapOptions.map.defaultLink === "object") ||
                        (typeof opt.mapOptions.links === "object" && typeof opt.mapOptions.links[id] === "object")
                    )) || opt.replaceOptions === true
                ) {
                    self.links[id].options = self.getElemOptions(
                        self.options.map.defaultLink,
                        (self.options.links[id] ? self.options.links[id] : {}),
                        {}
                    );

                    self.updateElem(self.links[id], animDuration);
                }
            });
            if (opt.mapOptions && (
                    (typeof opt.mapOptions.legend === "object") ||
                    (typeof opt.mapOptions.map === "object" && typeof opt.mapOptions.map.defaultArea === "object") ||
                    (typeof opt.mapOptions.map === "object" && typeof opt.mapOptions.map.defaultPlot === "object")
                )) {
                $("[data-type='legend-elem']", self.$container).each(function (id, elem) {
                    if ($(elem).attr('data-hidden') === "1") {
                        $(elem).trigger("click", {hideOtherElems: false, animDuration: animDuration});
                    }
                });

                self.createLegends("area", self.areas, 1);
                if (self.options.map.width) {
                    self.createLegends("plot", self.plots, (self.options.map.width / self.mapConf.width));
                } else {
                    self.createLegends("plot", self.plots, (self.$map.width() / self.mapConf.width));
                }
            }
            if (typeof opt.setLegendElemsState === "object") {
                $.each(opt.setLegendElemsState, function (legendCSSClass, action) {
                    var $legend = self.$container.find("." + legendCSSClass)[0];
                    if ($legend !== undefined) {
                        $("[data-type='legend-elem']", $legend).each(function (id, elem) {
                            if (($(elem).attr('data-hidden') === "0" && action === "hide") ||
                                ($(elem).attr('data-hidden') === "1" && action === "show")) {
                                $(elem).trigger("click", {hideOtherElems: false, animDuration: animDuration});
                            }
                        });
                    }
                });
            } else {
                var action = (opt.setLegendElemsState === "hide") ? "hide" : "show";

                $("[data-type='legend-elem']", self.$container).each(function (id, elem) {
                    if (($(elem).attr('data-hidden') === "0" && action === "hide") ||
                        ($(elem).attr('data-hidden') === "1" && action === "show")) {
                        $(elem).trigger("click", {hideOtherElems: false, animDuration: animDuration});
                    }
                });
            }
            self.initDelegatedCustomEvents();

            if (opt.afterUpdate) opt.afterUpdate(self.$container, self.paper, self.areas, self.plots, self.options, self.links);
        },

        /*
         * Set plot coordinates
         * @param plot object plot element
         */
        setPlotCoords: function(plot) {
            var self = this;

            if (plot.options.x !== undefined && plot.options.y !== undefined) {
                plot.coords = {
                    x: plot.options.x,
                    y: plot.options.y
                };
            } else if (plot.options.plotsOn !== undefined && self.areas[plot.options.plotsOn] !== undefined) {
                var areaBBox = self.areas[plot.options.plotsOn].mapElem.getBBox();
                plot.coords = {
                    x: areaBBox.cx,
                    y: areaBBox.cy
                };
            } else {
                plot.coords = self.mapConf.getCoords(plot.options.latitude, plot.options.longitude);
            }
        },

        /*
         * Set plot size attributes according to its type
         * Note: for SVG, plot.mapElem needs to exists beforehand
         * @param plot object plot element
         */
        setPlotAttributes: function(plot) {
            if (plot.options.type === "square") {
                plot.options.attrs.width = plot.options.size;
                plot.options.attrs.height = plot.options.size;
                plot.options.attrs.x = plot.coords.x - (plot.options.size / 2);
                plot.options.attrs.y = plot.coords.y - (plot.options.size / 2);
            } else if (plot.options.type === "image") {
                plot.options.attrs.src = plot.options.url;
                plot.options.attrs.width = plot.options.width;
                plot.options.attrs.height = plot.options.height;
                plot.options.attrs.x = plot.coords.x - (plot.options.width / 2);
                plot.options.attrs.y = plot.coords.y - (plot.options.height / 2);
            } else if (plot.options.type === "svg") {
                plot.options.attrs.path = plot.options.path;
                if (plot.options.attrs.transform === undefined) {
                    plot.options.attrs.transform = "";
                }
                if (plot.mapElem.originalBBox === undefined) {
                    plot.mapElem.originalBBox = plot.mapElem.getBBox();
                }
                plot.mapElem.baseTransform = "m" + (plot.options.width / plot.mapElem.originalBBox.width) + ",0,0," +
                                                   (plot.options.height / plot.mapElem.originalBBox.height) + "," +
                                                   (plot.coords.x - plot.options.width / 2) + "," +
                                                   (plot.coords.y - plot.options.height / 2);

                plot.options.attrs.transform = plot.mapElem.baseTransform + plot.options.attrs.transform;

            } else {
                plot.options.attrs.x = plot.coords.x;
                plot.options.attrs.y = plot.coords.y;
                plot.options.attrs.r = plot.options.size / 2;
            }
        },

        /*
         * Draw all links between plots on the paper
         */
        drawLinksCollection: function (linksCollection) {
            var self = this;
            var p1 = {};
            var p2 = {};
            var coordsP1 = {};
            var coordsP2 = {};
            var links = {};

            $.each(linksCollection, function (id) {
                var elemOptions = self.getElemOptions(self.options.map.defaultLink, linksCollection[id], {});

                if (typeof linksCollection[id].between[0] === 'string') {
                    p1 = self.options.plots[linksCollection[id].between[0]];
                } else {
                    p1 = linksCollection[id].between[0];
                }

                if (typeof linksCollection[id].between[1] === 'string') {
                    p2 = self.options.plots[linksCollection[id].between[1]];
                } else {
                    p2 = linksCollection[id].between[1];
                }

                if (p1.plotsOn !== undefined && self.areas[p1.plotsOn] !== undefined) {
                    var p1BBox = self.areas[p1.plotsOn].mapElem.getBBox();
                    coordsP1 = {
                        x: p1BBox.cx,
                        y: p1BBox.cy
                    };
                }
                else if (p1.latitude !== undefined && p1.longitude !== undefined) {
                    coordsP1 = self.mapConf.getCoords(p1.latitude, p1.longitude);
                } else {
                    coordsP1.x = p1.x;
                    coordsP1.y = p1.y;
                }

                if (p2.plotsOn !== undefined && self.areas[p2.plotsOn] !== undefined) {
                    var p2BBox = self.areas[p2.plotsOn].mapElem.getBBox();
                    coordsP2 = {
                        x: p2BBox.cx,
                        y: p2BBox.cy
                    };
                }
                else if (p2.latitude !== undefined && p2.longitude !== undefined) {
                    coordsP2 = self.mapConf.getCoords(p2.latitude, p2.longitude);
                } else {
                    coordsP2.x = p2.x;
                    coordsP2.y = p2.y;
                }
                links[id] = self.drawLink(id, coordsP1.x, coordsP1.y, coordsP2.x, coordsP2.y, elemOptions);
            });
            return links;
        },

        /*
         * Draw a curved link between two couples of coordinates a(xa,ya) and b(xb, yb) on the paper
         */
        drawLink: function (id, xa, ya, xb, yb, elemOptions) {
            var self = this;
            var link = {
                options: elemOptions
            };
            var xc = (xa + xb) / 2;
            var yc = (ya + yb) / 2;
            var acd = -1 / ((yb - ya) / (xb - xa));
            var bcd = yc - acd * xc;
            var abDist = Math.sqrt((xb - xa) * (xb - xa) + (yb - ya) * (yb - ya));
            var a = 1 + acd * acd;
            var b = -2 * xc + 2 * acd * bcd - 2 * acd * yc;
            var c = xc * xc + bcd * bcd - bcd * yc - yc * bcd + yc * yc - ((elemOptions.factor * abDist) * (elemOptions.factor * abDist));
            var delta = b * b - 4 * a * c;
            var x = 0;
            var y = 0;
            if (elemOptions.factor > 0) {
                x = (-b + Math.sqrt(delta)) / (2 * a);
                y = acd * x + bcd;
            } else {
                x = (-b - Math.sqrt(delta)) / (2 * a);
                y = acd * x + bcd;
            }

            link.mapElem = self.paper.path("m " + xa + "," + ya + " C " + x + "," + y + " " + xb + "," + yb + " " + xb + "," + yb + "");

            self.initElem(id, 'link', link);

            return link;
        },

        /*
         * Check wether newAttrs object bring modifications to originalAttrs object
         */
        isAttrsChanged: function(originalAttrs, newAttrs) {
            for (var key in newAttrs) {
                if (newAttrs.hasOwnProperty(key) && typeof originalAttrs[key] === 'undefined' || newAttrs[key] !== originalAttrs[key]) {
                    return true;
                }
            }
            return false;
        },

        /*
         * Update the element "elem" on the map with the new options
         */
        updateElem: function (elem, animDuration) {
            var self = this;
            var mapElemBBox;
            var plotOffsetX;
            var plotOffsetY;

            if (elem.options.toFront === true) {
                elem.mapElem.toFront();
            }
            if (elem.options.href !== undefined) {
                elem.options.attrs.cursor = "pointer";
                if (elem.options.text) elem.options.text.attrs.cursor = "pointer";
            } else {
                if (elem.mapElem.attrs.cursor === 'pointer') {
                    elem.options.attrs.cursor = "auto";
                    if (elem.options.text) elem.options.text.attrs.cursor = "auto";
                }
            }
            if (elem.textElem) {
                elem.options.text.attrs.text = elem.options.text.content;
                mapElemBBox = elem.mapElem.getBBox();
                if (elem.options.size || (elem.options.width && elem.options.height)) {
                    if (elem.options.type === "image" || elem.options.type === "svg") {
                        plotOffsetX = (elem.options.width - mapElemBBox.width) / 2;
                        plotOffsetY = (elem.options.height - mapElemBBox.height) / 2;
                    } else {
                        plotOffsetX = (elem.options.size - mapElemBBox.width) / 2;
                        plotOffsetY = (elem.options.size - mapElemBBox.height) / 2;
                    }
                    mapElemBBox.x -= plotOffsetX;
                    mapElemBBox.x2 += plotOffsetX;
                    mapElemBBox.y -= plotOffsetY;
                    mapElemBBox.y2 += plotOffsetY;
                }
                var textPosition = self.getTextPosition(mapElemBBox, elem.options.text.position, elem.options.text.margin);
                elem.options.text.attrs.x = textPosition.x;
                elem.options.text.attrs.y = textPosition.y;
                elem.options.text.attrs['text-anchor'] = textPosition.textAnchor;
                self.setHoverOptions(elem.textElem, elem.options.text.attrs, elem.options.text.attrsHover);

                if (self.isAttrsChanged(elem.textElem.attrs, elem.options.text.attrs)) {
                    self.animate(elem.textElem, elem.options.text.attrs, animDuration);
                }
            }
            self.setHoverOptions(elem.mapElem, elem.options.attrs, elem.options.attrsHover);

            if (self.isAttrsChanged(elem.mapElem.attrs, elem.options.attrs)) {
                self.animate(elem.mapElem, elem.options.attrs, animDuration);
            }
            if (elem.options.cssClass !== undefined) {
                $(elem.mapElem.node).removeClass().addClass(elem.options.cssClass);
            }
        },

        /*
         * Draw the plot
         */
        drawPlot: function (id) {
            var self = this;
            var plot = {};
            plot.options = self.getElemOptions(
                self.options.map.defaultPlot,
                (self.options.plots[id] ? self.options.plots[id] : {}),
                self.options.legend.plot
            );
            self.setPlotCoords(plot);
            if (plot.options.type === "svg") {
                plot.mapElem = self.paper.path(plot.options.path);
            }
            self.setPlotAttributes(plot);
            if (plot.options.type === "square") {
                plot.mapElem = self.paper.rect(
                    plot.options.attrs.x,
                    plot.options.attrs.y,
                    plot.options.attrs.width,
                    plot.options.attrs.height
                );
            } else if (plot.options.type === "image") {
                plot.mapElem = self.paper.image(
                    plot.options.attrs.src,
                    plot.options.attrs.x,
                    plot.options.attrs.y,
                    plot.options.attrs.width,
                    plot.options.attrs.height
                );
            } else if (plot.options.type === "svg") {
            } else {
                plot.mapElem = self.paper.circle(
                    plot.options.attrs.x,
                    plot.options.attrs.y,
                    plot.options.attrs.r
                );
            }

            self.initElem(id, 'plot', plot);

            return plot;
        },

        /*
         * Set user defined handlers for events on areas and plots
         * @param id the id of the element
         * @param type the type of the element (area, plot, link)
         * @param elem the element object {mapElem, textElem, options, ...}
         */
        setEventHandlers: function (id, type, elem) {
            var self = this;
            $.each(elem.options.eventHandlers, function (event) {
                if (self.customEventHandlers[event] === undefined) self.customEventHandlers[event] = {};
                if (self.customEventHandlers[event][type] === undefined) self.customEventHandlers[event][type] = {};
                self.customEventHandlers[event][type][id] = elem;
            });
        },

        /*
         * Draw a legend for areas and / or plots
         * @param legendOptions options for the legend to draw
         * @param legendType the type of the legend : "area" or "plot"
         * @param elems collection of plots or areas on the maps
         * @param legendIndex index of the legend in the conf array
         */
        drawLegend: function (legendOptions, legendType, elems, scale, legendIndex) {
            var self = this;
            var $legend = {};
            var legendPaper = {};
            var width = 0;
            var height = 0;
            var title = null;
            var titleBBox = null;
            var legendElems = {};
            var i = 0;
            var x = 0;
            var y = 0;
            var yCenter = 0;
            var sliceOptions = [];

            $legend = $("." + legendOptions.cssClass, self.$container);
            var initialHTMLContent = $legend.html();
            $legend.empty();

            legendPaper = new Raphael($legend.get(0));
            $(legendPaper.canvas).attr({"data-legend-type": legendType, "data-legend-id": legendIndex});

            height = width = 0;
            if (legendOptions.title && legendOptions.title !== "") {
                title = legendPaper.text(legendOptions.marginLeftTitle, 0, legendOptions.title).attr(legendOptions.titleAttrs);
                titleBBox = title.getBBox();
                title.attr({y: 0.5 * titleBBox.height});

                width = legendOptions.marginLeftTitle + titleBBox.width;
                height += legendOptions.marginBottomTitle + titleBBox.height;
            }

            for (i = 0; i < legendOptions.slices.length; ++i) {
                var yCenterCurrent = 0;

                sliceOptions[i] = $.extend(true, {}, (legendType === "plot") ? self.options.map.defaultPlot : self.options.map.defaultArea, legendOptions.slices[i]);

                if (legendOptions.slices[i].legendSpecificAttrs === undefined) {
                    legendOptions.slices[i].legendSpecificAttrs = {};
                }

                $.extend(true, sliceOptions[i].attrs, legendOptions.slices[i].legendSpecificAttrs);

                if (legendType === "area") {
                    if (sliceOptions[i].attrs.width === undefined)
                        sliceOptions[i].attrs.width = 30;
                    if (sliceOptions[i].attrs.height === undefined)
                        sliceOptions[i].attrs.height = 20;
                } else if (sliceOptions[i].type === "square") {
                    if (sliceOptions[i].attrs.width === undefined)
                        sliceOptions[i].attrs.width = sliceOptions[i].size;
                    if (sliceOptions[i].attrs.height === undefined)
                        sliceOptions[i].attrs.height = sliceOptions[i].size;
                } else if (sliceOptions[i].type === "image" || sliceOptions[i].type === "svg") {
                    if (sliceOptions[i].attrs.width === undefined)
                        sliceOptions[i].attrs.width = sliceOptions[i].width;
                    if (sliceOptions[i].attrs.height === undefined)
                        sliceOptions[i].attrs.height = sliceOptions[i].height;
                } else {
                    if (sliceOptions[i].attrs.r === undefined)
                        sliceOptions[i].attrs.r = sliceOptions[i].size / 2;
                }
                yCenterCurrent = legendOptions.marginBottomTitle;
                if (title) {
                    yCenterCurrent += titleBBox.height;
                }
                if (legendType === "plot" && (sliceOptions[i].type === undefined || sliceOptions[i].type === "circle")) {
                    yCenterCurrent += scale * sliceOptions[i].attrs.r;
                } else {
                    yCenterCurrent += scale * sliceOptions[i].attrs.height / 2;
                }
                yCenter = Math.max(yCenter, yCenterCurrent);
            }

            if (legendOptions.mode === "horizontal") {
                width = legendOptions.marginLeft;
            }
            for (i = 0; i < sliceOptions.length; ++i) {
                var legendElem = {};
                var legendElemBBox = {};
                var legendLabel = {};

                if (sliceOptions[i].display === undefined || sliceOptions[i].display === true) {
                    if (legendType === "area") {
                        if (legendOptions.mode === "horizontal") {
                            x = width + legendOptions.marginLeft;
                            y = yCenter - (0.5 * scale * sliceOptions[i].attrs.height);
                        } else {
                            x = legendOptions.marginLeft;
                            y = height;
                        }

                        legendElem = legendPaper.rect(x, y, scale * (sliceOptions[i].attrs.width), scale * (sliceOptions[i].attrs.height));
                    } else if (sliceOptions[i].type === "square") {
                        if (legendOptions.mode === "horizontal") {
                            x = width + legendOptions.marginLeft;
                            y = yCenter - (0.5 * scale * sliceOptions[i].attrs.height);
                        } else {
                            x = legendOptions.marginLeft;
                            y = height;
                        }

                        legendElem = legendPaper.rect(x, y, scale * (sliceOptions[i].attrs.width), scale * (sliceOptions[i].attrs.height));

                    } else if (sliceOptions[i].type === "image" || sliceOptions[i].type === "svg") {
                        if (legendOptions.mode === "horizontal") {
                            x = width + legendOptions.marginLeft;
                            y = yCenter - (0.5 * scale * sliceOptions[i].attrs.height);
                        } else {
                            x = legendOptions.marginLeft;
                            y = height;
                        }

                        if (sliceOptions[i].type === "image") {
                            legendElem = legendPaper.image(
                                sliceOptions[i].url, x, y, scale * sliceOptions[i].attrs.width, scale * sliceOptions[i].attrs.height);
                        } else {
                            legendElem = legendPaper.path(sliceOptions[i].path);

                            if (sliceOptions[i].attrs.transform === undefined) {
                                sliceOptions[i].attrs.transform = "";
                            }
                            legendElemBBox = legendElem.getBBox();
                            sliceOptions[i].attrs.transform = "m" + ((scale * sliceOptions[i].width) / legendElemBBox.width) + ",0,0," + ((scale * sliceOptions[i].height) / legendElemBBox.height) + "," + x + "," + y + sliceOptions[i].attrs.transform;
                        }
                    } else {
                        if (legendOptions.mode === "horizontal") {
                            x = width + legendOptions.marginLeft + scale * (sliceOptions[i].attrs.r);
                            y = yCenter;
                        } else {
                            x = legendOptions.marginLeft + scale * (sliceOptions[i].attrs.r);
                            y = height + scale * (sliceOptions[i].attrs.r);
                        }
                        legendElem = legendPaper.circle(x, y, scale * (sliceOptions[i].attrs.r));
                    }
                    delete sliceOptions[i].attrs.width;
                    delete sliceOptions[i].attrs.height;
                    delete sliceOptions[i].attrs.r;
                    legendElem.attr(sliceOptions[i].attrs);
                    legendElemBBox = legendElem.getBBox();
                    if (legendOptions.mode === "horizontal") {
                        x = width + legendOptions.marginLeft + legendElemBBox.width + legendOptions.marginLeftLabel;
                        y = yCenter;
                    } else {
                        x = legendOptions.marginLeft + legendElemBBox.width + legendOptions.marginLeftLabel;
                        y = height + (legendElemBBox.height / 2);
                    }

                    legendLabel = legendPaper.text(x, y, sliceOptions[i].label).attr(legendOptions.labelAttrs);
                    if (legendOptions.mode === "horizontal") {
                        var currentHeight = legendOptions.marginBottom + legendElemBBox.height;
                        width += legendOptions.marginLeft + legendElemBBox.width + legendOptions.marginLeftLabel + legendLabel.getBBox().width;
                        if (sliceOptions[i].type !== "image" && legendType !== "area") {
                            currentHeight += legendOptions.marginBottomTitle;
                        }
                        if (title) {
                            currentHeight += titleBBox.height;
                        }
                        height = Math.max(height, currentHeight);
                    } else {
                        width = Math.max(width, legendOptions.marginLeft + legendElemBBox.width + legendOptions.marginLeftLabel + legendLabel.getBBox().width);
                        height += legendOptions.marginBottom + legendElemBBox.height;
                    }
                    $(legendElem.node).attr({
                        "data-legend-id": legendIndex,
                        "data-legend-type": legendType,
                        "data-type": "legend-elem",
                        "data-id": i,
                        "data-hidden": 0
                    });
                    $(legendLabel.node).attr({
                        "data-legend-id": legendIndex,
                        "data-legend-type": legendType,
                        "data-type": "legend-label",
                        "data-id": i,
                        "data-hidden": 0
                    });
                    legendElems[i] = {
                        mapElem: legendElem,
                        textElem: legendLabel
                    };
                    if (legendOptions.hideElemsOnClick.enabled) {
                        legendLabel.attr({cursor: "pointer"});
                        legendElem.attr({cursor: "pointer"});

                        self.setHoverOptions(legendElem, sliceOptions[i].attrs, sliceOptions[i].attrs);
                        self.setHoverOptions(legendLabel, legendOptions.labelAttrs, legendOptions.labelAttrsHover);

                        if (sliceOptions[i].clicked !== undefined && sliceOptions[i].clicked === true) {
                            self.handleClickOnLegendElem(legendElems[i], i, legendIndex, legendType, {hideOtherElems: false});
                        }
                    }
                }
            }
            if (Raphael.type !== "SVG" && legendOptions.VMLWidth)
                width = legendOptions.VMLWidth;

            legendPaper.setSize(width, height);

            return {
                container: $legend,
                initialHTMLContent: initialHTMLContent,
                elems: legendElems
            };
        },

        /*
         * Allow to hide elements of the map when the user clicks on a related legend item
         * @param elem legend element
         * @param id legend element ID
         * @param legendIndex corresponding legend index
         * @param legendType corresponding legend type (area or plot)
         * @param opts object additionnal options
         *          hideOtherElems boolean, if other elems shall be hidden
         *          animDuration duration of animation
         */
        handleClickOnLegendElem: function(elem, id, legendIndex, legendType, opts) {
            var self = this;
            var legendOptions;
            opts = opts || {};

            if (!$.isArray(self.options.legend[legendType])) {
                legendOptions = self.options.legend[legendType];
            } else {
                legendOptions = self.options.legend[legendType][legendIndex];
            }

            var legendElem = elem.mapElem;
            var legendLabel = elem.textElem;
            var $legendElem = $(legendElem.node);
            var $legendLabel = $(legendLabel.node);
            var sliceOptions = legendOptions.slices[id];
            var mapElems = legendType === 'area' ? self.areas : self.plots;
            var animDuration = opts.animDuration !== undefined ? opts.animDuration : legendOptions.hideElemsOnClick.animDuration ;

            var hidden = $legendElem.attr('data-hidden');
            var hiddenNewAttr = (hidden === '0') ? {"data-hidden": '1'} : {"data-hidden": '0'};

            if (hidden === '0') {
                self.animate(legendLabel, {"opacity": 0.5}, animDuration);
            } else {
                self.animate(legendLabel, {"opacity": 1}, animDuration);
            }

            $.each(mapElems, function (y) {
                var elemValue;
                var hiddenBy = mapElems[y].mapElem.data('hidden-by');
                if (hiddenBy === undefined) hiddenBy = {};

                if ($.isArray(mapElems[y].options.value)) {
                    elemValue = mapElems[y].options.value[legendIndex];
                } else {
                    elemValue = mapElems[y].options.value;
                }
                if (self.getLegendSlice(elemValue, legendOptions) === sliceOptions) {
                    if (hidden === '0') {
                        hiddenBy[legendIndex] = true;
                        self.setElementOpacity(mapElems[y], legendOptions.hideElemsOnClick.opacity, animDuration);
                    } else {
                        delete hiddenBy[legendIndex];
                        if ($.isEmptyObject(hiddenBy)) {
                            self.setElementOpacity(
                                mapElems[y],
                                mapElems[y].mapElem.originalAttrs.opacity !== undefined ? mapElems[y].mapElem.originalAttrs.opacity : 1,
                                animDuration
                            );
                        }
                    }
                    mapElems[y].mapElem.data('hidden-by', hiddenBy);
                }
            });

            $legendElem.attr(hiddenNewAttr);
            $legendLabel.attr(hiddenNewAttr);

            if ((opts.hideOtherElems === undefined || opts.hideOtherElems === true) && legendOptions.exclusive === true ) {
                $("[data-type='legend-elem'][data-hidden=0]", self.$container).each(function () {
                    var $elem = $(this);
                    if ($elem.attr('data-id') !== id) {
                        $elem.trigger("click", {hideOtherElems: false});
                    }
                });
            }

        },

        /*
         * Create all legends for a specified type (area or plot)
         * @param legendType the type of the legend : "area" or "plot"
         * @param elems collection of plots or areas displayed on the map
         * @param scale scale ratio of the map
         */
        createLegends: function (legendType, elems, scale) {
            var self = this;
            var legendsOptions = self.options.legend[legendType];

            if (!$.isArray(self.options.legend[legendType])) {
                legendsOptions = [self.options.legend[legendType]];
            }

            self.legends[legendType] = {};
            for (var j = 0; j < legendsOptions.length; ++j) {
                if (legendsOptions[j].display === true  && $.isArray(legendsOptions[j].slices) && legendsOptions[j].slices.length > 0 &&
                    legendsOptions[j].cssClass !== "" && $("." + legendsOptions[j].cssClass, self.$container).length !== 0
                ) {
                    self.legends[legendType][j] = self.drawLegend(legendsOptions[j], legendType, elems, scale, j);
                }
            }
        },

        /*
         * Set the attributes on hover and the attributes to restore for a map element
         * @param elem the map element
         * @param originalAttrs the original attributes to restore on mouseout event
         * @param attrsHover the attributes to set on mouseover event
         */
        setHoverOptions: function (elem, originalAttrs, attrsHover) {
            if (Raphael.type !== "SVG") delete attrsHover.transform;
            elem.attrsHover = attrsHover;

            if (elem.attrsHover.transform) elem.originalAttrs = $.extend({transform: "s1"}, originalAttrs);
            else elem.originalAttrs = originalAttrs;
        },

        /*
         * Set the behaviour when mouse enters element ("mouseover" event)
         * It may be an area, a plot, a link or a legend element
         * @param elem the map element
         */
        elemEnter: function (elem) {
            var self = this;
            if (elem === undefined) return;

            /* Handle mapElem Hover attributes */
            if (elem.mapElem !== undefined) {
                self.animate(elem.mapElem, elem.mapElem.attrsHover, elem.mapElem.attrsHover.animDuration);
            }

            /* Handle textElem Hover attributes */
            if (elem.textElem !== undefined) {
                self.animate(elem.textElem, elem.textElem.attrsHover, elem.textElem.attrsHover.animDuration);
            }

            /* Handle tooltip init */
            if (elem.options && elem.options.tooltip !== undefined) {
                var content = '';
                self.$tooltip.removeClass().addClass(self.options.map.tooltip.cssClass);
                if (elem.options.tooltip.content !== undefined) {
                    if (typeof elem.options.tooltip.content === "function") content = elem.options.tooltip.content(elem.mapElem);
                    else content = elem.options.tooltip.content;
                }
                if (elem.options.tooltip.cssClass !== undefined) {
                    self.$tooltip.addClass(elem.options.tooltip.cssClass);
                }
                self.$tooltip.html(content).css("display", "block");
            }
            if (elem.mapElem !== undefined || elem.textElem !== undefined) {
                if (self.paper.safari) self.paper.safari();
            }
        },

        /*
         * Set the behaviour when mouse moves in element ("mousemove" event)
         * @param elem the map element
         */
        elemHover: function (elem, event) {
            var self = this;
            if (elem === undefined) return;

            /* Handle tooltip position update */
            if (elem.options.tooltip !== undefined) {
                var mouseX = event.pageX;
                var mouseY = event.pageY;

                var offsetLeft = 10;
                var offsetTop = 20;
                if (typeof elem.options.tooltip.offset === "object") {
                    if (typeof elem.options.tooltip.offset.left !== "undefined") {
                        offsetLeft = elem.options.tooltip.offset.left;
                    }
                    if (typeof elem.options.tooltip.offset.top !== "undefined") {
                        offsetTop = elem.options.tooltip.offset.top;
                    }
                }

                var tooltipPosition = {
                    "left": Math.min(self.$map.width() - self.$tooltip.outerWidth() - 5,
                                     mouseX - self.$map.offset().left + offsetLeft),
                    "top": Math.min(self.$map.height() - self.$tooltip.outerHeight() - 5,
                                    mouseY - self.$map.offset().top + offsetTop)
                };

                if (typeof elem.options.tooltip.overflow === "object") {
                    if (elem.options.tooltip.overflow.right === true) {
                        tooltipPosition.left = mouseX - self.$map.offset().left + 10;
                    }
                    if (elem.options.tooltip.overflow.bottom === true) {
                        tooltipPosition.top = mouseY - self.$map.offset().top + 20;
                    }
                }

                self.$tooltip.css(tooltipPosition);
            }
        },

        /*
         * Set the behaviour when mouse leaves element ("mouseout" event)
         * It may be an area, a plot, a link or a legend element
         * @param elem the map element
         */
        elemOut: function (elem) {
            var self = this;
            if (elem === undefined) return;

            /* reset mapElem attributes */
            if (elem.mapElem !== undefined) {
                self.animate(elem.mapElem, elem.mapElem.originalAttrs, elem.mapElem.attrsHover.animDuration);
            }

            /* reset textElem attributes */
            if (elem.textElem !== undefined) {
                self.animate(elem.textElem, elem.textElem.originalAttrs, elem.textElem.attrsHover.animDuration);
            }

            /* reset tooltip */
            if (elem.options && elem.options.tooltip !== undefined) {
                self.$tooltip.css({
                    'display': 'none',
                    'top': -1000,
                    'left': -1000
                });
            }
            if (elem.mapElem !== undefined || elem.textElem !== undefined) {
                if (self.paper.safari) self.paper.safari();
            }
        },

        /*
         * Set the behaviour when mouse clicks element ("click" event)
         * It may be an area, a plot or a link (but not a legend element which has its own function)
         * @param elem the map element
         */
        elemClick: function (elem) {
            var self = this;
            if (elem === undefined) return;

            /* Handle click when href defined */
            if (!self.panning && elem.options.href !== undefined) {
                window.open(elem.options.href, elem.options.target);
            }
        },

        /*
         * Get element options by merging default options, element options and legend options
         * @param defaultOptions
         * @param elemOptions
         * @param legendOptions
         */
        getElemOptions: function (defaultOptions, elemOptions, legendOptions) {
            var self = this;
            var options = $.extend(true, {}, defaultOptions, elemOptions);
            if (options.value !== undefined) {
                if ($.isArray(legendOptions)) {
                    for (var i = 0; i < legendOptions.length; ++i) {
                        options = $.extend(true, {}, options, self.getLegendSlice(options.value[i], legendOptions[i]));
                    }
                } else {
                    options = $.extend(true, {}, options, self.getLegendSlice(options.value, legendOptions));
                }
            }
            return options;
        },

        /*
         * Get the coordinates of the text relative to a bbox and a position
         * @param bbox the boundary box of the element
         * @param textPosition the wanted text position (inner, right, left, top or bottom)
         * @param margin number or object {x: val, y:val} margin between the bbox and the text
         */
        getTextPosition: function (bbox, textPosition, margin) {
            var textX = 0;
            var textY = 0;
            var textAnchor = "";

            if (typeof margin === "number") {
                if (textPosition === "bottom" || textPosition === "top") {
                    margin = {x: 0, y: margin};
                } else if (textPosition === "right" || textPosition === "left") {
                    margin = {x: margin, y: 0};
                } else {
                    margin = {x: 0, y: 0};
                }
            }

            switch (textPosition) {
                case "bottom" :
                    textX = ((bbox.x + bbox.x2) / 2) + margin.x;
                    textY = bbox.y2 + margin.y;
                    textAnchor = "middle";
                    break;
                case "top" :
                    textX = ((bbox.x + bbox.x2) / 2) + margin.x;
                    textY = bbox.y - margin.y;
                    textAnchor = "middle";
                    break;
                case "left" :
                    textX = bbox.x - margin.x;
                    textY = ((bbox.y + bbox.y2) / 2) + margin.y;
                    textAnchor = "end";
                    break;
                case "right" :
                    textX = bbox.x2 + margin.x;
                    textY = ((bbox.y + bbox.y2) / 2) + margin.y;
                    textAnchor = "start";
                    break;
                default :
                    textX = ((bbox.x + bbox.x2) / 2) + margin.x;
                    textY = ((bbox.y + bbox.y2) / 2) + margin.y;
                    textAnchor = "middle";
            }
            return {"x": textX, "y": textY, "textAnchor": textAnchor};
        },

        /*
         * Get the legend conf matching with the value
         * @param value the value to match with a slice in the legend
         * @param legend the legend params object
         * @return the legend slice matching with the value
         */
        getLegendSlice: function (value, legend) {
            for (var i = 0; i < legend.slices.length; ++i) {
                if ((legend.slices[i].sliceValue !== undefined && value === legend.slices[i].sliceValue) ||
                    ((legend.slices[i].sliceValue === undefined) &&
                        (legend.slices[i].min === undefined || value >= legend.slices[i].min) &&
                        (legend.slices[i].max === undefined || value <= legend.slices[i].max))
                ) {
                    return legend.slices[i];
                }
            }
            return {};
        },

        /*
         * Animated view box changes
         * As from http://code.voidblossom.com/animating-viewbox-easing-formulas/,
         * (from https://github.com/theshaun works on mapael)
         * @param x coordinate of the point to focus on
         * @param y coordinate of the point to focus on
         * @param w map defined width
         * @param h map defined height
         * @param duration defined length of time for animation
         * @param easingFunction defined Raphael supported easing_formula to use
         */
        animateViewBox: function (targetX, targetY, targetW, targetH, duration, easingFunction) {
            var self = this;

            var cx = self.currentViewBox.x;
            var dx = targetX - cx;
            var cy = self.currentViewBox.y;
            var dy = targetY - cy;
            var cw = self.currentViewBox.w;
            var dw = targetW - cw;
            var ch = self.currentViewBox.h;
            var dh = targetH - ch;
            if (!self.zoomAnimCVBTarget) {
                self.zoomAnimCVBTarget = {
                    x: targetX, y: targetY, w: targetW, h: targetH
                };
            }
            var zoomDir = (cw > targetW) ? 'in' : 'out';

            var easingFormula = Raphael.easing_formulas[easingFunction || "linear"];
            var durationWithMargin = duration - (duration * 2 / 100);
            var oldZoomAnimStartTime = self.zoomAnimStartTime;
            self.zoomAnimStartTime = (new Date()).getTime();

            /* Actual function to animate the ViewBox
             * Uses requestAnimationFrame to schedule itself again until animation is over
             */
            var computeNextStep = function () {
                self.cancelAnimationFrame(self.zoomAnimID);
                var elapsed = (new Date()).getTime() - self.zoomAnimStartTime;
                if (elapsed < durationWithMargin) {
                    var x, y, w, h;
                    if (oldZoomAnimStartTime && self.zoomAnimCVBTarget && self.zoomAnimCVBTarget.w !== targetW) {
                        var realElapsed = (new Date()).getTime() - oldZoomAnimStartTime;
                        var realRatio = easingFormula(realElapsed / duration);
                        x = cx + (self.zoomAnimCVBTarget.x - cx) * realRatio;
                        y = cy + (self.zoomAnimCVBTarget.y - cy) * realRatio;
                        w = cw + (self.zoomAnimCVBTarget.w - cw) * realRatio;
                        h = ch + (self.zoomAnimCVBTarget.h - ch) * realRatio;
                        cx = x;
                        dx = targetX - cx;
                        cy = y;
                        dy = targetY - cy;
                        cw = w;
                        dw = targetW - cw;
                        ch = h;
                        dh = targetH - ch;
                        self.zoomAnimCVBTarget = {
                            x: targetX, y: targetY, w: targetW, h: targetH
                        };
                    } else {
                        var ratio = easingFormula(elapsed / duration);
                        x = cx + dx * ratio;
                        y = cy + dy * ratio;
                        w = cw + dw * ratio;
                        h = ch + dh * ratio;
                    }
                    if (zoomDir === 'in' && (w > self.currentViewBox.w || w < targetW)) {
                    } else if (zoomDir === 'out' && (w < self.currentViewBox.w || w > targetW)) {
                    } else {
                        self.setViewBox(x, y, w, h);
                    }
                    self.zoomAnimID = self.requestAnimationFrame(computeNextStep);
                } else {
                    /* Zoom animation done ! */
                    self.zoomAnimStartTime = null;
                    self.zoomAnimCVBTarget = null;
                    if (self.currentViewBox.w !== targetW) {
                        self.setViewBox(targetX, targetY, targetW, targetH);
                    }
                    self.$map.trigger("afterZoom", {
                        x1: targetX, y1: targetY,
                        x2: (targetX + targetW), y2: (targetY + targetH)
                    });
                }
            };
            computeNextStep();
        },

        /*
         * requestAnimationFrame/cancelAnimationFrame polyfill
         * Based on https://gist.github.com/jlmakes/47eba84c54bc306186ac1ab2ffd336d4
         * and also https://gist.github.com/paulirish/1579671
         *
         * _requestAnimationFrameFn and _cancelAnimationFrameFn hold the current functions
         * But requestAnimationFrame and cancelAnimationFrame shall be called since
         * in order to be in window context
         */
        requestAnimationFrame: function(callback) {
            return this._requestAnimationFrameFn.call(window, callback);
        },
        cancelAnimationFrame: function(id) {
            this._cancelAnimationFrameFn.call(window, id);
        },
        _requestAnimationFrameFn: (function () {
            var polyfill = (function () {
                var clock = (new Date()).getTime();

                return function (callback) {
                    var currentTime = (new Date()).getTime();
                    if (currentTime - clock > 16) {
                        clock = currentTime;
                        callback(currentTime);
                    } else {
                        return setTimeout(function () {
                            polyfill(callback);
                        }, 0);
                    }
                };
            })();

            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                polyfill;
        })(),
        _cancelAnimationFrameFn: (function () {
            return window.cancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||
                window.msCancelAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                window.oCancelAnimationFrame ||
                window.oCancelRequestAnimationFrame ||
                clearTimeout;
        })(),

        /*
         * SetViewBox wrapper
         * Apply new viewbox values and keep track of them
         *
         * This avoid using the internal variable paper._viewBox which
         * may not be present in future version of Raphael
         */
        setViewBox: function(x, y, w, h) {
            var self = this;
            self.currentViewBox.x = x;
            self.currentViewBox.y = y;
            self.currentViewBox.w = w;
            self.currentViewBox.h = h;
            self.paper.setViewBox(x, y, w, h, false);
        },

        /*
         * Animate wrapper for Raphael element
         *
         * Perform an animation and ensure the non-animated attr are set.
         * This is needed for specific attributes like cursor who will not
         * be animated, and thus not set.
         *
         * If duration is set to 0 (or not set), no animation are performed
         * and attributes are directly set (and the callback directly called)
         */
        _nonAnimatedAttrs: [
            "arrow-end", "arrow-start", "gradient",
            "class", "cursor", "text-anchor",
            "font", "font-family", "font-style", "font-weight", "letter-spacing",
            "src", "href", "target", "title",
            "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit"
        ],
        /*
         * @param element Raphael element
         * @param attrs Attributes object to animate
         * @param duration Animation duration in ms
         * @param callback Callback to eventually call after animation is done
         */
        animate: function(element, attrs, duration, callback) {
            var self = this;
            if (!element) return;
            if (duration > 0) {
                var attrsNonAnimated = {};
                for (var i=0 ; i < self._nonAnimatedAttrs.length ; i++) {
                    var attrName = self._nonAnimatedAttrs[i];
                    if (attrs[attrName] !== undefined) {
                        attrsNonAnimated[attrName] = attrs[attrName];
                    }
                }
                element.attr(attrsNonAnimated);
                element.animate(attrs, duration, 'linear', function() {
                    if (callback) callback();
                });
            } else {
                element.attr(attrs);
                if (callback) callback();
            }
        },

        /*
         * Check for Raphael bug regarding drawing while beeing hidden (under display:none)
         * See https://github.com/neveldo/jQuery-Mapael/issues/135
         * @return true/false
         *
         * Wants to override this behavior? Use prototype overriding:
         *     $.mapael.prototype.isRaphaelBBoxBugPresent = function() {return false;};
         */
        isRaphaelBBoxBugPresent: function() {
            var self = this;
            var textElem = self.paper.text(-50, -50, "TEST");
            var textElemBBox = textElem.getBBox();
            textElem.remove();
            return (textElemBBox.width === 0 && textElemBBox.height === 0);
        },
        defaultOptions: {
            map: {
                cssClass: "map",
                tooltip: {
                    cssClass: "mapTooltip"
                },
                defaultArea: {
                    attrs: {
                        fill: "#343434",
                        stroke: "#5d5d5d",
                        "stroke-width": 1,
                        "stroke-linejoin": "round"
                    },
                    attrsHover: {
                        fill: "#f38a03",
                        animDuration: 300
                    },
                    text: {
                        position: "inner",
                        margin: 10,
                        attrs: {
                            "font-size": 15,
                            fill: "#c7c7c7"
                        },
                        attrsHover: {
                            fill: "#eaeaea",
                            "animDuration": 300
                        }
                    },
                    target: "_self",
                    cssClass: "area"
                },
                defaultPlot: {
                    type: "circle",
                    size: 15,
                    attrs: {
                        fill: "#0088db",
                        stroke: "#fff",
                        "stroke-width": 0,
                        "stroke-linejoin": "round"
                    },
                    attrsHover: {
                        "stroke-width": 3,
                        animDuration: 300
                    },
                    text: {
                        position: "right",
                        margin: 10,
                        attrs: {
                            "font-size": 15,
                            fill: "#c7c7c7"
                        },
                        attrsHover: {
                            fill: "#eaeaea",
                            animDuration: 300
                        }
                    },
                    target: "_self",
                    cssClass: "plot"
                },
                defaultLink: {
                    factor: 0.5,
                    attrs: {
                        stroke: "#0088db",
                        "stroke-width": 2
                    },
                    attrsHover: {
                        animDuration: 300
                    },
                    text: {
                        position: "inner",
                        margin: 10,
                        attrs: {
                            "font-size": 15,
                            fill: "#c7c7c7"
                        },
                        attrsHover: {
                            fill: "#eaeaea",
                            animDuration: 300
                        }
                    },
                    target: "_self",
                    cssClass: "link"
                },
                zoom: {
                    enabled: false,
                    minLevel: 0,
                    maxLevel: 10,
                    step: 0.25,
                    mousewheel: true,
                    touch: true,
                    animDuration: 200,
                    animEasing: "linear",
                    buttons: {
                        "reset": {
                            cssClass: "zoomButton zoomReset",
                            content: "&#8226;",
                            title: "Reset zoom"
                        },
                        "in": {
                            cssClass: "zoomButton zoomIn",
                            content: "+",
                            title: "Zoom in"
                        },
                        "out": {
                            cssClass: "zoomButton zoomOut",
                            content: "&#8722;",
                            title: "Zoom out"
                        }
                    }
                }
            },
            legend: {
                redrawOnResize: true,
                area: [],
                plot: []
            },
            areas: {},
            plots: {},
            links: {}
        },
        legendDefaultOptions: {
            area: {
                cssClass: "areaLegend",
                display: true,
                marginLeft: 10,
                marginLeftTitle: 5,
                marginBottomTitle: 10,
                marginLeftLabel: 10,
                marginBottom: 10,
                titleAttrs: {
                    "font-size": 16,
                    fill: "#343434",
                    "text-anchor": "start"
                },
                labelAttrs: {
                    "font-size": 12,
                    fill: "#343434",
                    "text-anchor": "start"
                },
                labelAttrsHover: {
                    fill: "#787878",
                    animDuration: 300
                },
                hideElemsOnClick: {
                    enabled: true,
                    opacity: 0.2,
                    animDuration: 300
                },
                slices: [],
                mode: "vertical"
            },
            plot: {
                cssClass: "plotLegend",
                display: true,
                marginLeft: 10,
                marginLeftTitle: 5,
                marginBottomTitle: 10,
                marginLeftLabel: 10,
                marginBottom: 10,
                titleAttrs: {
                    "font-size": 16,
                    fill: "#343434",
                    "text-anchor": "start"
                },
                labelAttrs: {
                    "font-size": 12,
                    fill: "#343434",
                    "text-anchor": "start"
                },
                labelAttrsHover: {
                    fill: "#787878",
                    animDuration: 300
                },
                hideElemsOnClick: {
                    enabled: true,
                    opacity: 0.2,
                    animDuration: 300
                },
                slices: [],
                mode: "vertical"
            }
        }

    };
    Mapael.version = version;
    if ($[pluginName] === undefined) $[pluginName] = Mapael;
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if ($.data(this, pluginName)) {
                $.data(this, pluginName).destroy();
            }
            $.data(this, pluginName, new Mapael(this, options));
        });
    };

    return Mapael;

}));
