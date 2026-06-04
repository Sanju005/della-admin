type AssetFetcher = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

export interface Env {
  ASSETS: AssetFetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    if (
      request.method === "GET" &&
      assetResponse.status === 404 &&
      !url.pathname.startsWith("/api/")
    ) {
      const indexRequest = new Request(new URL("/index.html", url.origin), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return assetResponse;
  },
};
