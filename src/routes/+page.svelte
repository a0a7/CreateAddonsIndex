<script lang="ts">
  import { toggleMode } from "mode-watcher";
  import { fly } from "svelte/transition";
  export let data: { addons: any[] };
  const { addons } = data;
</script>

<svelte:head>
  <title>Create Addons</title>
</svelte:head>

<main class="bg-(--background) flex flex-col font-(family-name:--font-family-monospace)">
  <button on:click={toggleMode}>Toggle Mode</button>
  <div class="md:h-[35em]">
    <div class="relative z-0 w-full">
      <div class="w-full left-0 text-center px-10 py-6 flex flex-col justify-center">
        <h1 class="text-5xl md:text-6xl font-bold text-white title-shadow">
          Create Addons
        </h1>
        <p class="mt-4 text-lg md:text-2xl text-white subtitle-shadow">
          Search, find and filter all addons for Create.
        </p>
      </div>
    </div>
  </div>

  <section class="p-6 overflow-auto max-h-[40em]">
    {#if addons.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each addons as addon (addon.name)}
          <div class="p-4 bg-(--background) pixel-corners">
            {#if addon.logo}
              <img src="{addon.logo}" alt="{addon.name} logo" class="w-16 h-16 object-contain mb-4" />
            {/if}
            <h2 class="text-xl font-bold mb-2">{addon.name}</h2>
            <p class="mb-2">{addon.description}</p>
            <p class="mb-2"><strong>Developer(s):</strong> {addon.developers}</p>
            <div class="mb-2 flex flex-wrap gap-2">
              {#if addon.modrinth}
                <a href="{addon.modrinth}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">Modrinth</a>
              {/if}
              {#if addon.curseforge}
                <a href="{addon.curseforge}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">CurseForge</a>
              {/if}
              {#if addon.github}
                <a href="{addon.github}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">GitHub</a>
              {/if}
            </div>
            <div class="mb-2">
              {#if addon.fabric_versions}
                <p><strong>Fabric Versions:</strong> {addon.fabric_versions.join(', ')}</p>
              {/if}
              {#if addon.forge_versions}
                <p><strong>Forge Versions:</strong> {addon.forge_versions.join(', ')}</p>
              {/if}
            </div>
            {#if addon.thumbnail}
              <img src="{addon.thumbnail}" alt="{addon.name} thumbnail" class="w-full h-auto object-cover mt-2 rounded" />
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-center">No addons available.</p>
    {/if}
  </section>
</main>