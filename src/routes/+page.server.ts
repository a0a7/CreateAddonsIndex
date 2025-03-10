import fs from 'fs';
import yaml from 'js-yaml';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const fileContents = fs.readFileSync('src/data/addons.yaml', 'utf8');
    const addons = yaml.load(fileContents);
    return { addons };
};