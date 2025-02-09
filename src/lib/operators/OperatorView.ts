import * as d3 from 'd3';
import { DrawBounding } from '../tensor/DrawBounding';

class OperatorView {
    constructor(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
         position: DrawBounding,
         symbol = '+',
         description = 'No Name',
        drawSymbol = (svg: d3.Selection<SVGGElement, unknown, null, undefined>, maxSize: number) => {}) {
        this.svg = svg;
        this.position = position;
        this.symbol = symbol;
        this.description = description;
        this.descriptionText = null; // 保存对文本元素的引用
        this.drawSymbol = drawSymbol;
    }

    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    position: DrawBounding;
    symbol: string;
    description: string;
    descriptionText: d3.Selection<SVGTextElement, unknown, null, undefined> | null;
    drawSymbol: (svg: d3.Selection<SVGGElement, unknown, null, undefined>, maxSize: number) => void;
    getRightConnectionPoint(): [number, number] {
        return [
            this.position.x + this.position.width,
            this.position.y + this.position.height / 2
        ];
    }

    getLeftConnectionPoint(): [number, number] {
        return [
            this.position.x,
            this.position.y + this.position.height / 2
        ];
    }

    getBottomPosition(): [number, number] {
        return [
            this.position.x + this.position.width / 2,
            this.position.y + this.position.height
        ];
    }
    
    draw() {
        const operatorGroup = this.svg.append('g')
            .attr('transform', `translate(${this.position.x}, ${this.position.y})`);

        // Create outer circle for hover effect
        const circle = operatorGroup.append('circle')
            .attr('cx', this.position.width / 2)
            .attr('cy', this.position.height / 2)
            .attr('r', Math.min(this.position.width, this.position.height) / 2.0)
            .attr('fill', 'rgba(255, 255, 255, 0.02)')
            .attr('stroke', 'rgba(255, 255, 255, 0.2)')
            .attr('stroke-width', 1)
            .style('transition', 'all 0.2s ease');

        // Add hover effects
        operatorGroup
            .on('mouseover', () => {
                circle
                    .attr('fill', 'rgba(255, 255, 255, 0.1)')
                    .attr('stroke', 'rgba(255, 255, 255, 0.8)');
            })
            .on('mouseout', () => {
                circle
                    .attr('fill', 'rgba(255, 255, 255, 0.02)')
                    .attr('stroke', 'rgba(255, 255, 255, 0.2)');
            });

        // Draw the relu symbol using two lines
        const symbolGroup = operatorGroup.append('g')
            .attr('transform', `translate(${this.position.width / 2}, ${this.position.height / 2})`);

        // Calculate dimensions for the relu symbol
        const symbolSize = Math.min(this.position.width, this.position.height) * 0.3;
        
        this.drawSymbol(symbolGroup, symbolSize);
    }
}

export { OperatorView };
