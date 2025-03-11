// @ts-ignore
import fs from 'fs';
import csvParser from 'csv-parser';
import yaml from 'js-yaml';
import { Curseforge } from 'node-curseforge';

// For Node versions that do not have a global fetch (if needed):
// import fetch from 'node-fetch';

// Replace with your CurseForge API token
// @ts-ignore
const cf_token = process.env.CF_TOKEN || '';
const cf = new Curseforge(cf_token);

/**
 * Reads CSV data and returns an array of rows.
 */
function getCsvData() {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    const rows = [];
    fs.createReadStream('../data/data.csv')
      .pipe(csvParser())
      // @ts-ignore
      .on('data', (data) => {
        rows.push(data);
      })
      .on('end', () => {
        console.log(`Successfully read ${rows.length} rows from CSV.`);
        // @ts-ignore
        resolve(rows);
      })
      // @ts-ignore
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
        reject(err);
      });
  });
}

/**
 * Enriches an addon with details from CurseForge and Modrinth if available.
 */
// @ts-ignore
async function enrichAddon(addon) {
  // Fetch CurseForge data if available
  if (addon.curseforge) {
    console.log(`Enriching addon "${addon.name}" with CurseForge data by visiting URL.`);

    try {
      // Visit the CurseForge URL to fetch the page HTML.
      const res = await fetch(addon.curseforge, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
          'Referer': 'https://www.google.com',
          'Cookie': '' 
        }
      });
        if (!res.ok) {
        throw new Error(`HTTP error while fetching URL: ${res.status}`);
      }
      const html = await res.text();

      // Extract the project ID from the HTML.
      const idMatch = html.match(/<dt>\s*Project ID\s*<\/dt>\s*<dd>\s*(\d+)\s*<\/dd>/i);
      if (!idMatch) {
        console.warn(`Could not extract project id from CurseForge page for addon "${addon.name}".`);
      } else {
        const projectId = idMatch[1];
        console.log(`Extracted project id "${projectId}" for addon "${addon.name}".`);

        // Use the project ID with the CurseForge API.
        // @ts-ignore
        const mod = await cf.get_mod(projectId);
        console.log(`Found mod "${mod.name}" (id: ${mod.id}) for addon "${addon.name}".`);
        // @ts-ignore
        const desc = await mod.get_description();
        //console.log(`Mod description for "${addon.name}":`, desc);
        addon.curseforge_info = {
          id: mod.id,
          name: mod.name,
          slug: mod.slug,
          authors: mod.authors,
          downloadCount: mod.downloadCount,
          dateCreated: mod.dateCreated,
          dateModified: mod.dateModified,
          dateReleased: mod.dateReleased,
          links: mod.links,
          logo: mod.logo,
          primaryCategoryId: mod.primaryCategoryId,
          status: mod.status,
          summary: mod.summary,
          thumbnails: mod.thumbnails
        };
      }
    } catch (err) {
      console.error(`Error fetching CurseForge data for "${addon.name}":`, err);
    }
  }
  
  // Fetch Modrinth data if available.
  if (addon.modrinth) {
    //console.log(`Enriching addon "${addon.name}" with Modrinth data.`);
    try {
      let parts = addon.modrinth.split('/');
      let slug = parts.filter(Boolean).pop();
      const modrinthUrl = `https://api.modrinth.com/v2/project/${slug}`;
      const res = await fetch(modrinthUrl);
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const modrinthData = await res.json();
      delete modrinthData.body;
      delete modrinthData.project_type;
      delete modrinthData.body_url;
      delete modrinthData.categories;
      delete modrinthData.additional_categories;
      delete modrinthData.versions;
      delete modrinthData.thread_id;
      delete modrinthData.monetization_status;
      //console.log(`Modrinth data for "${addon.name}" after cleanup:`, modrinthData);
      addon.modrinth_info = modrinthData;
    } catch (err) {
      console.error(`Error fetching Modrinth data for "${addon.name}":`, err);
    }
  }
  return addon;
}
/* Recursively converts any URL objects (or similar types) to strings,
 * so that js-yaml can dump them.
 */
// @ts-ignore
function convertURLs(obj) {
  if (typeof obj === 'function') {
    return undefined; // Skip function values
  }
  if (obj instanceof URL) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    // @ts-ignore
    return obj.map(item => convertURLs(item));
  }
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      // @ts-ignore
      newObj[key] = convertURLs(obj[key]);
    }
    return newObj;
  }
  return obj;
}

/**
 * Processes the CSV, enriches each addon, and returns the final array.
 */
async function processData() {
  const csvData = await getCsvData();
  // @ts-ignore
  const addons = await Promise.all(csvData.map(async (row) => {
    // Map CSV columns to your schema.
    let addon = {
      name: row['Name'],
      type: row['Type'],
      description: row['Description'],
      authors: row['Authors'],
      modrinth: row['Modrinth'] || null,
      curseforge: row['Curseforge'] || null,
      website: row['Website'] || null
    };
    return await enrichAddon(addon);
  }));
  return addons;
}

// Main execution: process CSV & write YAML file.
processData()
  .then((addons) => {
    const safeAddons = addons.map(addon => convertURLs(addon));
    const yamlContent = yaml.dump(safeAddons);
    fs.writeFileSync('../data/addons.yaml', yamlContent, 'utf8');
    console.log("YAML file generated successfully at ../data/addons.yaml");
  })
  .catch((err) => {
    console.error("Failed to generate YAML file:", err);
  });