<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import OperatorPage from "./routes/OperatorPage.svelte";
</script>

<Router>
  <nav class="bg-gray-800 text-white p-4">
    <div class="container mx-auto flex items-center justify-between">
      <Link to="/" class="text-xl font-bold">TensorPedia</Link>
      <div class="space-x-4">
        <Link to="/operators">Operators</Link>
        <Link to="/about">About</Link>
      </div>
    </div>
  </nav>

  <main class="container mx-auto p-4">
    <Route path="/" component={Home} />
    <Route path="/operators/:id" component={OperatorPage} />
  </main>
</Router>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>
