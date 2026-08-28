/**
 * Tiny argv parser: positional args + `--flag value` / `--flag=value` / boolean flags.
 * Repeated flags collect into arrays (e.g. --department "A" --department "B").
 */

export interface ParsedArgs {
    positionals: string[];
    flags: Record<string, string | boolean | string[]>;
}

const BOOLEAN_FLAGS = new Set(['json', 'help', 'version']);

export function parseArgs(argv: string[]): ParsedArgs {
    const positionals: string[] = [];
    const flags: ParsedArgs['flags'] = {};

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith('--')) {
            positionals.push(arg);
            continue;
        }

        let name = arg.slice(2);
        let value: string | boolean;
        const eq = name.indexOf('=');
        if (eq !== -1) {
            value = name.slice(eq + 1);
            name = name.slice(0, eq);
        } else if (BOOLEAN_FLAGS.has(name) || i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
            value = true;
        } else {
            value = argv[++i];
        }

        const existing = flags[name];
        if (existing === undefined) {
            flags[name] = value;
        } else if (Array.isArray(existing)) {
            existing.push(String(value));
        } else {
            flags[name] = [String(existing), String(value)];
        }
    }

    return { positionals, flags };
}

export function flagString(flags: ParsedArgs['flags'], name: string): string | undefined {
    const value = flags[name];
    if (value === undefined || value === true) return undefined;
    return Array.isArray(value) ? value[value.length - 1] : String(value);
}

export function flagStrings(flags: ParsedArgs['flags'], name: string): string[] {
    const value = flags[name];
    if (value === undefined || value === true) return [];
    return Array.isArray(value) ? value : [String(value)];
}

export function flagNumber(flags: ParsedArgs['flags'], name: string): number | undefined {
    const raw = flagString(flags, name);
    if (raw === undefined) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
}
