<script lang="ts">
  import { Link } from "svelte-routing";
  import { operatorCategories } from "../data/operators";
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-4xl font-bold mb-8">Welcome to TensorPedia</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each Object.entries(operatorCategories) as [category, operators]}
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-4">{category}</h2>
        <ul class="space-y-2">
          {#each operators as operator}
            <li>
              <Link 
                to={`/operators/${operator.id}`}
                class="text-blue-600 hover:text-blue-800"
              >
                {operator.name}
              </Link>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</div>
