/**
 * @author Mayya Sedova <msedova.dev@gmail.com>
 */

function ContactMap(parentId) {
    d3.select(parentId).html('<div class="row px-3" id="cmControls" style="width:100%">' + this.buttonsHTML + this.alertHTML + '</div>' + this.cmHTML + this.tooltipHTML);
    this.hideAlert();
    this._parentId = parentId;
    this.setVisualProps(this._defaultVisualProperties);
}

ContactMap.prototype._defaultVisualProperties = {
    colors: {
        cmap1: '#007bff',
        cmapText1: 'white', // button text
        cmap2: '#ffc107',
        cmapText2: 'black', // button text
        positiveDiff: '#dc3545',
        negativeDiff: 'green',
        cmapTextDiff: 'white', // button text
    }
};
ContactMap.prototype.visualProperties = {};

ContactMap.prototype.setVisualProps = function (newProps) {
    // let merged = { ...this._defaultVisualProperties, ...newProps };
    const merged = Object.assign(this._defaultVisualProperties, newProps );
    console.log(merged)
    this.visualProperties = merged;
    
    const colors = this.visualProperties.colors;
    applyBtnColor('cmap-btn-1', colors.cmap1, colors.cmapText1);
    applyBtnColor('cmap-btn-2', colors.cmap2, colors.cmapText2);
    applyBtnColor('cmap-btn-diff', colors.positiveDiff, colors.cmapTextDiff);

    function applyBtnColor(id, color, textColor){
        const style='color:'+textColor+';background-color:'+color+';border-color:' +color;
        d3.select('#'+id)
        .attr('style', style);
    }
}

ContactMap.prototype.buttonsHTML = '<div class="col-6">' +
    '<button type="button" id="cmap-btn-1" class="btn btn-outline btn-sm active mx-1"' +
    'data-toggle="button" onclick="toggle(\'cmap1\')">First</button>' +
    '<button type="button" id="cmap-btn-2" class="btn btn-sm active mx-1" ' +
    ' data-toggle="button" onclick="toggle(\'cmap2\')">Second</button>' +
    '<button type="button" id="cmap-btn-diff" class="btn btn-sm active mx-1" ' +
    ' data-toggle="button" onclick="toggle(\'cmapsum\')">Difference</button>' +
    '</div>';
ContactMap.prototype.alertHTML = '<div class="alert alert-light col-6" role="alert" ' +
    'id="alertbox">&nbsp;</div>'
ContactMap.prototype.cmHTML = '<div class="row"><div class="col-12"><div id="contactMaps"></div></div>';
ContactMap.prototype.tooltipHTML = '<div id="tooltip" class="hidden">' +
    '<p><span id="value"></p>' + '</div></div>';

ContactMap.prototype.ccellSize = 1; // calculated cell size for public use

ContactMap.prototype.clear = function () {
    this.hideAlert();
    this._width = 0;
    this.data = null;
    d3.select('#contactMaps').select('svg').remove();
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
        return { max: max, matrix: dataArray, seq1: json.seq1, seq2: json.seq2, datasum: sumMatrix };
    } catch (e) {
        console.error(e);
        this.alert('Wrong input format. Required format: [res1 gridX res2 gridY strustureId]');
        return null;
    }
}

ContactMap.prototype.draw = function (json) {
    this.clear();
    console.log('CM Cleared..');

    if (json === null) {
        this.alert('Input data is empty.');
        return;
    }

    var pleft = parseInt(d3.select(this._parentId).style('padding-left')),
        pright = parseInt(d3.select(this._parentId).style('padding-right'));
    this._width = parseInt(d3.select(this._parentId).style('width'))
        - pleft - pright - 15; // little less than inner width of parent element


    this.data = this._parse(json);
    //    console.log(this.data);
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
            return (d.col - 1) * cellSize;
        })
        .attr('y', function (d) {
            return (d.row - 1) * cellSize;
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
        .on('click', function (d) {
            self._contactClicked(d);
        });

    // add mirrored element
    enterSelection.insert('rect')
        .attr('y', function (d) {
            return (d.col - 1) * cellSize;
        })
        .attr('x', function (d) {
            return (d.row - 1) * cellSize;
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
        .on('click', function (d) {
            self._contactClicked(d);
        });
    ;

};


ContactMap.prototype.getResiduesAt = function (r, c) {
    var cm1 = '', cm2 = '', result = {};

    var cm1data = this.data1.filter(d => (
        d.row === r && d.col === c)
        || (d.row === c && d.col === r)
    );

    if (cm1data[0]) {
        result.cm1 = {};
        result.cm1.res1 = cm1data[0].res1;
        result.cm1.res2 = cm1data[0].res2;
    }

    var cm2data = this.data2.filter(d => (
        d.row === r && d.col === c)
        || (d.row === c && d.col === r)
    );

    if (cm2data[0]) {
        result.cm2 = {};
        result.cm2.res1 = cm2data[0].res1;
        result.cm2.res2 = cm2data[0].res2;
    }
    return result;
};

ContactMap.prototype._getTooltipText = function (r, c) {
    var cm1 = '', cm2 = '';

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

    if (cm1.length > 0 && cm2.length > 0)
        return cm1 + ', ' + cm2;
    else if (cm1.length === 0 && cm2.length === 0) {
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
    //    console.log('Data1: ');
    //    console.log(this.data1);

    this.data2 = this.data.matrix
        .filter(d => d.structId === 2 && d.value > 0);

    //    console.log('Data2: ');
    //    console.log(this.data2);

    var datasum = [];
    this.data.datasum.forEach(function (r, i) {
        r.forEach(function (c, j) {
            if (c !== 0) {
                datasum.push({
                    row: i, col: j,
                    value: c
                })
            }
        });
    }
    );

    //    console.log('Datasum: ');
    //    console.log(datasum);


    this.alert(`There are ${datasum.length} non-matching contacts.`);

    var outerwidth = this._width || 400,
        cols = this.data.max,
        rows = cols,
        margin = { top: 25, right: 20, bottom: 20, left: 20 },
        innerWidth = outerwidth - margin.left - margin.right,
        cellSize = innerWidth / cols,
        width = innerWidth,
        height = innerWidth,
        currentTransform = null;

    this.ccellSize = cellSize; // TODO: refactor to use this instead of function param    
    var zoom = d3.zoom()
        .scaleExtent([1, 5])
        .translateExtent([
            [-10, -12],
            [width + 20, height + 20]
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

    const colors = this.visualProperties.colors
    this._createCMap(this.data1, 'cmap1', view, cellSize, function (d) {
        return colors.cmap1;
    });

    this._createCMap(this.data2, 'cmap2', view, cellSize, function (d) {
        return colors.cmap2;
    });

    this._createCMap(datasum, 'cmapsum', view, cellSize, function (d) {
        // return (d.value > 0) ? '#D50000' : '#28a745';
        return (d.value > 0) ? colors.positiveDiff : colors.negativeDiff;
    });

    var hlights = view.append('g').attr('id', 'hlights');
    d3.select('#hlights').append('circle').attr('id', 'hlight1')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0);
    d3.select('#hlights').append('circle').attr('id', 'hlight2')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0);

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
    svg.call(zoom).on('wheel.zoom', null)	
        .on('dblclick.zoom', null);
};


ContactMap.prototype.highlightContact = function (row, col, color = 'yellow', radius = 3) {
    const r = radius * this.ccellSize;

    const x = row ? (row - 0.5) * this.ccellSize : 0;
    const y = col ? (col - 0.5) * this.ccellSize : 0;

    d3.select('#hlights').select('#hlight1')
        .attr('cx', x)
        .attr('cy', y);

    d3.select('#hlights').select('#hlight2')
        .attr('cx', y)
        .attr('cy', x);

    d3.select('#hlights').selectAll('circle')
        .attr('r', 0)
        .attr('stroke', color)
        .attr('stroke-opacity', 1)
        .attr('fill', 'none')
        .attr('opacity', 1)
        .transition().duration(1000)
        .attr('r', r);
}

ContactMap.prototype.removeHighlight = function () {
    d3.select('#hlights').selectAll('circle').attr('r', 0).attr('opacity', 0);
}
ContactMap.prototype._contactClicked = function (d) {
    // d is the data point, has row and col property
    let residues = this.getResiduesAt(d.row, d.col);
    d.residues = residues;
    this._processContactClick(d);
};

ContactMap.prototype._processContactClick = function (d) {
    console.log('clicked');
};

ContactMap.prototype.onContactClick = function (callback) {
    if (typeof callback === 'function') {
        this._processContactClick = callback;
    } else {
        console.error('Callback is not a function!')
    }
}

ContactMap.prototype.toggleControls = function (on) {
    on ? d3.select('#cmControls').attr('hidden', null)
        : d3.select('#cmControls').attr('hidden', '');
}

function toggle(id) {
    $('#' + id).fadeToggle();
}