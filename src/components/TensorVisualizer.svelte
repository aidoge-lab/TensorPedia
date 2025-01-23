<script lang="ts">
  import { onMount } from "svelte";
  import type { Tensor } from "@tensorflow/tfjs";

  export let tensor: Tensor;
  let canvas: HTMLCanvasElement;
  
  async function visualizeTensor() {
    const data = await tensor.data();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const shape = tensor.shape;
    const width = shape[1] || 1;
    const height = shape[0] || 1;
    
    canvas.width = width * 50;
    canvas.height = height * 50;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const value = data[i * width + j];
        const intensity = Math.floor((value + 1) * 127.5); // Normalize from [-1,1] to [0,255]
        ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
        ctx.fillRect(j * 50, i * 50, 50, 50);
        
        // Draw grid lines
        ctx.strokeStyle = '#ddd';
        ctx.strokeRect(j * 50, i * 50, 50, 50);
        
        // Draw value text
        ctx.fillStyle = intensity > 127 ? 'black' : 'white';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toFixed(2), j * 50 + 25, i * 50 + 25);
      }
    }
  }

  $: if (tensor && canvas) {
    visualizeTensor();
  }
</script>

<canvas 
  bind:this={canvas}
  class="border border-gray-200 rounded-lg shadow-sm"
/>
