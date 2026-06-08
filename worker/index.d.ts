type AssetFetcher = {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};
export interface Env {
    ASSETS: AssetFetcher;
}
declare const _default: {
    fetch(request: Request, env: Env): Promise<Response>;
};
export default _default;
