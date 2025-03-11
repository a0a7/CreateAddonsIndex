<script lang="ts">
  export let data: { addons: any[] };
  const { addons } = data;

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
    // If the lowest equals highest, just return one value.
    return sorted[0] === sorted[sorted.length - 1]
      ? sorted[0]
      : `${sorted[0]} - ${sorted[sorted.length - 1]}`;
  }

</script>

<svelte:head>
  <title>Create Addons</title>
</svelte:head>

<main class="bg-(--background) flex flex-col font-(family-name:--font-family-monospace)">
  <div class="md:h-[20vh]">
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

  <section class="p-6 overflow-auto max-h-screen">
    {#if addons.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each addons as addon (addon.name)}
          <div class="p-4 bg-(--background-secondary) shadow-lg pixel-corners">
            <div class="flex flex-row gap-3">
              <div class="w-16 h-16 min-w-16 pixel-corners">
                {#if addon.modrinth_info && addon.modrinth_info.icon_url}
                  <img src="{addon.modrinth_info.icon_url}" alt="{addon.name} Logo" class="w-16 h-16 mb-4" />
                {:else if addon.curseforge_info && addon.curseforge_info.logo && addon.curseforge_info.logo.url}
                  <img src="{addon.curseforge_info.logo.url}" alt="{addon.name} Logo" class="w-16 h-16 mb-4" />
                {:else}
                  <img src="https://static.wikia.nocookie.net/minecraft_gamepedia/images/b/be/Grass_Block_%28top_texture%29_JE4_BE2.png/revision/latest?cb=20230704210148" alt="Placeholder Logo" class="w-16 h-16 mb-4" />
                {/if}
              </div>      
              <div class=" whitespace-nowrap w-full inline-block text-xl font-bold">
                  <div class="truncate">
                    {addon.name}
                  </div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    {#if addon.modrinth_info && addon.modrinth_info.game_versions}
                      <span class="bg-black/[.15] text-black dark:invert text-xs px-[6px] py-1 pixel-corners">
                        {#if addon.modrinth_info && addon.modrinth_info.game_versions}
                          {getVersionRange(addon.modrinth_info.game_versions)}
                        {/if}
                      </span>
                  {/if}
                    {#if addon.modrinth_info && addon.modrinth_info.loaders}
                    {#if addon.modrinth_info.loaders.includes("fabric")}
                      <span class="text-xs px-[6px] py-1 pixel-corners">
                        <img src="icons/fabric.svg" class="invert w-4 h-4 inline-block  transform scale-x-[1.1]" alt="" />
                        Fabric
                      </span>
                    {/if}
                    {#if addon.modrinth_info.loaders.includes("forge")}
                      <span class="text-xs px-[6px] py-1 pixel-corners">
                        <img src="icons/forge.svg" class="invert w-4 h-4 inline-block  transform scale-x-[1.1]" alt="" />
                        Forge
                      </span>
                    {/if}
                    {#if addon.modrinth_info.loaders.includes("datapack")}
                      <span class="text-xs px-[6px] py-1 pixel-corners">
                        <img src="icons/datapack.svg" class="invert w-4 h-4 inline-block transform scale-x-[1.1]" alt="" />
                        Data Pack
                      </span>
                    {/if}
                    {/if}
                    </div>
              </div>
          </div>
            <p class="text-sm mb-2 pt-2 font-sans text-bold">
              {#if addon.modrinth_info && addon.modrinth_info.description}
                {addon.modrinth_info.description}
              {:else if addon.curseforge_info && addon.curseforge_info.description}
                {addon.curseforge_info.description}
              {:else}
                {addon.description}
              {/if}
            </p>
            <div class="flex flex-row gap-2">
            <p class="mb-1 font-sans font-bold">
              <img src="icons/download.svg" class="w-4 h-4 inline-block dark:invert transform scale-x-[1.1]" alt="Downloads" />
              {formatNumber(totalDownloads(addon))}
            </p>  
            <p class="mb-1 font-sans font-bold">
              <img src="icons/person.svg" class="w-4 h-4 inline-block dark:invert transform scale-x-[1.1]" alt="Authors" />
              {#if addon.curseforge_info && addon.curseforge_info.authors}
                {addon.curseforge_info.authors.map((a: { name: any; }) => a.name).join(', ')}
              {:else}
                {addon.authors}
              {/if}
            </p>
          </div>
            <div class="flex space-x-2 mt-2">
              {#if addon.modrinth_info}
                {#if addon.modrinth_info.source_url}
                  <a href="{addon.modrinth_info.source_url}" target="_blank" title="Modrinth Source">
                    <span class="icon modrinth-source">MS</span>
                  </a>
                {/if}
                {#if addon.modrinth_info.wiki_url}
                  <a href="{addon.modrinth_info.wiki_url}" target="_blank" title="Modrinth Wiki">
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

