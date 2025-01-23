<script lang="ts">
  import { onMount } from "svelte";
  import * as tf from "@tensorflow/tfjs";
  import type { Operator } from "../types/operator";
  import TensorVisualizer from "./TensorVisualizer.svelte";

  export let operator: Operator;
  
  let inputTensor: tf.Tensor;
  let outputTensor: tf.Tensor;
  let inputValue = "0";
  
  function updateVisualization() {
    // Create a new input tensor
    const value = parseFloat(inputValue);
    inputTensor = tf.tensor2d([[value]], [1, 1]);
    
    // Apply the operator
    if (operator.id === "relu") {
      outputTensor = tf.relu(inputTensor);
    }
  }

  onMount(() => {
    updateVisualization();
  });
</script>

<div class="space-y-4">
  <div class="flex items-center space-x-4">
    <label class="font-medium">Input Value:</label>
    <input
      type="number"
      bind:value={inputValue}
      on:input={updateVisualization}
      class="border rounded px-2 py-1"
    />
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <h4 class="font-medium mb-2">Input</h4>
      {#if inputTensor}
        <TensorVisualizer tensor={inputTensor} />
      {/if}
    </div>
    <div>
      <h4 class="font-medium mb-2">Output</h4>
      {#if outputTensor}
        <TensorVisualizer tensor={outputTensor} />
      {/if}
    </div>
  </div>
</div>
