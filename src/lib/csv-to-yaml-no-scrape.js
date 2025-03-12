// @ts-ignore
import fs from 'fs';
import csvParser from 'csv-parser';
import yaml from 'js-yaml';
import { Curseforge } from 'node-curseforge';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';

// For Node versions that do not have a global fetch (if needed):
// import fetch from 'node-fetch';

// Replace with your CurseForge API token
// @ts-ignore
const cf_token = process.env.CF_TOKEN || '$2a$10$/PefNYjrnbxMSy.8767InuIQ1qc7W9xfHh/NMSUMXqOceKzbH3wYS';
const cf = new Curseforge(cf_token);

// Check if the -scrape flag is passed
const scrapeFlag = process.argv.includes('-scrape');

// Read cookies from a file
// const cookiesJson = fs.readFileSync('src/data/cookies.txt', 'utf-8');
// const cookiesArray = JSON.parse('{}');
//const cookies = cookiesArray.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
//let cookieIndex = 0;

// Load existing IDs from a separate file
let existingIds = {};
try {
  const idsJson = fs.readFileSync('src/data/ids.json', 'utf-8');
  existingIds = JSON.parse(idsJson);
} catch (err) {
  console.warn('No existing IDs file found, starting fresh.');
}

/**
 * Reads CSV data and returns an array of rows.
 */
function getCsvData() {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream('src/data/data.csv')
      .pipe(csvParser())
      .on('data', (data) => {
        rows.push(data);
      })
      .on('end', () => {
        console.log(`Successfully read ${rows.length} rows from CSV.`);
        resolve(rows);
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
        reject(err);
      });
  });
}

/**
 * Enriches an addon with details from CurseForge and Modrinth if available.
 */
async function enrichAddon(addon) {
  // Fetch CurseForge data if available
  if (addon.curseforge) {
    console.log(`Enriching addon "${addon.name}" with CurseForge data.`);

    try {
      let projectId = addon.curseforge_id || existingIds[addon.name];

      if (!projectId && scrapeFlag) {
        // Rotate through the list of cookies
        const cookie = "";

        // Visit the CurseForge URL to fetch the page HTML.
        const res = await fetch(addon.curseforge, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
            'Referer': 'https://www.google.com',
            'Cookie': cookie
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
          projectId = idMatch[1];
          console.log(`Extracted project id "${projectId}" for addon "${addon.name}".`);
        }
      }

      if (projectId) {
        // Use the project ID with the CurseForge API.
        const mod = await cf.get_mod(projectId);
        console.log(`Found mod "${mod.name}" (id: ${mod.id}) for addon "${addon.name}".`);
        const desc = await mod.get_description();
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
        addon.curseforge_id = mod.id; // Add the CurseForge ID to the addon object
        existingIds[addon.name] = mod.id; // Save the ID to the existing IDs object
      }
    } catch (err) {
      console.error(`Error fetching CurseForge data for "${addon.name}":`, err);
    }
  }
  
  // Fetch Modrinth data if available.
  if (addon.modrinth) {
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
function convertURLs(obj) {
  if (typeof obj === 'function') {
    return undefined; // Skip function values
  }
  if (obj instanceof URL) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(item => convertURLs(item));
  }
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
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
  const addons = await Promise.all(csvData.map(async (row) => {
    // Map CSV columns to your schema.
    let addon = {
      name: row['Name'],
      type: row['Type'],
      description: row['Description'],
      authors: row['Authors'],
      modrinth: row['Modrinth'] || null,
      curseforge: row['Curseforge'] || null,
      curseforge_id: row['Curseforge ID'] || null,
      website: row['Website'] || null
    };
    return await enrichAddon(addon);
  }));
  return addons;
}

/**
 * Updates the CSV file with the enriched data.
 */
async function updateCsv(addons) {
  const csvData = await getCsvData();
  const updatedRows = csvData.map(row => {
    const addon = addons.find(a => a.name === row['Name']);
    if (addon && addon.curseforge_id) {
      row['Curseforge ID'] = addon.curseforge_id;
    }
    return row;
  });

  const csvStringifier = stringify({ header: true });
  const writableStream = fs.createWriteStream('src/data/data.csv');
  csvStringifier.pipe(writableStream);
  updatedRows.forEach(row => csvStringifier.write(row));
  csvStringifier.end();
}

// Main execution: process CSV & write YAML file.
processData()
  .then((addons) => {
    const safeAddons = addons.map(addon => convertURLs(addon));
    const yamlContent = yaml.dump(safeAddons);
    fs.writeFileSync('src/data/addons.yaml', yamlContent, 'utf8');
    console.log("YAML file generated successfully at src/data/addons.yaml");

    // Update the CSV file with CurseForge IDs
    updateCsv(addons).then(() => {
      console.log("CSV file updated successfully with CurseForge IDs.");

      // Save the existing IDs to a separate file
      fs.writeFileSync('src/data/ids.json', JSON.stringify(existingIds, null, 2), 'utf8');
      console.log("IDs file updated successfully at src/data/ids.json");
    }).catch((err) => {
      console.error("Failed to update CSV file:", err);
    });
  })
  .catch((err) => {
    console.error("Failed to generate YAML file:", err);
  });
