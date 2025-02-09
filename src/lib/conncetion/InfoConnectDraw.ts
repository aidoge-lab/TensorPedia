import * as d3 from 'd3';

/**
 * InfoConnect class is used to draw an information connection line made up of static dots.
 */
export class InfoConnectDraw {
    constructor(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
         pointFrom: [number, number], pointTo: [number, number]) {
        this.svg = svg;
        this.pointFrom = pointFrom;
        this.pointTo = pointTo;
    }

    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    pointFrom: [number, number];
    pointTo: [number, number];

    draw() {
        // Draw dashed line path
        // const path = d3.path();
        // path.moveTo(this.pointFrom[0], this.pointFrom[1]);
        // path.lineTo(this.pointTo[0], this.pointTo[1]);

        var dashing = "4, 4"

        // Create curved path using d3.linkVertical()
        const line = d3.line().curve(d3.curveStepBefore);

        const path = this.svg.append('path')
            .data([[this.pointFrom, this.pointTo]])
            .attr('d', line)
            .attr('stroke', 'rgba(255, 255, 255, 0.6)')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', dashing)
            .attr('fill', 'none')
        // Add animation to make the line appear gradually
        const totalLength = path.node()!.getTotalLength();

        var dashLength =
            dashing
                .split(/[\s,]/)
                .map(function (a) { return parseFloat(a) || 0 })
                .reduce(function (a, b) { return a + b });
        var dashCount = Math.ceil( totalLength / dashLength );

        var newDashes = new Array(dashCount).join( dashing + " " );
        var dashArray = newDashes + " 0, " + totalLength;

        
        path.attr('stroke-dashoffset', 100)
            .attr("stroke-dasharray", dashArray)
            .transition()
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0)
            .duration(400);
    }
}
