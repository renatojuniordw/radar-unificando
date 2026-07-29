export interface IHttpClient {
  fetch(url: string, options?: RequestInit): Promise<Response>;
}

export class NativeHttpClient implements IHttpClient {
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    return fetch(url, options);
  }
}
