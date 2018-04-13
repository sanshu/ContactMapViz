/**
 * @author Mayya Sedova <msedova.dev@gmail.com>
 */

function ContactMap(parentId, data, width, height) {

// build template

    d3.select(parentId).html(this.buttonsHTML + this.alertHTML + this.cmHTML + this.tooltipHTML);
    this._width = d3.select(parentId).style('width');
    this._width = +this._width.substring(0, this._width.length - 2);
}


ContactMap.prototype.buttonsHTML = '<div class="col-lg-12">' +
    '<button type="button" class="btn btn-outline-primary active"' +
    'data-toggle="button" onclick="toggle(\'cmap1\')">First</button>' +
    '<button type="button" class="btn btn-outline-warning active" ' +
    ' data-toggle="button" onclick="toggle(\'cmap2\')">Second</button>' +
    '<button type="button" class="btn btn-outline-danger active" ' +
    ' data-toggle="button" onclick="toggle(\'cmapsum\')">Difference</button>' +
    '</div>';
ContactMap.prototype.alertHTML = '<div class="alert alert-danger" role="alert" ' +
    'id="alertbox" hidden="hidden"></div>'
ContactMap.prototype.cmHTML = '<div class="col-lg-12"><div id="contactMaps"></div></div>';
ContactMap.prototype.tooltipHTML = '<div id="tooltip" class="hidden">    ' +
    '<p><span id="value"></p>' +
    '</div>';


ContactMap.prototype.alert = function (text) {
    $('#alertbox').html(text);
    $('#alertbox').show();
}

ContactMap.prototype.parse = function (data) {
//    console.log(data);
    var dsv = d3.dsvFormat('\t');
    var max = 0;
    var seq1 = [], seq2 = [];
    var i = -1, n, c;
    var dataArray = dsv.parseRows(data, function (d, i) {
//        console.log (d);
//        if (i < 3)
//            return null; // skip headers - no more valid
        max = Math.max(max, +d[1]);
        n = +d[0].substring(1);
        c = d[0].substring(0, 1);
        seq1[n] = c;

        n = +d[5].substring(1);
        c = d[5].substring(0, 1);
        seq2[n] = c;

        return {
            id: i++,
            structure1: {
                res1: d[0],
                col: +d[1], //grx
                res2: d[2],
                row: +d[3], //gry
                value: +d[4] //cont
            },
            structure2: {
                res1: d[5],
                col: +d[6],
                res2: d[7],
                row: +d[8],
                value: +d[9]
            }
        };
    });
//    console.log(dataArray);

    for (i = 0; i <= max; i++) {
        if (!seq1[i]) {
            seq1[i] = '-';
        }
        if (!seq2[i]) {
            seq2[i] = '-';
        }
    }
    return {max: max, matrix: dataArray, seq1: seq1, seq2: seq2};
}

ContactMap.prototype.draw = function (text) {
    if (text.lenght === 0) {
        this.alert('Data is empty');
        return;
    }

    this.data = this.parse(text);
    this._draw();
}; // end of draw()


ContactMap.prototype._createCMap = function (data, id, svg, cellSize, colorCallback) {
    const self = this;
    var enterSelection = svg.append('g').attr('class', 'g3').attr('id', id)
        .selectAll('.cellg')
        .data(data, function (d) {
            return d.row + ':' + d.col;
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

}

ContactMap.prototype._getTooltipText = function (r, c) {
    var res1 = this.data.seq1[r];
    var res2 = this.data.seq1[c];
    var res3 = this.data.seq2[r];
    var res4 = this.data.seq2[c];
    r = r + 1;
    c = c + 1;
    return 'CM1[' + res1 + r + ':' + res2 + c + '], CM2[' + res3 + r + ':' + res4 + c + ']';
};

ContactMap.prototype._createTooltip = function (d, self) {
    //Update the tooltip position and value

    d3.select('#tooltip')
        .style('left', (d3.event.pageX + 10) + 'px')
        .style('top', (d3.event.pageY - 10) + 'px')
        .select('#value')
        .text(self._getTooltipText(d.row, d.col));
    d3.select('#tooltip').classed('hidden', false);
};

ContactMap.prototype._draw = function () {

    var data1 = this.data.matrix
        .filter(d => d.structure1.value > 0)
        .map(d => {
            return{row: d.structure1.row, col: d.structure1.col,
                value: d.structure1.value, id: d.id};
        });

    var data2 = this.data.matrix
        .filter(d => d.structure2.value > 0)
        .map(d => {
            return{row: d.structure2.row, col: d.structure2.col,
                value: d.structure2.value, id: d.id};
        });

    var datasum = this.data.matrix
        .filter(d =>
            d.structure1.value !=
                d.structure2.value
        )
        .map(d => {
            return{row: d.structure2.row, col: d.structure2.col,
                value: d.structure2.value - d.structure1.value, id: d.id};
        });

    var adjwidth = this._width || 900,
        cols = this.data.max,
        rows = cols,
        margin = {top: 50, right: 20, bottom: 20, left: 50},
        cellSize = Math.max(2, Math.floor((adjwidth - margin.left - margin.right) / (this.data.max + 1))),
        width = Math.max(adjwidth, cellSize * cols),
        height = width;

    d3.select('#contactMaps').append('svg').remove();
    var svg = d3.select('#contactMaps').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', width + margin.top + margin.bottom);

    var viewShifted = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        ;
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
    var currentTransform = null;

    var view = viewShifted.append('g')
        .attr('class', 'view');

    view.append('rect')
        .attr('x',
            cols * cellSize
            )
        .attr('y',
            rows * cellSize
            )

        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', 'magenta');


    if (currentTransform)
        view.attr('transform', currentTransform);

    var zoom = d3.zoom()
        .scaleExtent([1, 5])
        .translateExtent([
            [-20, -20],
            [width + 20, height + 20]
        ])
        .on('zoom', zoomed);

    function zoomed() {
        currentTransform = d3.event.transform;
        view.attr('transform', currentTransform);
        gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
        gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));
    }
    svg.call(zoom);

    this._createCMap(data1, 'cmap1', view, cellSize, function (d) {
        return '#007bff';
    });

    this._createCMap(data2, 'cmap2', view, cellSize, function (d) {
        return '#ffc107';
    });

    this._createCMap(datasum, 'cmapsum', view, cellSize, function (d) {
        return  (d.value > 0) ? '#D50000' : '#28a745';
    });

};

function toggle(id) {
    $('#' + id).fadeToggle();
}