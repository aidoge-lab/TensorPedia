<script lang="ts">
  import { onMount } from "svelte";
  import * as tf from "@tensorflow/tfjs";
  import Formula from "../components/Formula.svelte";
  import TensorVisualizer from "../components/TensorVisualizer.svelte";
  import OperatorVisualizer from "../components/OperatorVisualizer.svelte";
  import { operators } from "../data/operators";

  export let id: string;
  
  let operator = operators[id];
  let inputTensor: tf.Tensor;
  let outputTensor: tf.Tensor;

  onMount(async () => {
    // Initialize TensorFlow.js
    await tf.ready();
    
    // Create a sample input tensor
    inputTensor = tf.randomNormal([1, 5, 5, 1]);
    
    // Apply the operator
    if (operator.id === "relu") {
      outputTensor = tf.relu(inputTensor);
    }
  });
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-4xl font-bold mb-8">{operator.name}</h1>
  
  <section class="mb-8">
    <h2 class="text-2xl font-semibold mb-4">Description</h2>
    <p class="text-gray-700">{operator.description}</p>
  </section>

  <section class="mb-8">
    <h2 class="text-2xl font-semibold mb-4">Mathematical Formula</h2>
    <Formula formula={operator.formula} />
  </section>

  <section class="mb-8">
    <h2 class="text-2xl font-semibold mb-4">Interactive Visualization</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="text-xl mb-2">Input Tensor</h3>
        {#if inputTensor}
          <TensorVisualizer tensor={inputTensor} />
        {/if}
      </div>
      <div>
        <h3 class="text-xl mb-2">Output Tensor</h3>
        {#if outputTensor}
          <TensorVisualizer tensor={outputTensor} />
        {/if}
      </div>
    </div>
    <div class="mt-6">
      <OperatorVisualizer {operator} />
    </div>
  </section>

  <section class="mb-8">
    <h2 class="text-2xl font-semibold mb-4">Parameters</h2>
    <ul class="list-disc pl-6">
      {#each operator.parameters as param}
        <li class="mb-2">
          <span class="font-semibold">{param.name}:</span> {param.description}
        </li>
      {/each}
    </ul>
  </section>
</div>
