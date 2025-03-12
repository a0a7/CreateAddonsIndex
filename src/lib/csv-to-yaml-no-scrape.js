// @ts-ignore
import fs from 'fs';
import csvParser from 'csv-parser';
import yaml from 'js-yaml';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the correct paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const csvFilePath = path.join(dataDir, 'data.csv');
const idsFilePath = path.join(dataDir, 'ids.json');
const yamlFilePath = path.join(dataDir, 'addons.yaml');

// Load existing IDs from a separate file
let existingIds = {};
try {
  const idsJson = fs.readFileSync(idsFilePath, 'utf-8');
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
    fs.createReadStream(csvFilePath)
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
 * Enriches an addon with details from existing data.
 */
async function enrichAddon(addon) {
  // Fetch CurseForge data if available
  if (addon.curseforge) {
    console.log(`Enriching addon "${addon.name}" with existing CurseForge data.`);

    let projectId = addon.curseforge_id || existingIds[addon.name];

    if (projectId) {
      addon.curseforge_id = projectId; // Add the CurseForge ID to the addon object
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
      curseforge_id: row['Curseforge ID'] || existingIds[row['Name']] || null,
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
  const writableStream = fs.createWriteStream(csvFilePath);
  csvStringifier.pipe(writableStream);
  updatedRows.forEach(row => csvStringifier.write(row));
  csvStringifier.end();
}

// Main execution: process CSV & write YAML file.
processData()
  .then((addons) => {
    const safeAddons = addons.map(addon => convertURLs(addon));
    const yamlContent = yaml.dump(safeAddons);
    fs.writeFileSync(yamlFilePath, yamlContent, 'utf8');
    console.log(`YAML file generated successfully at ${yamlFilePath}`);

    // Update the CSV file with CurseForge IDs
    updateCsv(addons).then(() => {
      console.log("CSV file updated successfully with CurseForge IDs.");

      // Save the existing IDs to a separate file
      fs.writeFileSync(idsFilePath, JSON.stringify(existingIds, null, 2), 'utf8');
      console.log(`IDs file updated successfully at ${idsFilePath}`);
    }).catch((err) => {
      console.error("Failed to update CSV file:", err);
    });
  })
  .catch((err) => {
    console.error("Failed to generate YAML file:", err);
  });