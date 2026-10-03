import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Reminder } from "./reminders";

/**
 * Server-side state for push: one record per browser subscription, carrying the
 * reminders that browser asked us to deliver. Deliberately tiny: title + time + a
 * path. Two backends — a JSON file (self-hosting, local) and Upstash Redis REST
 * (serverless hosts such as Vercel). Chosen by env at runtime.
 */
export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface Device {
  /** sha-256 of the endpoint, safe to expose to the client */
  id: string;
  user: string;
  subscription: PushSubscriptionJSON;
  reminders: Reminder[];
  /** reminder ids already delivered (kept small) */
  sent: string[];
  leadMin: number;
  createdAt: string;
  updatedAt: string;
}

export interface PushStore {
  get(id: string): Promise<Device | null>;
  put(device: Device): Promise<void>;
  delete(id: string): Promise<void>;
  all(): Promise<Device[]>;
}

export async function deviceId(endpoint: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(buf))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── File backend ─────────────────────────────────────────────────────── */
export class FileStore implements PushStore {
  private lock: Promise<void> = Promise.resolve();
  constructor(private file: string) {}

  private async read(): Promise<Record<string, Device>> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch {
      return {};
    }
  }
  private async write(data: Record<string, Device>) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 1), "utf8");
    await fs.rename(tmp, this.file);
  }
  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.lock.then(fn, fn);
    this.lock = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
  get(id: string) {
    return this.serial(async () => (await this.read())[id] ?? null);
  }
  put(device: Device) {
    return this.serial(async () => {
      const d = await this.read();
      d[device.id] = device;
      await this.write(d);
    });
  }
  delete(id: string) {
    return this.serial(async () => {
      const d = await this.read();
      delete d[id];
      await this.write(d);
    });
  }
  all() {
    return this.serial(async () => Object.values(await this.read()));
  }
}

/* ── Upstash Redis REST backend ───────────────────────────────────────── */
export class UpstashStore implements PushStore {
  constructor(
    private url: string,
    private token: string,
  ) {}
  private async cmd<T = unknown>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const json = (await res.json()) as { result: T; error?: string };
    if (json.error) throw new Error(json.error);
    return json.result;
  }
  async get(id: string) {
    const raw = await this.cmd<string | null>("GET", `mv:device:${id}`);
    return raw ? (JSON.parse(raw) as Device) : null;
  }
  async put(device: Device) {
    await this.cmd("SET", `mv:device:${device.id}`, JSON.stringify(device));
    await this.cmd("SADD", "mv:devices", device.id);
  }
  async delete(id: string) {
    await this.cmd("DEL", `mv:device:${id}`);
    await this.cmd("SREM", "mv:devices", id);
  }
  async all() {
    const ids = await this.cmd<string[]>("SMEMBERS", "mv:devices");
    const out: Device[] = [];
    for (const id of ids) {
      const d = await this.get(id);
      if (d) out.push(d);
    }
    return out;
  }
}

let store: PushStore | null = null;
export function getPushStore(): PushStore {
  if (store) return store;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    store = new UpstashStore(url, token);
  } else if (process.env.PUSH_STORE_FILE) {
    store = new FileStore(path.resolve(process.cwd(), process.env.PUSH_STORE_FILE));
  } else if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Serverless filesystems are read-only except /tmp: subscriptions survive only
    // while the instance is warm. Set Upstash for durable storage.
    store = new FileStore(path.join(os.tmpdir(), "mindvault-push.json"));
  } else {
    store = new FileStore(path.resolve(process.cwd(), ".data/push.json"));
  }
  return store;
}

/** Test seam. */
export function setPushStore(s: PushStore | null) {
  store = s;
}
