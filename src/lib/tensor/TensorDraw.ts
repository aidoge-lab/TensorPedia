import * as d3 from 'd3';
import { TensorData } from './TensorData';
import { DrawBounding } from './DrawBounding';
import { TensorIndices } from './TensorIndices';
import { env } from 'onnxruntime-web';

export class TensorDraw {
    /**
     * @param {d3.Selection} svg - The D3 selection object for the SVG element
     * @param {DrawBounding} position - The position object
     * @param {TensorData} tensorData - The tensor data object
     * @param {Function|null} onCellSelectedCallback - Callback function when a cell is selected
     */
    constructor(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, 
        position: DrawBounding, 
        tensorData = TensorData.createDefault2D(),
        onCellSelectedCallback: Function | null = null) {
        this.svg = svg;
        this.position = position;
        this.tensorData = tensorData;
        this.onCellSelectedCallback = onCellSelectedCallback;
        this.cells = [];  // 保存所有单元格的引用
        this.cell3D = [];
        this.selectedTensorIndices = new TensorIndices([-2, -2, -2, -2]);
        this.isDetailMode = false;
        this.enable3DView = false;
        this.colorScale = d3.scaleSequential(d3.interpolateHclLong("purple", "orange")).domain([-1, 1]);
        this.currentDepthIndex = 0; // For 3D tensor depth index in detail mode
        
        // 3D rotation state
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.rotateX = 90;  // Changed to make dim2 point up
        this.rotateY = 0;   // Changed to make dim0 point right
        this.rotateZ = 0;   // Changed to make dim1 point outward


        // Create an SVGPoint for future math
        this.pt = this.svg.node()!.createSVGPoint();
    }

    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    tensorGroup2D: d3.Selection<SVGGElement, unknown, null, undefined> = null!;
    tensorGroup3D: d3.Selection<SVGGElement, unknown, null, undefined> = null!;
    position: DrawBounding;
    tensorData: TensorData;
    onCellSelectedCallback: Function | null;
    cells: any[];
    cell3D: any[];
    selectedTensorIndices: TensorIndices;
    isDetailMode: boolean;
    colorScale: d3.ScaleSequential<string, never>;
    valueTexts: d3.Selection<SVGTextElement, unknown, null, undefined>[] = [];
    toggleDetailViewButton: d3.Selection<SVGRectElement, unknown, null, undefined> = null!;
    toggleDetailKnob: d3.Selection<SVGCircleElement, unknown, null, undefined> = null!;
    toggle3DKnob: d3.Selection<SVGCircleElement, unknown, null, undefined> = null!;
    toggleDetailViewText: d3.Selection<SVGTextElement, unknown, null, undefined> = null!;
    toggle3DViewText: d3.Selection<SVGTextElement, unknown, null, undefined> = null!;
    depthText: d3.Selection<SVGTextElement, unknown, null, undefined> = null!;
    currentDepthIndex: number;
    pt: SVGPoint;

    toggle3DViewButton: d3.Selection<SVGRectElement, unknown, null, undefined> = null!;
    enable3DView: boolean;
    // 3D rotation properties
    isDragging: boolean;
    startX: number;
    startY: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;

    toggleWidth: number = 40;
    toggleHeight: number = 20;

    project3Dto2D(dim0: number, dim1: number, dim2: number, rotateX: number, rotateY: number, rotateZ: number) {
        const radX = (rotateX * Math.PI) / 180;
        const radY = (rotateY * Math.PI) / 180;
        const radZ = (rotateZ * Math.PI) / 180;
        
        // First transform to make dim0 point right, dim1 outward, dim2 up
        const temp0 = dim0;  // Keep dim0 pointing right
        const temp1 = dim1; // Negate dim1 to point outward
        const temp2 = dim2;  // Keep dim2 pointing up
        
        // Rotate around X axis
        const temp1Dim1 = temp1 * Math.cos(radX) - temp2 * Math.sin(radX);
        const temp1Dim2 = temp1 * Math.sin(radX) + temp2 * Math.cos(radX);
        
        // Rotate around Y axis
        const temp2Dim0 = temp0 * Math.cos(radY) + temp1Dim2 * Math.sin(radY);
        const temp2Dim2 = -temp0 * Math.sin(radY) + temp1Dim2 * Math.cos(radY);

        // Rotate around Z axis
        const temp3Dim0 = temp2Dim0 * Math.cos(radZ) - temp1Dim1 * Math.sin(radZ);
        const temp3Dim1 = temp2Dim0 * Math.sin(radZ) + temp1Dim1 * Math.cos(radZ);
        
        return {
            x: temp3Dim0,  // Map to screen coordinates
            y: temp3Dim1  // Negate y to match screen coordinates
        };
    }

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

    toggle3DView() {
        this.enable3DView = !this.enable3DView;
        this.updateVisualization();

        const knobSize = this.toggleHeight - 4;
        
        this.toggle3DViewButton
            .attr('fill', this.enable3DView ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)');
            
        this.toggle3DKnob
            .transition()
            .duration(200)
            .attr('cx', this.enable3DView ? (this.toggleWidth - 2 - knobSize/2) : (2 + knobSize/2));

        this.toggle3DViewText
            .text(this.enable3DView ? '3D' : '2D');
    }

    toggleDetailMode() {
        this.isDetailMode = !this.isDetailMode;
        this.updateVisualization();
        
        const knobSize = this.toggleHeight - 4;
        
        this.toggleDetailViewButton
            .attr('fill', this.isDetailMode ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)');
            
        this.toggleDetailKnob
            .transition()
            .duration(200)
            .attr('cx', this.isDetailMode ? (this.toggleWidth - 2 - knobSize/2) : (2 + knobSize/2));

        this.toggleDetailViewText
            .text(this.isDetailMode ? 'Detail' : 'Overview');

        // Show/hide depth text for 3D tensors
        if (this.tensorData.getDims().length === 3) {
            this.depthText?.style('opacity', this.enable3DView ? 1 : 0);
        }
    }


    mousePos: [number, number] = [0, 0];
    draw3DCube(tensorGroup: d3.Selection<SVGGElement, unknown, null, undefined>, dims: readonly number[]) {
        tensorGroup.selectAll('*').remove();
        const depth = dims[0], rows = dims[1], cols = dims[2];
        const maxDim = Math.max(depth, rows, cols);
        const cubeSize = Math.min(this.position.width / (maxDim * 2), this.position.height / (maxDim * 2));
        const spacing = cubeSize * 0.125;

        // Move origin to bottom left corner
        const centerX = cubeSize;
        const centerY = this.position.height - cubeSize;


        // Add background rectangle
        tensorGroup.append('rect')
            .attr('width', this.position.width)
            .attr('height', this.position.height)
            .attr('fill', 'rgba(0, 0, 255, 0.01 )');

        // Add reset view button
        const resetButton = tensorGroup.append('g')
            .attr('cursor', 'pointer')
            .on('click', () => {
                this.rotateX = 90;  // Reset to default orientation
                this.rotateY = 0;
                this.rotateZ = 0;
                this.draw3DCube(tensorGroup, dims);
            });

        resetButton.append('rect')
            .attr('width', 30)
            .attr('height', 30)
            .attr('rx', 5)
            .attr('fill', 'rgba(100, 100, 255, 0.3)')
            .attr('stroke', 'rgba(255, 255, 255, 0.5)');

        resetButton.append('text')
            .attr('x', 15)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '20px')
            .text('⟳');

        // Define arrow marker
        tensorGroup.append('defs')
            .append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-10 -10 20 20')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M-6.75,-6.75 L 0,0 L -6.75,6.75')
            .attr('fill', 'none')
            .attr('stroke', 'orange');

        // Calculate total cube size to determine axis length
        const totalSize = Math.max(depth, rows, cols) * (cubeSize + spacing);
        const axisLength = totalSize * 1.3;

        // Draw coordinate axes from origin (bottom left corner)
        const axes = [
            {from: [0,0,0], to: [axisLength,0,0], label: 'dim0'},
            {from: [0,0,0], to: [0,axisLength,0], label: 'dim1'}, 
            {from: [0,0,0], to: [0,0,axisLength], label: 'dim2'}
        ];

        this.cell3D = Array(dims[0]).fill(null).map(() => Array(dims[1]).fill(null).map(() => Array(dims[2]).fill(null)));

        axes.forEach(axis => {
            const start = this.project3Dto2D(axis.from[0], axis.from[1], axis.from[2], this.rotateX, this.rotateY, this.rotateZ);
            const end = this.project3Dto2D(axis.to[0], axis.to[1], axis.to[2], this.rotateX, this.rotateY, this.rotateZ);
            
            tensorGroup.append('line')
                .attr('x1', start.x + centerX)
                .attr('y1', start.y + centerY)
                .attr('x2', end.x + centerX)
                .attr('y2', end.y + centerY)
                .attr('stroke', 'orange')
                .attr('stroke-width', 2)
                .attr('marker-end', 'url(#arrowhead)');

            const textOffset = 15;
            
            
            let textCell = tensorGroup.append('text')
                .attr('x', end.x + centerX)
                .attr('y', end.y + centerY - textOffset)
                .attr('fill', 'orange')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .text(axis.label);

        });

        tensorGroup.on('mouseup', () => {
            this.isDragging = false;
        });
    
        tensorGroup.on('mouseleave', () => {
            this.isDragging = false;
        });

        tensorGroup.on('mousemove', (event: MouseEvent) => {
            if (this.isDragging) {
                return;
            }

            // 获取 SVG 元素的边界框
            const svgRect = this.svg.node()?.getBoundingClientRect();
            if (!svgRect) return;

            this.pt.x = event.clientX;
            this.pt.y = event.clientY;
            let mousePos = this.pt.matrixTransform(this.svg.node()!.getScreenCTM()!.inverse());
            this.mousePos = [mousePos.x - this.position.x, mousePos.y - this.position.y];
            this.draw3DCube(tensorGroup, dims);

            let isMouseInContainer = this.checkMouseInContainer(dims);
            if (isMouseInContainer) {
                if (this.onCellSelectedCallback) {
                    this.onCellSelectedCallback(this.selectedTensorIndices);
                }
            }
        });

        let isMouseInContainer = this.checkMouseInContainer(dims);
        this.drawTensor3D(tensorGroup, dims, isMouseInContainer);

        // Setup mouse events for rotation
        tensorGroup
            .style('pointer-events', 'all')  // 确保元素可以接收事件
            .on('mousedown.rotation', (event: MouseEvent) => {
                this.isDragging = true;
                this.startX = event.clientX;
                this.startY = event.clientY;
            })
            .on('mousemove.rotation', (event: MouseEvent) => {
                if (!this.isDragging) return;
                
                const deltaX = event.clientX - this.startX;
                const deltaY = event.clientY - this.startY;
                
                if (event.shiftKey) {
                    // Shift + drag for Z rotation
                    this.rotateZ -= deltaX * 0.5;
                } else {
                    // Changed: Now deltaX controls rotation around dim2 (Y axis)
                    // and deltaY controls rotation around dim1 (X axis)
                    this.rotateY += deltaX * 0.5;  // Changed from -= to += for more intuitive movement
                    this.rotateX -= deltaY * 0.5;
                }
                
                this.startX = event.clientX;
                this.startY = event.clientY;

                this.draw3DCube(tensorGroup, dims);
            });

    }

    checkMouseInContainer(dims: readonly number[]) {
        const depth = dims[0], rows = dims[1], cols = dims[2];
        const maxDim = Math.max(depth, rows, cols);
        const cubeSize = Math.min(this.position.width / (maxDim * 2), this.position.height / (maxDim * 2));
        const spacing = cubeSize * 0.125;
        // Move origin to bottom left corner
        const centerX = cubeSize;
        const centerY = this.position.height - cubeSize;

        var isMouseInContainer = false;
        
        // Draw each small cube
        for (let i = 0; i < depth; i++) {
            for (let j = 0; j < rows; j++) {
                for (let k = 0; k < cols; k++) {
                    
                    const dim0 = i * (cubeSize + spacing);
                    const dim1 = j * (cubeSize + spacing);
                    const dim2 = k * (cubeSize + spacing);

                    // Define cube vertices
                    const vertices = [
                        [dim0, dim1, dim2],
                        [dim0 + cubeSize, dim1, dim2],
                        [dim0 + cubeSize, dim1 + cubeSize, dim2],
                        [dim0, dim1 + cubeSize, dim2],
                        [dim0, dim1, dim2 + cubeSize],
                        [dim0 + cubeSize, dim1, dim2 + cubeSize],
                        [dim0 + cubeSize, dim1 + cubeSize, dim2 + cubeSize],
                        [dim0, dim1 + cubeSize, dim2 + cubeSize]
                    ].map(point => this.project3Dto2D(point[0], point[1], point[2], this.rotateX, this.rotateY, this.rotateZ));

                    // Draw faces
                    const faces = [
                        [0, 1, 2, 3], // front
                        [4, 5, 6, 7], // back
                        [0, 4, 7, 3], // left
                        [1, 5, 6, 2], // right
                        [0, 1, 5, 4], // top
                        [3, 2, 6, 7]  // bottom
                    ];

                    const center = this.project3Dto2D(
                        dim0 + cubeSize/2,
                        dim1 + cubeSize/2,
                        dim2 + cubeSize/2,
                        this.rotateX,
                        this.rotateY,
                        this.rotateZ
                    );

                    const cellWidth = Math.abs(vertices[1].x - vertices[0].x);
                    const cellHeight = Math.abs(vertices[3].y - vertices[0].y);
                    const cellSize = Math.max(cellWidth, cellHeight);

                    const isMouseNearCell = 
                        Math.abs(this.mousePos[0] - (center.x + centerX)) < cellSize / 2 &&
                        Math.abs(this.mousePos[1] - (center.y + centerY)) < cellSize / 2;
                    
                    if (isMouseNearCell) {
                        this.selectedTensorIndices = new TensorIndices([i, j, k]);
                    }
                    isMouseInContainer = isMouseInContainer || isMouseNearCell;
                }
            }
        }

        return isMouseInContainer;
    }

    drawTensor3D(tensorGroup: d3.Selection<SVGGElement, unknown, null, undefined>, dims: readonly number[], isMouseInContainer: boolean) {
        const depth = dims[0], rows = dims[1], cols = dims[2];
        const maxDim = Math.max(depth, rows, cols);
        const cubeSize = Math.min(this.position.width / (maxDim * 2), this.position.height / (maxDim * 2));
        const spacing = cubeSize * 0.125;
        // Move origin to bottom left corner
        const centerX = cubeSize;
        const centerY = this.position.height - cubeSize;


        const minValue = this.tensorData.getMinData();
        const maxValue = this.tensorData.getMaxData();

        // Draw each small cube
        for (let i = 0; i < depth; i++) {
            for (let j = 0; j < rows; j++) {
                for (let k = 0; k < cols; k++) {
                    
                    const dim0 = i * (cubeSize + spacing);
                    const dim1 = j * (cubeSize + spacing);
                    const dim2 = k * (cubeSize + spacing);

                    // Define cube vertices
                    const vertices = [
                        [dim0, dim1, dim2],
                        [dim0 + cubeSize, dim1, dim2],
                        [dim0 + cubeSize, dim1 + cubeSize, dim2],
                        [dim0, dim1 + cubeSize, dim2],
                        [dim0, dim1, dim2 + cubeSize],
                        [dim0 + cubeSize, dim1, dim2 + cubeSize],
                        [dim0 + cubeSize, dim1 + cubeSize, dim2 + cubeSize],
                        [dim0, dim1 + cubeSize, dim2 + cubeSize]
                    ].map(point => this.project3Dto2D(point[0], point[1], point[2], this.rotateX, this.rotateY, this.rotateZ));

                    // Draw faces
                    const faces = [
                        [0, 1, 2, 3], // front
                        [4, 5, 6, 7], // back
                        [0, 4, 7, 3], // left
                        [1, 5, 6, 2], // right
                        [0, 1, 5, 4], // top
                        [3, 2, 6, 7]  // bottom
                    ];

                    const center = this.project3Dto2D(
                        dim0 + cubeSize/2,
                        dim1 + cubeSize/2,
                        dim2 + cubeSize/2,
                        this.rotateX,
                        this.rotateY,
                        this.rotateZ
                    );

                    const cellWidth = Math.abs(vertices[1].x - vertices[0].x);
                    const cellHeight = Math.abs(vertices[3].y - vertices[0].y);
                    const cellSize = Math.max(cellWidth, cellHeight);

                    const isMouseNearCell = isMouseInContainer && 
                        Math.abs(this.mousePos[0] - (center.x + centerX)) < cellSize / 2 &&
                        Math.abs(this.mousePos[1] - (center.y + centerY)) < cellSize / 2;

                    var strokeColor = (isMouseNearCell || !isMouseInContainer) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                    
                    if (this.selectedTensorIndices.getIndices().length === 3 && this.selectedTensorIndices.getIndices()[0] === i && this.selectedTensorIndices.getIndices()[1] === j && this.selectedTensorIndices.getIndices()[2] === k) {
                        strokeColor = 'rgba(255, 165, 0, 1.0)';
                    }

                    const value = this.tensorData.getValue(i, j, k);
                    const normalizedValue = (value - minValue) / (maxValue - minValue);
                    const heatmapColor = this.colorScale(normalizedValue)
                    const cellFaceColor = this.isDetailMode ? 'rgba(100, 100, 255, 0.0)' : (d3.color(heatmapColor)?.copy({opacity: 0.3})?.toString() || '');

                    faces.forEach(face => {
                        tensorGroup.append('path')
                            .attr('d', `M${vertices[face[0]].x + centerX},${vertices[face[0]].y + centerY}
                                      L${vertices[face[1]].x + centerX},${vertices[face[1]].y + centerY}
                                      L${vertices[face[2]].x + centerX},${vertices[face[2]].y + centerY}
                                      L${vertices[face[3]].x + centerX},${vertices[face[3]].y + centerY}Z`)
                            .attr('fill', cellFaceColor)
                            .attr('stroke', strokeColor);
                    });

                    // Add value text
                    let textCell = tensorGroup.append('text')
                        .attr('x', center.x + centerX)
                        .attr('y', center.y + centerY)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        // .attr('fill', (isMouseNearCell || !isMouseInContainer) ? 'rgba(255, 165, 0, 1.0)' : 'rgba(255, 165, 0, 0.2)')
                        .attr('fill', heatmapColor)
                        .attr('font-size', '15px')
                        .text(this.isDetailMode ? value : '')
                }
            }
        }
    }

    show3Donly() {
        this.tensorGroup3D.style('visibility', 'visible')
        this.tensorGroup3D.style('visibility', 'visible')
            .style('pointer-events', 'all');
        this.tensorGroup2D.style('visibility', 'hidden')
            .style('pointer-events', 'none');
    }

    show2Donly() {
        this.tensorGroup2D.style('visibility', 'visible')
            .style('pointer-events', 'all');
        this.tensorGroup3D.style('visibility', 'hidden')
            .style('pointer-events', 'none');
    }

    updateVisualization() {
        const dims = this.tensorData.getDims();
        const is3D = dims.length === 3;

        // Clear existing visualization

        if (is3D) {
            if (this.enable3DView) {
                this.show3Donly();
                this.draw3DCube(this.tensorGroup3D, dims);
                return;
            } else {
                this.show2Donly();
            }
        }

        // Rest of the existing updateVisualization code...
        let minValue = this.tensorData.getMinData();
        let maxValue = this.tensorData.getMaxData();

        const visibleDims = is3D ? [dims[1], dims[2]] : [dims[0], dims[1]];
        
        for (let i = 0; i < visibleDims[0]; i++) {
            for (let j = 0; j < visibleDims[1]; j++) {
                const indices = is3D ? [this.currentDepthIndex, i, j] : [i, j];
                const value = this.tensorData.getValue(...indices);
                const normalizedValue = (value - minValue) / (maxValue - minValue);
                
                if (!this.isDetailMode) {
                    this.cells[i][j].attr('fill', this.colorScale(normalizedValue));
                } else {
                    this.cells[i][j].attr('fill', 'rgba(255, 255, 255, 0.02)');
                }

                if (this.valueTexts[i * visibleDims[1] + j]) {
                    const text = String(value);
                    this.valueTexts[i * visibleDims[1] + j]
                        .style('opacity', this.isDetailMode ? 1 : 0)
                        .text(text);
                }
            }
        }
    }

    updateSelected(tensorIndices: TensorIndices) {
        this.selectedTensorIndices = tensorIndices;

        const dims = this.tensorData.getDims();
        var visibleDims = dims;
        
        if (dims.length === 2 || !this.enable3DView) {
            var selectedTensorIndices2D = this.translateTensorIndices2DForFlatView(tensorIndices);
            for (let row = 0; row < visibleDims[0]; row++) {
                for (let col = 0; col < visibleDims[1]; col++) {
                        const cell = this.cells[row]?.[col];
                        if (cell) {
                            const isSelected = (selectedTensorIndices2D.getIndices()[0] === -1 || selectedTensorIndices2D.getIndices()[0] === row) && 
                                            (selectedTensorIndices2D.getIndices()[1] === -1 || selectedTensorIndices2D.getIndices()[1] === col);
                            cell.attr('stroke', isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)')
                                .attr('stroke-width', isSelected ? 2 : 1);
                        }
                }
            }
        } else {
            this.draw3DCube(this.tensorGroup3D, dims);
        }
    }

    translateTensorIndices2DForFlatView(tensorIndices: TensorIndices): TensorIndices {
        const dims = this.tensorData.getDims();
        const is3D = dims.length === 3;
        if (is3D) {
            var indices = []
            for (let i = 0; i < dims.length; i++) {
                if (i === this.currentDepthIndex) {
                    continue
                } else {
                    indices.push(tensorIndices.getIndices()[i]);
                }
            }
            return new TensorIndices(indices);
        }
        return tensorIndices;
    }

    translateDim2DForFlatView(dims: readonly number[]): readonly number[] {
        const is3D = dims.length === 3;
        if (is3D) {
            var dims2d: number[] = []
            for (let i = 0; i < dims.length; i++) {
                if (i === this.currentDepthIndex) {
                    continue
                } else {
                    dims2d.push(dims[i]);
                }
            }
            return dims2d;
        }
        return dims;
    }

    // Get point in global SVG space
    cursorPoint(evt: MouseEvent) {
        this.pt.x = evt.clientX;
        this.pt.y = evt.clientY;
        return this.pt.matrixTransform(this.svg.node()!.getScreenCTM()!.inverse());
    }
  
    draw() {
        const tensorGroup = this.svg.append('g')
            .attr('transform', `translate(${this.position.x},${this.position.y})`)
            .style('pointer-events', 'all')

        this.tensorGroup2D = tensorGroup;

        const dims = this.tensorData.getDims();
        const is3D = dims.length === 3;

        var visibleDims = this.translateDim2DForFlatView(dims);

        this.cells = Array(visibleDims[0]).fill(null).map(() => Array(visibleDims[1]).fill(null));

        const cellWidth = this.position.width / visibleDims[1];
        const cellHeight = this.position.height / visibleDims[0];


        for (let i = 0; i < visibleDims[0]; i++) {
            for (let j = 0; j < visibleDims[1]; j++) {

                const cell = tensorGroup.append('rect')
                    .attr('x', j * cellWidth)
                    .attr('y', i * cellHeight)
                    .attr('width', cellWidth)
                    .attr('height', cellHeight)
                    .attr('fill', 'rgba(255, 255, 255, 0.02)')
                    .attr('stroke', 'rgba(255, 255, 255, 0.2)')
                    .attr('stroke-width', 1)
                    .attr('rx', 2)
                    .datum({row: i, col: j})
                    .on('mouseover', (event, d) => {
                        if (this.onCellSelectedCallback) {
                            var indices = [d.row, d.col];
                            // For 3D tensors, rearrange indices based on currentDepthIndex
                            if (is3D && !this.enable3DView) {
                                if (this.currentDepthIndex === 0) {
                                    indices = [this.currentDepthIndex, d.row, d.col]
                                } else if (this.currentDepthIndex === 1) {
                                    indices = [d.row, this.currentDepthIndex, d.col]
                                } else if (this.currentDepthIndex === 2) {
                                    indices = [d.row, d.col, this.currentDepthIndex];
                                }
                            }
                            this.onCellSelectedCallback(new TensorIndices(indices));
                        }
                    })
                    .on('mouseout', (event, d) => {
                        if (this.onCellSelectedCallback) {
                            this.onCellSelectedCallback(new TensorIndices([-2, -2, -2]));
                        }
                    });
                
                this.cells[i][j] = cell;

                const valueText = tensorGroup.append('text')
                    .attr('x', j * cellWidth + cellWidth/2)
                    .attr('y', i * cellHeight + cellHeight/2)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', '15px')
                    .attr('fill', 'rgba(255, 255, 255, 0.9)')
                    .style('pointer-events', 'none')
                    .text(String(this.tensorData.getValue(...(is3D ? [this.currentDepthIndex, i, j] : [i, j]))));
                
                this.valueTexts.push(valueText);
            }
        }

        this.addToggleDetailButton();

        if (is3D) {
            this.addToggle3DButton();
            // if (is3D) {
            const tensorGroup = this.svg.append('g')
                .attr('transform', `translate(${this.position.x},${this.position.y})`)
                .style('pointer-events', 'all')
            this.tensorGroup3D = tensorGroup;
            this.draw3DCube(tensorGroup, dims);
            // this.addToggleDetailButton();
        }

        if (this.enable3DView) { // detail mode cannot display 3d tensor
            this.show3Donly();
        } else {
            this.show2Donly();
        }

        this.updateVisualization();
    }

    addToggle3DButton() {
        const buttonGroup = this.svg.append('g')
            .attr('transform', `translate(${this.position.x + this.position.width - 3 * this.toggleWidth},${this.position.y + this.position.height + 10})`);    

        this.toggle3DViewButton = buttonGroup.append('rect')
            .attr('width', this.toggleWidth)
            .attr('height', this.toggleHeight)
            .attr('rx', this.toggleHeight/2)
            .attr('fill', 'rgba(0, 255, 0, 0.0)')
            .attr('stroke', 'rgba(255, 255, 255, 0.4)')
            .attr('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('click', () => this.toggle3DView());

        const knobSize = this.toggleHeight - 4;
        this.toggle3DKnob = buttonGroup.append('circle')
            .attr('cx', 2 + knobSize/2)
            .attr('cy', this.toggleHeight/2)
            .attr('r', knobSize/2)
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .attr('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('click', () => this.toggle3DView());

        this.toggle3DViewText = buttonGroup.append('text')
            .attr('font-size', '15px')
            .attr('x', this.toggleWidth/2)
            .attr('y', this.toggleHeight + 15)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .text('2D');
    }

    addToggleDetailButton() {
        const buttonGroup = this.svg.append('g')
            .attr('transform', `translate(${this.position.x + this.position.width - this.toggleWidth},${this.position.y + this.position.height + 10})`);

        this.toggleDetailViewButton = buttonGroup.append('rect')
            .attr('width', this.toggleWidth)
            .attr('height', this.toggleHeight)
            .attr('rx', this.toggleHeight/2)
            .attr('fill', 'rgba(255, 255, 255, 0.1)')
            .attr('stroke', 'rgba(255, 255, 255, 0.4)')
            .attr('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('click', () => this.toggleDetailMode());

        const knobSize = this.toggleHeight - 4;
        this.toggleDetailKnob = buttonGroup.append('circle')
            .attr('cx', 2 + knobSize/2)
            .attr('cy', this.toggleHeight/2)
            .attr('r', knobSize/2)
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .attr('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('click', () => this.toggleDetailMode());

        this.toggleDetailViewText = buttonGroup.append('text')
            .attr('font-size', '15px')
            .attr('x', this.toggleWidth/2)
            .attr('y', this.toggleHeight + 15)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .text('Overview');
    }
}
