<script lang="ts">
  import { toggleMode } from "mode-watcher";
  import { fly } from "svelte/transition";
  export let data: { addons: any[] };
  const { addons } = data;

  // helper to calculate combined downloads
  function totalDownloads(addon: { modrinth_info: { downloads: any; }; curseforge_info: { downloadCount: any; }; }) {
    const modrinthDownloads = addon.modrinth_info && addon.modrinth_info.downloads ? addon.modrinth_info.downloads : 0;
    const cfDownloads = addon.curseforge_info && addon.curseforge_info.downloadCount ? addon.curseforge_info.downloadCount : 0;
    return modrinthDownloads + cfDownloads;
  }
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
          <div class="p-4 bg-gray-800 rounded shadow-lg">
            {#if addon.modrinth_info && addon.modrinth_info.icon_url}
              <img src="{addon.modrinth_info.icon_url}" alt="{addon.name} Logo" class="w-16 h-16 mb-4" />
            {:else if addon.curseforge_info && addon.curseforge_info.logo && addon.curseforge_info.logo.url}
              <img src="{addon.curseforge_info.logo.url}" alt="{addon.name} Logo" class="w-16 h-16 mb-4" />
            {:else}
              <img src="https://static.wikia.nocookie.net/minecraft_gamepedia/images/b/be/Grass_Block_%28top_texture%29_JE4_BE2.png/revision/latest?cb=20230704210148" alt="Placeholder Logo" class="w-16 h-16 mb-4" />
            {/if}
            <h2 class="text-2xl font-bold mb-2">{addon.name}</h2>
            <p class="text-sm mb-2">
              {#if addon.modrinth_info && addon.modrinth_info.description}
                {addon.modrinth_info.description}
              {:else if addon.curseforge_info && addon.curseforge_info.description}
                {addon.curseforge_info.description}
              {:else}
                {addon.description}
              {/if}
            </p>
            <p class="mb-1"><strong>Versions:</strong>
              {#if addon.modrinth_info && addon.modrinth_info.game_versions}
                {addon.modrinth_info.game_versions.join(', ')}
              {:else}
                N/A
              {/if}
            </p>
            <p class="mb-1"><strong>Modloaders:</strong>
              {#if addon.modrinth_info && addon.modrinth_info.loaders}
                {addon.modrinth_info.loaders.join(', ')}
              {:else}
                N/A
              {/if}
            </p>
            <p class="mb-1"><strong>Author(s):</strong>
              {#if addon.curseforge_info && addon.curseforge_info.authors}
                {addon.curseforge_info.authors.map((a: { name: any; }) => a.name).join(', ')}
              {:else}
                {addon.authors}
              {/if}
            </p>
            <p class="mb-1"><strong>Total Downloads:</strong>
              {totalDownloads(addon)}
            </p>
            <!-- Links section -->
            <div class="flex space-x-2 mt-2">
              {#if addon.modrinth_info}
                {#if addon.modrinth_info.issues_url}
                  <a href="{addon.modrinth_info.issues_url}" target="_blank" title="Modrinth Issues">
                    <!-- Replace with your Modrinth Issues icon -->
                    <span class="icon modrinth-issues">MI</span>
                  </a>
                {/if}
                {#if addon.modrinth_info.source_url}
                  <a href="{addon.modrinth_info.source_url}" target="_blank" title="Modrinth Source">
                    <!-- Replace with your Modrinth Source icon -->
                    <span class="icon modrinth-source">MS</span>
                  </a>
                {/if}
                {#if addon.modrinth_info.wiki_url}
                  <a href="{addon.modrinth_info.wiki_url}" target="_blank" title="Modrinth Wiki">
                    <!-- Replace with your Wiki icon -->
                    <span class="icon modrinth-wiki">W</span>
                  </a>
                {/if}
                {#if addon.modrinth_info.discord_url}
                  <a href="{addon.modrinth_info.discord_url}" target="_blank" title="Modrinth Discord">
                    <!-- Replace with your Discord icon -->
                    <span class="icon modrinth-discord">D</span>
                  </a>
                {/if}
                <!-- Also link to the Modrinth project page -->
                <a
                  href={addon.modrinth.startsWith('http') ? addon.modrinth : "https://modrinth.com/project/" + addon.modrinth}
                  target="_blank"
                  title="View on Modrinth">
                  <span class="icon modrinth-page">MP</span>
                </a>
              {/if}
              {#if addon.curseforge_info && addon.curseforge_info.links}
                {#if addon.curseforge_info.links.issuesUrl}
                  <a href="{addon.curseforge_info.links.issuesUrl}" target="_blank" title="CurseForge Issues">
                    <!-- Replace with your CurseForge Issues icon -->
                    <span class="icon cf-issues">CI</span>
                  </a>
                {/if}
                {#if addon.curseforge_info.links.sourceUrl}
                  <a href="{addon.curseforge_info.links.sourceUrl}" target="_blank" title="CurseForge Source">
                    <!-- Replace with your CurseForge Source icon -->
                    <span class="icon cf-source">CS</span>
                  </a>
                {/if}
                {#if addon.curseforge_info.links.wikiUrl}
                  <a href="{addon.curseforge_info.links.wikiUrl}" target="_blank" title="CurseForge Wiki">
                    <!-- Replace with your Wiki icon -->
                    <span class="icon cf-wiki">CW</span>
                  </a>
                {/if}
                <!-- Link to the CurseForge project page -->
                {#if addon.curseforge_info.id}
                  <a href={"https://www.curseforge.com/minecraft/mc-mods/" + addon.curseforge_info.slug} target="_blank" title="View on CurseForge">
                    <span class="icon cf-page">CP</span>
                  </a>
                {/if}
              {/if}
            </div>
          </div>
        {/each}      
      </div>
    {:else}
      <p class="text-center">No addons available.</p>
    {/if}
  </section>
</main>