import { describe, expect, it } from 'vitest';
import { parseArgs, flagString, flagStrings, flagNumber } from './args.js';

describe('parseArgs', () => {
    it('parses positionals, value flags and boolean flags', () => {
        const { positionals, flags } = parseArgs(['surveys', 'create', '--start', '2026-09-15', '--json']);
        expect(positionals).toEqual(['surveys', 'create']);
        expect(flags.start).toBe('2026-09-15');
        expect(flags.json).toBe(true);
    });

    it('collects repeated flags into arrays (departments use case)', () => {
        const { flags } = parseArgs(['--department', 'BCF', '--department', 'Bedichtung', '--department', 'AVER, EDV']);
        expect(flagStrings(flags, 'department')).toEqual(['BCF', 'Bedichtung', 'AVER, EDV']);
    });

    it('supports --flag=value syntax and numeric flags', () => {
        const { flags } = parseArgs(['--weeks=4', '--employees', '220']);
        expect(flagNumber(flags, 'weeks')).toBe(4);
        expect(flagNumber(flags, 'employees')).toBe(220);
    });

    it('treats a flag before another flag as boolean', () => {
        const { flags } = parseArgs(['--json', '--api-url', 'http://localhost:7003']);
        expect(flags.json).toBe(true);
        expect(flagString(flags, 'api-url')).toBe('http://localhost:7003');
    });

    it('returns undefined for missing or non-numeric flags', () => {
        const { flags } = parseArgs(['--weeks', 'abc']);
        expect(flagNumber(flags, 'weeks')).toBeUndefined();
        expect(flagString(flags, 'missing')).toBeUndefined();
    });
});
