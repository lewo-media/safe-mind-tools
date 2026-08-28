import { describe, expect, it } from 'vitest';
import { buildServer } from './index.js';

describe('safe-mind-mcp server', () => {
    it('builds and exposes the 12 Safe Mind tools', async () => {
        const server = buildServer();
        // Registered tools live on the underlying McpServer registry.
        const registered = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools;
        const names = Object.keys(registered);
        expect(names).toHaveLength(12);
        expect(names).toEqual(
            expect.arrayContaining([
                'safe_mind_register',
                'safe_mind_verify_email',
                'safe_mind_get_api_key',
                'safe_mind_me',
                'safe_mind_create_department',
                'safe_mind_create_survey',
                'safe_mind_get_analytics'
            ])
        );
    });
});
