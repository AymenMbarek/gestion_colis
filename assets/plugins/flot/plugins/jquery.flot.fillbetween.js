/* Flot plugin for computing bottoms for filled line and bar charts.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The case: you've got two series that you want to fill the area between. In Flot
terms, you need to use one as the fill bottom of the other. You can specify the
bottom of each data point as the third coordinate manually, or you can use this
plugin to compute it for you.

In order to name the other series, you need to give it an id, like this:

    var dataset = [
        { data: [ ... ], id: "foo" } ,
        { data: [ ... ], fillBetween: "foo" },
    ];

    $.plot($("#placeholder"), dataset, { lines: { show: true, fill: true }});

As a convenience, if the id given is a number that doesn't appear as an id in
the series, it is interpreted as the index in the array instead (so fillBetween:
0 can also mean the first series).

Internally, the plugin modifies the datapoints in each series. For line series,
extra data points might be inserted through interpolation. Note that at points
where the bottom line is not defined (due to a null point or start/end of line),
the current line will show a gap too. The algorithm comes from the
jquery.flot.stack.js plugin, possibly some code could be shared.

*/

(function ($) {
    var options = {
        series: {
            fillBetween: null
        }
    };

    function init(plot) {
        function findBottomSeries(s, allseries) {
            var i;

            for (i = 0; i < allseries.length; ++i) {
                if (allseries[ i ].id === s.fillBetween) {
                    return allseries[ i ];
                }
            }

            if (typeof s.fillBetween === "number") {
                if (s.fillBetween < 0 || s.fillBetween >= allseries.length) {
                    return null;
                }
                return allseries[ s.fillBetween ];
            }

            return null;
        }

        function computeFormat(plot, s, data, datapoints) {
            if (s.fillBetween == null) {
                return;
            }

            var format = datapoints.format;
            var plotHasId = function(id) {
                var plotData = plot.getData();
                for (var i = 0; i < plotData.length; i++) {
                    if (plotData[i].id === id) {
                        return true;
                    }
                }

                return false;
            }

            if (!format) {
                format = [];

                format.push({
                    x: true,
                    number: true,
                    computeRange: s.xaxis.options.autoScale !== 'none',
                    required: true
                });
                format.push({
                    y: true,
                    number: true,
                    computeRange: s.yaxis.options.autoScale !== 'none',
                    required: true
                });

                if (s.fillBetween !== undefined && s.fillBetween !== '' && plotHasId(s.fillBetween) && s.fillBetween !== s.id) {
                    format.push({
                        x: false,
                        y: true,
                        number: true,
                        required: false,
                        computeRange: s.yaxis.options.autoScale !== 'none',
                        defaultValue: 0
                    });
                }

                datapoints.format = format;
            }
        }

        function computeFillBottoms(plot, s, datapoints) {
            if (s.fillBetween == null) {
                return;
            }

            var other = findBottomSeries(s, plot.getData());

            if (!other) {
                return;
            }

            var ps = datapoints.pointsize,
                points = datapoints.points,
                otherps = other.datapoints.pointsize,
                otherpoints = other.datapoints.points,
                newpoints = [],
                px, py, intery, qx, qy, bottom,
                withlines = s.lines.show,
                withbottom = ps > 2 && datapoints.format[2].y,
                withsteps = withlines && s.lines.steps,
                fromgap = true,
                i = 0,
                j = 0,
                l, m;

            while (true) {
                if (i >= points.length) {
                    break;
                }

                l = newpoints.length;

                if (points[ i ] == null) {
                    for (m = 0; m < ps; ++m) {
                        newpoints.push(points[ i + m ]);
                    }

                    i += ps;
                } else if (j >= otherpoints.length) {
                    if (!withlines) {
                        for (m = 0; m < ps; ++m) {
                            newpoints.push(points[ i + m ]);
                        }
                    }

                    i += ps;
                } else if (otherpoints[ j ] == null) {
                    for (m = 0; m < ps; ++m) {
                        newpoints.push(null);
                    }

                    fromgap = true;
                    j += otherps;
                } else {
                    px = points[ i ];
                    py = points[ i + 1 ];
                    qx = otherpoints[ j ];
                    qy = otherpoints[ j + 1 ];
                    bottom = 0;

                    if (px === qx) {
                        for (m = 0; m < ps; ++m) {
                            newpoints.push(points[ i + m ]);
                        }
                        bottom = qy;

                        i += ps;
                        j += otherps;
                    } else if (px > qx) {

                        if (withlines && i > 0 && points[ i - ps ] != null) {
                            intery = py + (points[ i - ps + 1 ] - py) * (qx - px) / (points[ i - ps ] - px);
                            newpoints.push(qx);
                            newpoints.push(intery);
                            for (m = 2; m < ps; ++m) {
                                newpoints.push(points[ i + m ]);
                            }
                            bottom = qy;
                        }

                        j += otherps;
                    } else {

                        if (fromgap && withlines) {
                            i += ps;
                            continue;
                        }

                        for (m = 0; m < ps; ++m) {
                            newpoints.push(points[ i + m ]);
                        }

                        if (withlines && j > 0 && otherpoints[ j - otherps ] != null) {
                            bottom = qy + (otherpoints[ j - otherps + 1 ] - qy) * (px - qx) / (otherpoints[ j - otherps ] - qx);
                        }

                        i += ps;
                    }

                    fromgap = false;

                    if (l !== newpoints.length && withbottom) {
                        newpoints[ l + 2 ] = bottom;
                    }
                }

                if (withsteps && l !== newpoints.length && l > 0 &&
                    newpoints[ l ] !== null &&
                    newpoints[ l ] !== newpoints[ l - ps ] &&
                    newpoints[ l + 1 ] !== newpoints[ l - ps + 1 ]) {
                    for (m = 0; m < ps; ++m) {
                        newpoints[ l + ps + m ] = newpoints[ l + m ];
                    }
                    newpoints[ l + 1 ] = newpoints[ l - ps + 1 ];
                }
            }

            datapoints.points = newpoints;
        }

        plot.hooks.processRawData.push(computeFormat);
        plot.hooks.processDatapoints.push(computeFillBottoms);
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: "fillbetween",
        version: "1.0"
    });
})(jQuery);
