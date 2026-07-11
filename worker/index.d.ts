type AssetFetcher = {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};
export interface Env {
    ASSETS: AssetFetcher;
    SUPABASE_URL?: string;
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
}
declare const _default: {
    fetch(request: Request, env: Env): Promise<Response>;
};
export default _default;
