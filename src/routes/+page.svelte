<script lang="ts">
  export let data: { addons: any[] };
  import { onMount } from 'svelte';

  const { addons } = data;
  let versionButton: HTMLButtonElement;
  let modloaderButton: HTMLButtonElement;
  let versionDropdownX = 0;
  let versionDropdownY = 0;
  let modloaderDropdownX = 0;
  let modloaderDropdownY = 0;

  // Filtering/Sorting state - CHANGED TO ARRAYS for multi-select
  let selectedMinecraftVersions: string[] = [];
  let selectedModloaders: string[] = [];
  let sortBy = "featured"; // "featured" or "downloads"

  // For dropdown toggling
  let showMinecraftDropdown = false;
  let showModloaderDropdown = false;

  const minecraftVersions = ["1.16.5", "1.18.2", "1.20.1", "1.21.1"];
  const modloaders = ["fabric", "forge", "datapack"];
  
  // Portal action for appending elements directly to body - crucial for z-index issues
  function portal(node: HTMLDivElement) {
    // This ensures the dropdown is inserted directly into the body
    document.body.appendChild(node);
    
    return {
      destroy() {
        node.remove();
      }
    };
  }

  // Helper functions
  function totalDownloads(addon: { modrinth_info: { downloads: any; }; curseforge_info: { downloadCount: any; }; }) {
    const modrinthDownloads = addon.modrinth_info && addon.modrinth_info.downloads ? addon.modrinth_info.downloads : 0;
    const cfDownloads = addon.curseforge_info && addon.curseforge_info.downloadCount ? addon.curseforge_info.downloadCount : 0;
    return modrinthDownloads + cfDownloads;
  }

  function formatNumber(num: number): string {
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toString();
  }

  function getVersionRange(versions: string[]): string {
    if (!versions || versions.length === 0) return "N/A";
    if (versions.length === 1) return versions[0];
    const sorted = [...versions].sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      const len = Math.max(pa.length, pb.length);
      for (let i = 0; i < len; i++){
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });
    return sorted[0] === sorted[sorted.length - 1]
      ? sorted[0]
      : `${sorted[0]} - ${sorted[sorted.length - 1]}`;
  }

  // Toggle selection in an array (add if not present, remove if present)
  function toggleSelection(array: string[], item: string): string[] {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  }

  // Reactive filtering/sorting - UPDATED for multi-select
  $: filteredAddons = addons
    .filter(addon => {
      if (selectedMinecraftVersions.length > 0) {
        let addonVersions = addon.modrinth_info?.game_versions || [];
        // Check if any selected version is in the addon's versions
        if (!selectedMinecraftVersions.some(v => addonVersions.includes(v))) return false;
      }
      if (selectedModloaders.length > 0) {
        let addonLoaders = addon.modrinth_info?.loaders || [];
        // Check if any selected modloader is in the addon's loaders
        if (!selectedModloaders.some(l => addonLoaders.includes(l))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "downloads") {
        return totalDownloads(b) - totalDownloads(a);
      }
      return 0; // "featured" order: preserve original order
    });
    
  // UPDATED toggle functions to toggle dropdowns on/off
  function toggleVersionDropdown() {
    if (showMinecraftDropdown) {
      showMinecraftDropdown = false;
    } else {
      const rect = versionButton.getBoundingClientRect();
      versionDropdownX = rect.left;
      versionDropdownY = rect.bottom;
      showMinecraftDropdown = true;
    }
  }
  
  function toggleModloaderDropdown() {
    if (showModloaderDropdown) {
      showModloaderDropdown = false;
    } else {
      const rect = modloaderButton.getBoundingClientRect();
      modloaderDropdownX = rect.left;
      modloaderDropdownY = rect.bottom;
      showModloaderDropdown = true;
    }
  }

  // Document click handler to close dropdowns when clicking outside
  function handleClickOutside(event: MouseEvent) {
    // For version dropdown
    if (showMinecraftDropdown) {
      const versionDropdown = document.querySelector('.version-dropdown');
      const isClickInDropdown = versionDropdown && versionDropdown.contains(event.target as Node);
      if (versionButton && !versionButton.contains(event.target as Node) && !isClickInDropdown) {
        showMinecraftDropdown = false;
      }
    }
    
    // For modloader dropdown  
    if (showModloaderDropdown) {
      const modloaderDropdown = document.querySelector('.modloader-dropdown');
      const isClickInDropdown = modloaderDropdown && modloaderDropdown.contains(event.target as Node);
      if (modloaderButton && !modloaderButton.contains(event.target as Node) && !isClickInDropdown) {
        showModloaderDropdown = false;
      }
    }
  }
  
  onMount(() => {
    (adsbygoogle = window.adsbygoogle || []).push({});
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<svelte:head>
  <title>Create Addons</title>
</svelte:head>

<main class="bg-(--background) bg-checker flex flex-col font-(family-name:--font-family-monospace)">
  <!-- Header Section -->
  <div class="md:h-[20vh]">
    <div><ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-2623535512589719"
      data-ad-slot="9222187815"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
 </div>
    <div class="relative z-0 max-w-2/3">
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

  <!-- Filter/Sort Bar -->
  <div class="overflow-visible p-2 text-white bg-(--background-secondary) shadow-lg pixel-corners mb-2 flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mx-4">
    <div class="flex flex-wrap items-center gap-4 overflow-visible">
      <!-- Minecraft Version Filter -->
      <div class="relative ">
        <button bind:this={versionButton}
                class="px-3 py-1 bg-white/[0.0875] shadow-lg pixel-corners" 
                onclick={toggleVersionDropdown}>
          {selectedMinecraftVersions.length ? selectedMinecraftVersions.join(', ') : "Filter by Minecraft Version"}
        </button>
      </div>

      <!-- Modloader Filter -->
      <div class="relative">
        <button bind:this={modloaderButton}
              class="px-3 py-1 bg-white/[0.0875] shadow-lg pixel-corners" 
              onclick={toggleModloaderDropdown}>
          {selectedModloaders.length ? selectedModloaders.join(', ') : "Filter by Modloader"}
        </button>
      </div>
    </div>
    
    <!-- Sorting Selector - Updated background color -->
    <div class="flex items-center space-x-2">
      <span class="font-bold">Sort by:</span>
      <select class="px-3 py-1 bg-(--background-secondary) shadow-lg pixel-corners focus:outline-none" bind:value={sortBy}>
        <option value="featured">Featured</option>
        <option value="downloads">Downloads</option>
      </select>
    </div>
  </div>

  <!-- Dropdowns with portal to avoid stacking context issues -->
  {#if showMinecraftDropdown}
    <div use:portal 
         class="text-white fixed bg-(--background-secondary) shadow-xl pixel-corners min-w-32 z-[9999] version-dropdown"
         style="top: {versionDropdownY}px; left: {versionDropdownX}px;">
      {#each minecraftVersions as version}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="px-4 py-2 hover:bg-(--background) font-(family-name:--font-family-monospace) cursor-pointer flex items-center" 
             onclick={() => { selectedMinecraftVersions = toggleSelection(selectedMinecraftVersions, version); }}>
          <span class="mr-2 font-(family-name:--font-family-monospace)">{selectedMinecraftVersions.includes(version) ? '✓' : ''}</span>
          {version}
        </div>
      {/each} 
    </div>
  {/if}

  {#if showModloaderDropdown}
    <div use:portal
         class="text-white fixed bg-(--background-secondary) shadow-lg pixel-corners z-[9999] min-w-32 modloader-dropdown"
         style="top: {modloaderDropdownY}px; left: {modloaderDropdownX}px;">
      {#each modloaders as loader}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="px-4 py-2 hover:bg-(--background) cursor-pointer flex items-center font-(family-name:--font-family-monospace)"
             onclick={() => { selectedModloaders = toggleSelection(selectedModloaders, loader); }}>
          <span class="mr-2">{selectedModloaders.includes(loader) ? '✓' : ''}</span>
          {loader}
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Addons Grid -->
  <section class="text-white pt-2 px-4 overflow-auto overflow-x-clip max-h-screen">
    {#if filteredAddons.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each filteredAddons as addon (addon.name)}
          <div class="relative p-4 bg-(--background-secondary) shadow-lg pixel-corners">
                    <!-- Background Mod Logo (absolute, low opacity) -->
                    {#if addon.modrinth_info && addon.modrinth_info.icon_url}
                    <img src="{addon.modrinth_info.icon_url}" alt="{addon.name} Logo" class="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] object-contain opacity-10 pointer-events-none blur-sm"  />
                  {:else if addon.curseforge_info && addon.curseforge_info.logo && addon.curseforge_info.logo.url}
                    <img src="{addon.curseforge_info.logo.url}" alt="{addon.name} Logo" class="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] object-contain opacity-10 pointer-events-none blur-sm"  />
                  {/if}
            <div class="relative flex flex-row gap-3">
              <div class="w-16 h-16 min-w-16 pixel-corners">
                {#if addon.modrinth_info && addon.modrinth_info.icon_url}
                  <img src="{addon.modrinth_info.icon_url}" alt="{addon.name} Logo" class="w-16 h-16 mb-4" />
                {:else if addon.curseforge_info && addon.curseforge_info.logo && addon.curseforge_info.logo.url}
                  <img src="{addon.curseforge_info.logo.url}" alt="{addon.name} Logo" class="w-16 h-16 mb-4" />
                {:else}
                  <img src="https://static.wikia.nocookie.net/minecraft_gamepedia/images/b/be/Grass_Block_%28top_texture%29_JE4_BE2.png/revision/latest?cb=20230704210148" alt="Placeholder Logo" class="w-16 h-16 mb-4" />
                {/if}
              </div>      
              <div class="flex flex-col whitespace-nowrap w-full text-xl font-bold">
                <!-- Header row: Name + Icon Links -->
                <div class="flex items-center justify-between">
                  <div class="truncate">
                    {addon.name}
                  </div>
                  <div class="flex flex-shrink-0 space-x-2 ">
                    {#if addon.modrinth}
                      <a
                        href={addon.modrinth.startsWith('http') ? addon.modrinth : "https://modrinth.com/project/" + addon.modrinth}
                        target="_blank"
                        title="View on Modrinth">
                        <div class="outlink-icon">
                        <img src="icons/modrinth.svg" alt="Modrinth" class="w-[26px] h-[26px] invert" />
                        <svg class="absolute -top-[5.5px] -right-[6.5px] w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H8M17 7V16" stroke="#261e29" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M7 17L17 7M17 7H8M17 7V16" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      </div>
                      </a>
                    {/if}
                    {#if addon.curseforge_info && addon.curseforge_info.slug}
                      <a
                        href={"https://www.curseforge.com/minecraft/mc-mods/" + addon.curseforge_info.slug}
                        target="_blank"
                        title="View on CurseForge">
                        <div class="outlink-icon">
                        <img src="icons/curseforge.svg" alt="CurseForge" class="w-[26px] h-[26px] invert" />
                        <svg class="absolute -top-[5.5px] -right-[6.5px] w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H8M17 7V16" stroke="#261e29" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M7 17L17 7M17 7H8M17 7V16" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      </div>
                      </a>
                    {/if}
                  </div>
                </div>
                <!-- Tags for version and loaders -->
                <div class="flex flex-wrap gap-1 mt-1">
                  {#if addon.modrinth_info && addon.modrinth_info.game_versions}
                    <span class="bg-black/[.15] text-black dark:invert text-xs px-[6px] py-1 pixel-corners">
                      {getVersionRange(addon.modrinth_info.game_versions)}
                    </span>
                  {/if}
                  {#if addon.modrinth_info && addon.modrinth_info.loaders}
                    {#if addon.modrinth_info.loaders.includes("fabric")}
                      <span class="text-xs px-[6px] py-1 pixel-corners">
                        <img src="icons/fabric.svg" class="invert w-4 h-4 inline-block transform scale-x-[1.1]" alt="Fabric" />
                        Fabric
                      </span>
                    {/if}
                    {#if addon.modrinth_info.loaders.includes("forge")}
                      <span class="text-xs px-[6px] py-1 pixel-corners">
                        <img src="icons/forge.svg" class="invert w-4 h-4 inline-block transform scale-x-[1.1]" alt="Forge" />
                        Forge
                      </span>
                    {/if}
                    {#if addon.modrinth_info.loaders.includes("datapack")}
                      <span class="text-xs px-[6px] py-1 pixel-corners">
                        <img src="icons/datapack.svg" class="invert w-4 h-4 inline-block transform scale-x-[1.1]" alt="Data Pack" />
                        Data Pack
                      </span>
                    {/if}
                  {/if}
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="text-sm mb-2 pt-2 font-sans font-bold line-clamp-2 h-[3rem] min-h-[3rem] overflow-hidden text-ellipsis">
              {#if addon.modrinth_info && addon.modrinth_info.description}
                {addon.modrinth_info.description}
              {:else if addon.curseforge_info && addon.curseforge_info.description}
                {addon.curseforge_info.description}
              {:else}
                {addon.description}
              {/if}
            </p>

            <div class="flex flex-row gap-2 w-full">
              <p class="mb-1 font-sans font-bold whitespace-nowrap flex-shrink-0 flex items-center">
                <img src="icons/download.svg" class="w-4 h-4 inline-block dark:invert transform scale-x-[1.1] mr-1" alt="Downloads" />
                {formatNumber(totalDownloads(addon))}
              </p>  
              <p class="mb-1 font-sans font-bold flex items-center min-w-0 flex-1">
                <img src="icons/person.svg" class="w-4 h-4 inline-block dark:invert transform scale-x-[1.1] mr-1 flex-shrink-0" alt="Authors" />
                <span class="truncate">
                  {#if addon.curseforge_info && addon.curseforge_info.authors}
                    {addon.curseforge_info.authors.map((a: { name: any; }) => a.name).join(', ')}
                  {:else}
                    {addon.authors}
                  {/if}
                </span>
              </p>
            </div>
          </div>
        {/each}      
      </div>
    {:else}
      <p class="text-center">No addons available.</p>
    {/if}
  </section>
  <!-- Buttons for Contact and Submit Addon -->
<div class="flex justify-center mt-4 space-x-4 pb-4 pt-4">
  <a href="/contact" class="px-4 py-2 bg-(--background-secondary) text-white font-bold pixel-corners shadow hover:contrast-[110%]  transition duration-200">
    Contact
  </a>
  <a href="/contact" class="px-4 py-2 bg-(--background-secondary) text-white font-bold pixel-corners shadow hover:contrast-[110%]  transition duration-200">
    Submit Addon
  </a>
</div>
<div>
  <p class="text-center text-md pb-5 text-(--background-secondary) contrast-125 shadow-xl">
    <a href="https://github.com/a0a7/CreateAddonsIndex" class="text-(--background-secondary)">Create Addons Index</a> v1.1 Copyright {new Date().getFullYear()} lev. Last updated {new Date().toLocaleDateString("ja-JP")}
  </p>
</div>
</main>

<style>
  .outlink-icon {
      transition: transform 0.05s ease-in;
      position: relative;
      text-decoration: none;
  }
  .outlink-icon:hover {
      transform: scale(1.1);
      opacity: 0.8;
  }
</style>