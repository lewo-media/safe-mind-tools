import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface CliConfig {
    apiKey?: string;
    apiUrl?: string;
}

const CONFIG_DIR = join(homedir(), '.safe-mind');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function loadConfig(): CliConfig {
    try {
        return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as CliConfig;
    } catch {
        return {};
    }
}

export function saveConfig(config: CliConfig): void {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

export function clearConfig(): void {
    if (existsSync(CONFIG_FILE)) {
        rmSync(CONFIG_FILE);
    }
}
