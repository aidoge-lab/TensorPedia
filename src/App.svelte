<script lang="ts">
  import { onMount } from 'svelte';
  import { Relu } from './lib/operators/activation/Relu';
  import * as tf from '@tensorflow/tfjs';

  let inputValue = "-1,0,1,2";
  let output = "";
  
  function runRelu() {
    try {
      const input = tf.tensor(inputValue.split(',').map(Number));
      const result = Relu.forward(input);
      output = JSON.stringify(result.arraySync());
    } catch (error) {
      output = "Error: Invalid input";
    }
  }

  onMount(() => {
    // Example usage when component mounts
    Relu.example();
  });
</script>

<main>
  <h1>TensorPedia</h1>
  
  <section class="operator">
    <h2>{Relu.info.name}</h2>
    <p>{Relu.info.description}</p>
    
    <div class="formula">
      <h3>Mathematical Formula</h3>
      <pre>{Relu.info.formula}</pre>
    </div>

    <div class="interactive">
      <h3>Try it out</h3>
      <div class="input-group">
        <label>
          Input (comma-separated numbers):
          <input type="text" bind:value={inputValue} />
        </label>
        <button on:click={runRelu}>Run</button>
      </div>
      <div class="output">
        <h4>Output:</h4>
        <pre>{output}</pre>
      </div>
    </div>
  </section>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .operator {
    background: #1e1e1e;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 2rem;
    border: 1px solid #333;
  }

  .formula {
    background: #2a2a2a;
    padding: 1.5rem;
    border-radius: 4px;
    margin: 1rem 0;
    border: 1px solid #404040;
  }

  .interactive {
    background: #2a2a2a;
    padding: 1.5rem;
    border-radius: 4px;
    border: 1px solid #404040;
  }

  .input-group {
    margin: 1rem 0;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    margin: 0.5rem 0;
    background: #1a1a1a;
    border: 1px solid #404040;
    color: #ffffff;
    border-radius: 4px;
  }

  input:focus {
    outline: none;
    border-color: #7cb9ff;
  }

  button {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  button:hover {
    background: #1d4ed8;
  }

  pre {
    background: #1a1a1a;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    color: #ffffff;
    border: 1px solid #333;
  }

  .output {
    margin-top: 1rem;
  }

  .output h4 {
    margin-bottom: 0.5rem;
  }
</style>
