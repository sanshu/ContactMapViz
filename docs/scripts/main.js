"use strict";function ContactMap(t,e,a,r){d3.select(t).html(this.buttonsHTML+this.alertHTML+this.cmHTML+this.tooltipHTML),this._width=d3.select(t).style("width"),this._width=+this._width.substring(0,this._width.length-2)}function toggle(t){$("#"+t).fadeToggle()}ContactMap.prototype.buttonsHTML='<div class="col-lg-12"><button type="button" class="btn btn-outline-primary active"data-toggle="button" onclick="toggle(\'cmap1\')">First</button><button type="button" class="btn btn-outline-warning active"  data-toggle="button" onclick="toggle(\'cmap2\')">Second</button><button type="button" class="btn btn-outline-danger active"  data-toggle="button" onclick="toggle(\'cmapsum\')">Difference</button></div>',ContactMap.prototype.alertHTML='<div class="alert alert-danger" role="alert" id="alertbox" hidden="hidden"></div>',ContactMap.prototype.cmHTML='<div class="col-lg-12"><div id="contactMaps"></div></div>',ContactMap.prototype.tooltipHTML='<div id="tooltip" class="hidden">    <p><span id="value"></p></div>',ContactMap.prototype.alert=function(t){$("#alertbox").html(t),$("#alertbox").show()},ContactMap.prototype.parse=function(t){var e,a,r=d3.dsvFormat("\t"),o=0,n=[],i=[],c=-1,s=r.parseRows(t,function(t,r){return o=Math.max(o,+t[1]),e=+t[0].substring(1),a=t[0].substring(0,1),n[e]=a,e=+t[5].substring(1),a=t[5].substring(0,1),i[e]=a,{id:r++,structure1:{res1:t[0],col:+t[1],res2:t[2],row:+t[3],value:+t[4]},structure2:{res1:t[5],col:+t[6],res2:t[7],row:+t[8],value:+t[9]}}});for(c=0;c<=o;c++)n[c]||(n[c]="-"),i[c]||(i[c]="-");return{max:o,matrix:s,seq1:n,seq2:i}},ContactMap.prototype.draw=function(t){if(0===t.lenght)return void this.alert("Data is empty");this.data=this.parse(t),this._draw()},ContactMap.prototype._createCMap=function(t,e,a,r,o){var n=this,i=a.append("g").attr("class","g3").attr("id",e).selectAll(".cellg").data(t,function(t){return t.row+":"+t.col}).enter();i.append("rect").attr("x",function(t){return t.col*r}).attr("y",function(t){return t.row*r}).attr("class",function(t){return"cell cell-border cr"+(t.row-1)+" cc"+(t.col-1)}).attr("width",r).attr("height",r).style("opacity",.7).style("fill",o).on("mouseover",function(t){n._createTooltip(t,n)}).on("mouseout",function(){d3.select("#tooltip").classed("hidden",!0)}),i.insert("rect").attr("y",function(t){return t.col*r}).attr("x",function(t){return t.row*r}).attr("class",function(t){return"cell cell-border cr"+(t.row-1)+" cc"+(t.col-1)}).attr("width",r).attr("height",r).style("opacity",.7).style("fill",o).on("mouseover",function(t){n._createTooltip(t,n)}).on("mouseout",function(){d3.select("#tooltip").classed("hidden",!0)})},ContactMap.prototype._getTooltipText=function(t,e){var a=this.data.seq1[t],r=this.data.seq1[e],o=this.data.seq2[t],n=this.data.seq2[e];return t+=1,e+=1,"CM1["+a+t+":"+r+e+"], CM2["+o+t+":"+n+e+"]"},ContactMap.prototype._createTooltip=function(t,e){d3.select("#tooltip").style("left",d3.event.pageX+10+"px").style("top",d3.event.pageY-10+"px").select("#value").text(e._getTooltipText(t.row,t.col)),d3.select("#tooltip").classed("hidden",!1)},ContactMap.prototype._draw=function(){function t(){M=d3.event.transform,w.attr("transform",M),m.call(g.scale(d3.event.transform.rescaleX(h))),b.call(v.scale(d3.event.transform.rescaleY(f)))}var e=this.data.matrix.filter(function(t){return t.structure1.value>0}).map(function(t){return{row:t.structure1.row,col:t.structure1.col,value:t.structure1.value,id:t.id}}),a=this.data.matrix.filter(function(t){return t.structure2.value>0}).map(function(t){return{row:t.structure2.row,col:t.structure2.col,value:t.structure2.value,id:t.id}}),r=this.data.matrix.filter(function(t){return t.structure1.value!=t.structure2.value}).map(function(t){return{row:t.structure2.row,col:t.structure2.col,value:t.structure2.value-t.structure1.value,id:t.id}}),o=this._width||900,n=this.data.max,i=n,c={top:50,right:20,bottom:20,left:50},s=Math.max(2,Math.floor((o-c.left-c.right)/(this.data.max+1))),l=Math.max(o,s*n),u=l;d3.select("#contactMaps").append("svg").remove();var d=d3.select("#contactMaps").append("svg").attr("width",l+c.left+c.right).attr("height",l+c.top+c.bottom),p=d.append("g").attr("transform","translate("+c.left+","+c.top+")"),h=d3.scaleLinear().domain([0,n]).range([0,l]),f=d3.scaleLinear().domain([0,i]).range([0,u]),g=d3.axisBottom(h).ticks((l+2)/(u+2)*10).tickSize(u).tickPadding(-8-u),v=d3.axisRight(f).ticks(10).tickSize(l).tickPadding(-l-18),m=p.append("g").attr("class","axis axis--x").call(g),b=p.append("g").attr("class","axis axis--y").call(v),M=null,w=p.append("g").attr("class","view");w.append("rect").attr("x",n*s).attr("y",i*s).attr("width",s).attr("height",s).attr("fill","magenta"),M&&w.attr("transform",M);var x=d3.zoom().scaleExtent([1,5]).translateExtent([[-20,-20],[l+20,u+20]]).on("zoom",t);d.call(x),this._createCMap(e,"cmap1",w,s,function(t){return"#007bff"}),this._createCMap(a,"cmap2",w,s,function(t){return"#ffc107"}),this._createCMap(r,"cmapsum",w,s,function(t){return t.value>0?"#D50000":"#28a745"})};