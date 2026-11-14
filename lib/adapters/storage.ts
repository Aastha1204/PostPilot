export interface StorageProvider {
  readonly name: string;
  /** Uploads a file and returns a public URL (Instagram needs media at a public URL at publish time). */
  upload(path: string, data: Buffer, contentType: string): Promise<string>;
}

class MockStorage implements StorageProvider {
  readonly name = "mock";
  async upload(path: string): Promise<string> {
    return `https://storage.demo.postpilot.local/public/${path}`;
  }
}

class SupabaseStorage implements StorageProvider {
  readonly name = "supabase";
  private readonly base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private readonly key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  private readonly bucket = process.env.SUPABASE_PUBLIC_BUCKET || "post-media";

  async upload(path: string, data: Buffer, contentType: string): Promise<string> {
    const res = await fetch(`${this.base}/storage/v1/object/${this.bucket}/${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.key}`, apikey: this.key, "content-type": contentType, "x-upsert": "true" },
      body: new Uint8Array(data),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Storage upload failed (${res.status})`);
    return `${this.base}/storage/v1/object/public/${this.bucket}/${path}`;
  }
}

export function getStorage(live: boolean): StorageProvider {
  return live && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? new SupabaseStorage() : new MockStorage();
}
