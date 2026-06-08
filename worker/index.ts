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
    const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
    const isAssetRequest =
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/favicon") ||
      /\.[a-z0-9]+$/i.test(url.pathname);

    if (
      request.method === "GET" &&
      assetResponse.status === 404 &&
      acceptsHtml &&
      !isAssetRequest &&
      !url.pathname.startsWith("/api/")
    ) {
      const indexRequest = new Request(new URL("/index.html", url.origin), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return assetResponse;
  },
};
