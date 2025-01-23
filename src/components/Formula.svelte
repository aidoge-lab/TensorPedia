<script lang="ts">
  import katex from "katex";
  import { onMount } from "svelte";

  export let formula: string;
  let element: HTMLElement;

  onMount(() => {
    katex.render(formula, element, {
      throwOnError: false,
      displayMode: true
    });
  });
</script>

<div bind:this={element} class="overflow-x-auto p-4 bg-gray-50 rounded-lg" />

<style>
  :global(.katex-display) {
    margin: 0;
  }
</style>
