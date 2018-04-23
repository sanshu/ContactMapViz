/**
 * @author Mayya Sedova <msedova.dev@gmail.com>
 */

function ContactMap(parentId) {
    d3.select(parentId).html('<div class="row px-3" style="width:100%">' + this.buttonsHTML + this.alertHTML + '</div>' + this.cmHTML + this.tooltipHTML);
    this.hideAlert();
    this._parentId = parentId;
}

ContactMap.prototype.buttonsHTML = '<div class="col-6">' +
    '<button type="button" class="btn btn-outline-primary btn-sm active mx-1"' +
    'data-toggle="button" onclick="toggle(\'cmap1\')">First</button>' +
    '<button type="button" class="btn btn-outline-warning btn-sm active mx-1" ' +
    ' data-toggle="button" onclick="toggle(\'cmap2\')">Second</button>' +
    '<button type="button" class="btn btn-outline-danger btn-sm active mx-1" ' +
    ' data-toggle="button" onclick="toggle(\'cmapsum\')">Difference</button>' +
    '</div>';
ContactMap.prototype.alertHTML = '<div class="alert alert-light col-6" role="alert" ' +
    'id="alertbox">&nbsp;</div>'
ContactMap.prototype.cmHTML = '<div class="row"><div class="col-12"><div id="contactMaps"></div></div>';
ContactMap.prototype.tooltipHTML = '<div id="tooltip" class="hidden">' +
    '<p><span id="value"></p>' +
    '</div></div>';

ContactMap.prototype.clear = function () {
    this.hideAlert();
    this._width = 0;
    this.data = null;
    d3.select('svg').remove();
    d3.select('#contactMaps').select('*').remove();
};

ContactMap.prototype.alert = function (text) {
    d3.select('#alertbox').html(text);
};


ContactMap.prototype.hideAlert = function () {
    d3.select('#alertbox').html('');
};


ContactMap.prototype._parse = function (json) {
    var data = json.matrix;

//    console.log(data);
    /*
     * column 1 is residue type and number for the 1-st residue in a contact
     column 2 is the x coordinate for this contact on the graph
     column 3 is residue type and number for the 2nd residue in a contact
     column 4 is the y coordinate for this contact on the graph
     column 5 is structure number (1 or 2)
     */
    try {
        var dsv = d3.dsvFormat('\t');
        var max = 0;
        var n, s, r, c;
        var sumMatrix = [];
        var op = 1;
        var dataArray = dsv.parseRows(data, function (d, i) {

            c = +d[1];
            r = +d[3];
            max = Math.max(max, r, c);

            n = +d[1];
            s = d[0].substring(0, 1);

            if (+d[4] === 1) {
                op = 1;
            } else {
                op = -1;
            }

            if (!sumMatrix[c]) {
                sumMatrix[c] = [];
            }
            var m = sumMatrix[c][r];
            m = m ? m + op : op;

            sumMatrix[c][r] = m;

            return {
                id: i++,
                res1: d[0],
                col: c, //grx
                res2: d[2],
                row: r, //gry
                structId: +d[4], //cont
                value: 1
            };
        });
//    console.log(max);
//
        return {max: max, matrix: dataArray, seq1: json.seq1, seq2: json.seq2, datasum: sumMatrix};
    } catch (e) {
        console.log(e);
        this.alert('Wrong input format. Required format: [res1 gridX res2 gridY strustureId]');
        return null;
    }
}

ContactMap.prototype.draw = function (json) {
    this.clear();
    console.log('Cleared..');

    if (json === null) {
        this.alert('Input data is empty.');
        return;
    }

    var pleft = parseInt(d3.select(this._parentId).style('padding-left')),
        pright = parseInt(d3.select(this._parentId).style('padding-right'));
    this._width = parseInt(d3.select(this._parentId).style('width'))
        - pleft - pright - 15; // little less than inner width of parent element


    this.data = this._parse(json);
    console.log(this.data);
    if (this.data !== null) {
        this._draw();
    }
}; // end of draw()

ContactMap.prototype._addSequences = function (svg, cellSize) {
    const self = this;

    if (this.data.seq1) {
        var enterSelection = svg.append('g').attr('class', 'g3')
            .attr('id', 'sequences1')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('font-size', cellSize * 1.2)
            .selectAll('.seq')
            .data(this.data.seq1, function (d) {
                return d;   /// ????
            })
            .enter();


        // 1st sequence
        enterSelection.append('text')
            .attr('dx', function (d, i) {
                return (i + 0.5) * cellSize;
            })
            .attr('dy', function (d) {
                return -cellSize * 3;
            })
            .text(function (d, i) {
                return d;
            });

        //vertical
        enterSelection.append('text')
            .attr('dy', function (d, i) {
                return (i + 1) * cellSize;
            })
            .attr('dx', function (d) {
                return -cellSize * 3;
            })
            .text(function (d, i) {
                return d;
            });
    }

    if (this.data.seq2) {
        enterSelection = svg.append('g').attr('class', 'g3')
            .attr('id', 'sequences2')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('font-size', cellSize * 1.2)
            .selectAll('.seq')
            .data(this.data.seq2, function (d) {
                return d;   /// ????
            })
            .enter();

        enterSelection.append('text')
            .attr('dx', function (d, i) {
                return (i + 0.5) * cellSize;
            })
            .attr('dy', function (d) {
                return -cellSize;
            })
            .text(function (d) {
                return d;
            });

        //vertical
        enterSelection.append('text')
            .attr('dy', function (d, i) {
                return (i + 1) * cellSize;
            })
            .attr('dx', function (d) {
                return -cellSize;
            })
            .text(function (d, i) {
                return d;
            });
    }
};

ContactMap.prototype._createCMap = function (data, id, svg, cellSize, colorCallback) {
    const self = this;
    var enterSelection = svg.append('g').attr('class', 'g3').attr('id', id)
        .selectAll('.cellg')
        .data(data, function (d) {
            return d.row + ':' + d.col;  /// ???? why?
        })
        .enter();

    enterSelection
        .append('rect')
        .attr('x', function (d) {
            return d.col * cellSize;
        })
        .attr('y', function (d) {
            return d.row * cellSize;
        })
        .attr('class', function (d) {
            return 'cell cell-border cr' + (d.row - 1) + ' cc' + (d.col - 1);
        })
        .attr('width', cellSize)
        .attr('height', cellSize)
//        .attr('data-grid-x', d => d.col)
//        .attr('data-grid-y', d => d.row)
        .style('opacity', 0.7)
        .style('fill', colorCallback)
        .on('mouseover', function (d) {
            self._createTooltip(d, self);
        })
        .on('mouseout', function () {
            d3.select('#tooltip').classed('hidden', true);
        });

    // add mirrored element
    enterSelection.insert('rect')
        .attr('y', function (d) {
            return d.col * cellSize;
        })
        .attr('x', function (d) {
            return d.row * cellSize;
        })
        .attr('class', function (d) {
            return 'cell cell-border cr' + (d.row - 1) + ' cc' + (d.col - 1);
        })
        .attr('width', cellSize)
        .attr('height', cellSize)
        .style('opacity', 0.7)
        .style('fill', colorCallback)
        .on('mouseover', function (d) {
            self._createTooltip(d, self);
        })
        .on('mouseout', function () {
            d3.select('#tooltip').classed('hidden', true);
        })
        ;

};

ContactMap.prototype._getTooltipText = function (r, c) {
    var cm1 = '', cm2 = '';

//    if (this.data.seq1) {
//        var res1 = this.data.seq1[r];
//        var res2 = this.data.seq1[c];
//        cm1 = 'CM1[' + res1 + (r + 1) + ':' + res2 + (c + 1) + ']';
//    }
//    if (this.data.seq2) {
//        var res3 = this.data.seq2[r];
//        var res4 = this.data.seq2[c];
//        cm2 = 'CM2[' + res3 + (r + 1) + ':' + res4 + (c + 1) + ']';
//    }
    var cm1data = this.data1.filter(d => (
            d.row === r && d.col === c)
            || (d.row === c && d.col === r)
    );
    if (cm1data[0]) {
        cm1 = 'CM1[' + cm1data[0].res1 + ':' + cm1data[0].res2 + ']';
    }
    var cm2data = this.data2.filter(d => (
            d.row === r && d.col === c)
            || (d.row === c && d.col === r)
    );
    if (cm2data[0]) {
        cm2 = 'CM2[' + cm2data[0].res1 + ':' + cm2data[0].res2 + ']';
    }
    if (cm1.length > 0 || cm2.length > 0)
        return cm1 + ', ' + cm2;
    else if (cm1.length === 0 || cm2.length === 0) {
        return 'Grid: [' + (r + 1) + ':' + (c + 1) + ']';
    } else {
        return cm1 + cm2;
    }
};

ContactMap.prototype._createTooltip = function (d, self) {
    d3.select('#tooltip')
        .style('left', (d3.event.pageX + 10) + 'px')
        .style('top', (d3.event.pageY - 10) + 'px')
        .select('#value')
        .text(self._getTooltipText(d.row, d.col));
    d3.select('#tooltip').classed('hidden', false);
};

ContactMap.prototype._draw = function () {

    this.data1 = this.data.matrix
        .filter(d => d.structId === 1 && d.value > 0);
    console.log('Data1: ');
    console.log(this.data1);

    this.data2 = this.data.matrix
        .filter(d => d.structId === 2 && d.value > 0);

    console.log('Data2: ');
    console.log(this.data2);

    var datasum = [];
    this.data.datasum.forEach(function (r, i) {
        r.forEach(function (c, j) {
            if (c !== 0) {
                datasum.push({row: i, col: j,
                    value: c})
            }
        });
    }
    );

    console.log('Datasum: ');
    console.log(datasum);


    this.alert(`There are ${datasum.length} non-matching contacts.`);

    var outerwidth = this._width || 400,
        cols = this.data.max,
        rows = cols,
        margin = {top: 50, right: 20, bottom: 20, left: 50},
        innerWidth = outerwidth - margin.left - margin.right,
        cellSize = innerWidth / cols,
        width = innerWidth,
        height = innerWidth,
        currentTransform = null;

    var zoom = d3.zoom()
        .scaleExtent([.75, 5])
        .translateExtent([
            [-20, -20],
            [width + 40, height + 40]
        ])
        .on('zoom', zoomed);

// add slider instead of mousewheel zoom to improve user experience
// have it start at min 50% and max out at 5x the amount.
// you'll also have to add slider.attr('value', d3.event.scale) in the zoom method to update slider
    var slider = d3.select('#contactMaps').append('input')
        .datum({})
        .attr('type', 'range')
        .attr('value', 1)
        .attr('min', zoom.scaleExtent()[0])
        .attr('max', zoom.scaleExtent()[1])
        .attr('step', (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
        .on('input', slided);


    var svg = d3.select('#contactMaps').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', width + margin.top + margin.bottom);

    var viewShifted = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    /////// GRID
    var xScale = d3.scaleLinear()
        .domain([0, cols])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, rows])
        .range([0, height]);

    var xAxis = d3.axisBottom(xScale)
        .ticks((width + 2) / (height + 2) * 10)
        .tickSize(height)
        .tickPadding(-8 - height);

    var yAxis = d3.axisRight(yScale)
        .ticks(10)
        .tickSize(width)
        .tickPadding(-width - 18);

    var gX = viewShifted.append('g')
        .attr('class', 'axis axis--x')
        .call(xAxis);
    var gY = viewShifted.append('g')
        .attr('class', 'axis axis--y')
        .call(yAxis);
    //// END OF GRID

    ////  ZOOM
    var view = viewShifted.append('g')
        .attr('class', 'view');

    this._addSequences(view, cellSize);

    this._createCMap(this.data1, 'cmap1', view, cellSize, function (d) {
        return '#007bff';
    });

    this._createCMap(this.data2, 'cmap2', view, cellSize, function (d) {
        return '#ffc107';
    });

    this._createCMap(datasum, 'cmapsum', view, cellSize, function (d) {
        return  (d.value > 0) ? '#D50000' : '#28a745';
    });


    if (currentTransform)
        view.attr('transform', currentTransform);
///---------

    function zoomed() {
        currentTransform = d3.event.transform;
        view.attr('transform', currentTransform);
        gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
        gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));
    }

    function slided(d) {
        zoom.scaleTo(svg, d3.select(this).property('value'));
    }
    // disable zoom on mousewheel and double click
    svg.call(zoom).on('wheel.zoom', null)
        .on('dblclick.zoom', null);

};

function toggle(id) {
    $('#' + id).fadeToggle();
}