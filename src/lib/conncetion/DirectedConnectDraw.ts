import * as d3 from 'd3';

/**
 * TensorConnect class is used to draw a connection between two tensors.
 */
export class DirectedConnectDraw {
    constructor(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
         tensorFrom: [number, number], tensorTo: [number, number]) {
        this.svg = svg;
        this.tensorFrom = tensorFrom;
        this.tensorTo = tensorTo;
    }

    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    tensorFrom: [number, number];
    tensorTo: [number, number];

    draw() {
        // 定义箭头标记
        const markerId = `arrow-${Math.random().toString(36).substr(2, 9)}`; // 生成唯一ID
        this.svg.append('defs')
            .append('marker')
            .attr('id', markerId)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-3L7,0L0,3')
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255, 255, 255, 0.8)')
            .attr('stroke-width', 1);

        // Create dashed line path
        const path = this.svg.append('path')
            .data([{source: this.tensorFrom, target: this.tensorTo}])
            .attr('d', d3.linkHorizontal())
            .attr('stroke', 'rgba(255, 255, 255, 0.8)')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '6,3')
            .attr('marker-end', `url(#${markerId})`)
            .attr('fill', 'none');

        // Add animation
        function repeat() {
            path.attr('stroke-dashoffset', 100)
                .transition()
                .duration(10000)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .on('end', repeat);
        }

        repeat();
    }
}
