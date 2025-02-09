import * as d3 from 'd3';
import { DrawBounding } from '../tensor/DrawBounding';

class OperatorExplainationDraw {
    constructor(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
        position: DrawBounding,
        description: string = '') {
        this.svg = svg;
        this.position = position;
        this.description = description;
        this.descriptionText = null;
    }

    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    position: DrawBounding;
    description: string;
    descriptionText: d3.Selection<SVGTextElement, unknown, null, undefined> | null;

    getLeftConnectionPoint(): [number, number] {
        return [
            this.position.x,
            this.position.y + this.position.height / 2
        ];
    }

    draw() {
        const explainGroup = this.svg.append('g')
            .attr('transform', `translate(${this.position.x}, ${this.position.y})`);

        // Create rounded rectangle with dotted stroke
        const rect = explainGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.position.width)
            .attr('height', this.position.height)
            .attr('rx', 8) // Rounded corners
            .attr('ry', 8)
            .attr('fill', 'rgba(255, 255, 255, 0.02)')
            .attr('stroke', 'rgba(255, 255, 255, 0.4)')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '3,3') // Dotted line
            .style('transition', 'all 0.2s ease');

        // Add description text
        this.descriptionText = explainGroup.append('text')
            .attr('x', this.position.width / 2)
            .attr('y', this.position.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .attr('font-size', '24px')
            .text(this.description);

        // Add hover effects
        explainGroup
            .on('mouseover', () => {
                rect
                    .attr('fill', 'rgba(255, 255, 255, 0.1)')
                    .attr('stroke', 'rgba(255, 255, 255, 0.8)');
            })
            .on('mouseout', () => {
                rect
                    .attr('fill', 'rgba(255, 255, 255, 0.02)')
                    .attr('stroke', 'rgba(255, 255, 255, 0.4)');
            });
    }

    updateDescription(newDescription: string) {
        this.description = newDescription;
        if (this.descriptionText) {
            this.descriptionText.text(newDescription);
        }
    }
}

export { OperatorExplainationDraw };
