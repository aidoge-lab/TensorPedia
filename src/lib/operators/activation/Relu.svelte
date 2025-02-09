<script lang="ts">
    
    import * as d3 from 'd3';
    import * as tf from '@tensorflow/tfjs';
    
    import { DirectedConnectDraw } from '../../conncetion/DirectedConnectDraw';
    import { InfoConnectDraw } from '../../conncetion/InfoConnectDraw';
    import { OperatorExplainationDraw } from '../../operators/OperatorExplainationDraw';
    import { OperatorInfo } from '../../operators/OperatorInfo';
    import { OperatorView } from '../../operators/OperatorView';
    import { onMount } from 'svelte';
    import { DrawBounding } from '../../tensor/DrawBounding';
    import { TensorData } from '../../tensor/TensorData';
    import { TensorDraw } from '../../tensor/TensorDraw';
    import { TensorIndices } from '../../tensor/TensorIndices';
    
    let diagramContainer: HTMLElement;

    let svg;

    // left: left tensor,
    // right: right tensor,
    // result: result tensor,
    // result[i][j] = f(left, right)
    // 
    function composeOperatorDescription(inputTensor: TensorData, outputTensor: TensorData, tensorIndices: TensorIndices) {
        return 'max(0, ' + inputTensor.getValueByIndices(tensorIndices) + ')'
    }
    
    function defaultOperatorDescription(): string {
        return 'Relu'
    }

    let reluBottomLine: d3.Selection<SVGLineElement, unknown, null, undefined>;
    let reluRightUpperLine: d3.Selection<SVGLineElement, unknown, null, undefined>;

    onMount(() => {
        let svg = d3.select(diagramContainer)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 1000 800')
            .style('position', 'absolute')
            .style('top', 0)
            .style('left', 0)
            .style('overflow', 'visible')
            .style('pointer-events', 'none')
            .style('z-index', 1);

        let inputTensor = new TensorData(tf.tensor([-17, -16, -15, -14, -13, -12,
                                                     -11, -10, -9, -8, -7, -6,
                                                     -5, -4, -3, -2, -1, 0,
                                                     1, 2, 3, 4, 5, 6,
                                                     7, 8, 9, 10, 11, 12,
                                                     13, 14, 15, 16, 17, 18], [6, 6], 'float32'));
        inputTensor = new TensorData(tf.tensor([-17, -16, -15, -14, -13, -12,
                                                     -11, -10, -9, -8, -7, -6,
                                                     -5, -4, -3, -2, -1, 0,
                                                     1, 2, 3, 4, 5, 6,
                                                     7, 8, 9], [3, 3, 3], 'float32'));
        let tensorDrawSize = 300;
        let inputTensorPosition = new DrawBounding(0, 0, tensorDrawSize, tensorDrawSize);
        let inputTensorDraw = new TensorDraw(svg, inputTensorPosition, inputTensor);
        inputTensorDraw.draw();

        let reluOperatorPosition = new DrawBounding(tensorDrawSize * 1.5, 0, tensorDrawSize, tensorDrawSize);
        let reluOperatorView = new OperatorView(svg, reluOperatorPosition, '+', defaultOperatorDescription(), (svg: d3.Selection<SVGGElement, unknown, null, undefined>, symbolSize: number) => {
            // Draw horizontal line (left part)
            reluBottomLine = svg.append('line')
                .attr('x1', -symbolSize)
                .attr('y1', symbolSize/2)
                .attr('x2', 0)
                .attr('y2', symbolSize/2)
                .attr('stroke', 'rgba(255, 255, 255, 0.9)')
                .attr('stroke-width', 4 )
                .attr('stroke-linecap', 'round');

            // Draw diagonal line (right part)
            reluRightUpperLine = svg.append('line')
                .attr('x1', 0)
                .attr('y1', symbolSize/2)
                .attr('x2', symbolSize)
                .attr('y2', -symbolSize/2)
                .attr('stroke', 'rgba(255, 255, 255, 0.9)')
                .attr('stroke-width', 4)
                .attr('stroke-linecap', 'round');
        });
        reluOperatorView.draw();

        let operatorExplainationPosition = new DrawBounding(tensorDrawSize * 3, reluOperatorView.position.y + reluOperatorView.position.height * 1.5, reluOperatorView.position.width, reluOperatorView.position.height);
        let operatorExplainationDraw = new OperatorExplainationDraw(svg, operatorExplainationPosition, OperatorInfo.ReLU.name);
        operatorExplainationDraw.draw();

        let outputTensor = inputTensor.relu();
        let outputTensorPosition = new DrawBounding(tensorDrawSize * 3, 0, tensorDrawSize, tensorDrawSize);
        let outputTensorDraw = new TensorDraw(svg, outputTensorPosition, outputTensor, (tensorIndices: TensorIndices) => {

            inputTensorDraw.updateSelected(tensorIndices);
            outputTensorDraw.updateSelected(tensorIndices);
            
            if (tensorIndices.getIndices()[0] === -2) {
                reluBottomLine
                    .transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr('stroke-width', 4);
                reluRightUpperLine
                    .transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr('stroke-width', 4);

                    operatorExplainationDraw.updateDescription(defaultOperatorDescription());
                return;
            }

            operatorExplainationDraw.updateDescription(composeOperatorDescription(inputTensor, outputTensor, tensorIndices));

            if (outputTensor.getValueByIndices(tensorIndices) > 0) {
                reluBottomLine
                    .transition()
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr('stroke-width', 4);
                reluRightUpperLine
                    .transition()
                    .duration(1000)
                    .ease(d3.easeSinInOut) 
                    .attr('stroke-width', 6)
                    .transition()
                    .duration(1000)
                    .ease(d3.easeSinInOut)
                    .attr('stroke-width', 4)
                    .on('end', function repeat() {
                        d3.select(this)
                            .transition()
                            .duration(1000)
                            .ease(d3.easeSinInOut)
                            .attr('stroke-width', 6)
                            .transition() 
                            .duration(1000)
                            .ease(d3.easeSinInOut)
                            .attr('stroke-width', 4)
                            .on('end', repeat);
                    });
            } else {
                reluBottomLine
                    .transition()
                    .duration(1000)
                    .ease(d3.easeSinInOut) 
                    .attr('stroke-width', 6)
                    .transition()
                    .duration(1000)
                    .ease(d3.easeSinInOut)
                    .attr('stroke-width', 4)
                    .on('end', function repeat() {
                        d3.select(this)
                            .transition()
                            .duration(1000)
                            .ease(d3.easeSinInOut)
                            .attr('stroke-width', 6)
                            .transition() 
                            .duration(1000)
                            .ease(d3.easeSinInOut)
                            .attr('stroke-width', 4)
                            .on('end', repeat);
                    });
                reluRightUpperLine
                    .transition() 
                    .duration(200)
                    .ease(d3.easeCubicOut)
                    .attr('stroke-width', 4);
            }
        });
        outputTensorDraw.draw();

        let lineInputToOperator = new DirectedConnectDraw(svg, inputTensorDraw.getRightConnectionPoint(), reluOperatorView.getLeftConnectionPoint());
        lineInputToOperator.draw();

        let lineOperatorToOutput = new DirectedConnectDraw(svg, reluOperatorView.getRightConnectionPoint(), outputTensorDraw.getLeftConnectionPoint());
        lineOperatorToOutput.draw();

        let lineOperatorToExplaination = new InfoConnectDraw(svg, reluOperatorView.getBottomPosition(), operatorExplainationDraw.getLeftConnectionPoint());
        lineOperatorToExplaination.draw();

    });

    
</script>

<h2>Relu</h2>

<div class="operator-info">
    <div class="info-section">
        <div class="tags">
            <span class="tag">{OperatorInfo.ReLU.category}</span>
            <span class="tag">{OperatorInfo.ReLU.subcategory}</span>
        </div>

        <p class="description">{OperatorInfo.ReLU.description}</p>

    </div>
    
    <style>
        .tags {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .tag {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.875rem;
        }

        /* Add max-width styles */
        :global(.operator-info) {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }
    </style>
</div>
<div class="tensor-diagram" bind:this={diagramContainer}>
    <!-- <div class="relu-symbol">Relu</div> -->
</div>    
<style>
    .tensor-diagram {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        margin: 2rem auto;
        position: relative;
        border-radius: 8px;
        min-width: 500px;
        min-height: 500px;
        max-width: 1200px;
    }
    
</style>
