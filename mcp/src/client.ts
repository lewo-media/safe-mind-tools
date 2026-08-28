/**
 * Minimal Safe Mind Public API v1 client (zero dependencies, Node >= 18 fetch).
 * Mirrors the abstract /v1 endpoints - no backend entities are exposed.
 */

export const DEFAULT_API_URL = 'https://api.safe-mind.de';

export interface ClientOptions {
    apiUrl?: string;
    apiKey?: string;
}

export class ApiError extends Error {
    public constructor(
        public readonly status: number,
        message: string,
        public readonly body?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    employeeCount: number;
}

export interface SurveyCreateInput {
    title?: string;
    startDate: string;
    durationWeeks: number;
    employeeCount: number;
    departments: string[];
    locations?: string[];
    analyticsMinThreshold?: number;
}

export class SafeMindClient {
    private readonly apiUrl: string;
    private readonly apiKey?: string;

    public constructor(options: ClientOptions = {}) {
        this.apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '');
        this.apiKey = options.apiKey;
    }

    // --- auth (no api key required) ---

    public register(input: RegisterInput): Promise<{ message: string }> {
        return this.request('POST', '/v1/auth/register', input, false);
    }

    public verifyEmail(email: string, code: string): Promise<{ message: string }> {
        return this.request('POST', '/v1/auth/verify-email', { email, code }, false);
    }

    public createApiKey(email: string, password: string, name?: string): Promise<{ apiKey: string }> {
        return this.request('POST', '/v1/auth/api-keys', { email, password, name }, false);
    }

    // --- api-key scoped ---

    public me(): Promise<unknown> {
        return this.request('GET', '/v1/me');
    }

    public listDepartments(): Promise<unknown> {
        return this.request('GET', '/v1/departments');
    }

    public createDepartment(name: string): Promise<unknown> {
        return this.request('POST', '/v1/departments', { name });
    }

    public listLocations(): Promise<unknown> {
        return this.request('GET', '/v1/locations');
    }

    public createLocation(name: string): Promise<unknown> {
        return this.request('POST', '/v1/locations', { name });
    }

    public createSurvey(input: SurveyCreateInput): Promise<unknown> {
        return this.request('POST', '/v1/surveys', input);
    }

    public listSurveys(): Promise<unknown> {
        return this.request('GET', '/v1/surveys');
    }

    public getSurvey(id: string): Promise<unknown> {
        return this.request('GET', `/v1/surveys/${encodeURIComponent(id)}`);
    }

    public getAnalytics(id: string, groupBy?: string): Promise<unknown> {
        const query = groupBy ? `?groupBy=${encodeURIComponent(groupBy)}` : '';
        return this.request('GET', `/v1/surveys/${encodeURIComponent(id)}/analytics${query}`);
    }

    private async request<T>(method: string, path: string, body?: unknown, requiresKey = true): Promise<T> {
        const headers: Record<string, string> = { accept: 'application/json' };
        if (body !== undefined) {
            headers['content-type'] = 'application/json';
        }
        if (requiresKey) {
            if (!this.apiKey) {
                throw new ApiError(401, 'No API key. Run `safe-mind login` or set SAFE_MIND_API_KEY.');
            }
            headers.authorization = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(`${this.apiUrl}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });

        const text = await response.text();
        let parsed: unknown;
        try {
            parsed = text ? JSON.parse(text) : undefined;
        } catch {
            parsed = text;
        }

        if (!response.ok) {
            const message =
                typeof parsed === 'object' && parsed !== null && 'message' in parsed
                    ? String((parsed as { message: unknown }).message)
                    : `${response.status} ${response.statusText}`;
            throw new ApiError(response.status, message, parsed);
        }
        return parsed as T;
    }
}
