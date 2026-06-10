import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, '../../config.json');

export async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function saveConfig(config) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export async function addApp(name, directory) {
  const config = await getConfig();
  const existingAppIndex = config.findIndex((app) => app.name === name);
  
  if (existingAppIndex >= 0) {
    config[existingAppIndex].directory = directory;
  } else {
    config.push({ name, directory });
  }
  
  await saveConfig(config);
}

export async function removeApp(name) {
  const config = await getConfig();
  const newConfig = config.filter((app) => app.name !== name);
  await saveConfig(newConfig);
}
