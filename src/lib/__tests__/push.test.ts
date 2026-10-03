import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileStore, deviceId, setPushStore, type Device } from "../push-store";
import { tick, type Sender } from "../push-send";

function device(p: Partial<Device> = {}): Device {
  return {
    id: "dev1",
    user: "demo",
    subscription: { endpoint: "https://push.example/abc", keys: { p256dh: "k", auth: "a" } },
    reminders: [],
    sent: [],
    leadMin: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...p,
  };
}

describe("FileStore", () => {
  let dir: string;
  beforeEach(() => (dir = mkdtempSync(path.join(tmpdir(), "mv-push-"))));
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("round-trips devices and serialises concurrent writes", async () => {
    const s = new FileStore(path.join(dir, "push.json"));
    await Promise.all([s.put(device({ id: "a" })), s.put(device({ id: "b" })), s.put(device({ id: "c" }))]);
    expect((await s.all()).map((d) => d.id).sort()).toEqual(["a", "b", "c"]);
    await s.delete("b");
    expect(await s.get("b")).toBeNull();
    expect((await s.all()).length).toBe(2);
  });

  it("derives a stable, opaque device id from the endpoint", async () => {
    const a = await deviceId("https://push.example/abc");
    expect(a).toBe(await deviceId("https://push.example/abc"));
    expect(a).not.toBe(await deviceId("https://push.example/xyz"));
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("tick", () => {
  let dir: string;
  let store: FileStore;
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "mv-tick-"));
    store = new FileStore(path.join(dir, "push.json"));
    setPushStore(store);
  });
  afterEach(() => {
    setPushStore(null);
    rmSync(dir, { recursive: true, force: true });
  });

  it("sends due reminders once and keeps future ones", async () => {
    const now = 10_000_000;
    await store.put(
      device({
        reminders: [
          { id: "due", title: "Run", body: "In 10 min", at: now - 30_000, url: "/app/notes?open=due" },
          { id: "later", title: "Call", body: "", at: now + 3_600_000, url: "/app" },
          { id: "stale", title: "Old", body: "", at: now - 3_600_000, url: "/app" },
        ],
      }),
    );
    const sent: string[] = [];
    const fake: Sender = async (_d, payload) => {
      sent.push(payload.title);
      return { ok: true };
    };
    const r1 = await tick(now, fake);
    expect(r1).toMatchObject({ devices: 1, sent: 1, failed: 0, removed: 0 });
    expect(sent).toEqual(["Run"]);
    const after = (await store.get("dev1"))!;
    expect(after.sent).toEqual([`due@${now - 30_000}`]);
    expect(after.reminders.map((r) => r.id)).toEqual(["due", "later"]); // stale pruned; due kept until it ages out

    const r2 = await tick(now + 1000, fake);
    expect(r2.sent).toBe(0); // not sent twice
  });

  it("removes devices whose subscription is gone (410)", async () => {
    const now = 5_000_000;
    await store.put(device({ reminders: [{ id: "x", title: "X", body: "", at: now, url: "/app" }] }));
    const gone: Sender = async () => ({ ok: false, gone: true, error: "410" });
    const r = await tick(now, gone);
    expect(r).toMatchObject({ failed: 1, removed: 1 });
    expect(await store.get("dev1")).toBeNull();
  });

  it("keeps the device on a transient failure", async () => {
    const now = 5_000_000;
    await store.put(device({ reminders: [{ id: "x", title: "X", body: "", at: now, url: "/app" }] }));
    const flaky: Sender = async () => ({ ok: false, gone: false, error: "502" });
    const r = await tick(now, flaky);
    expect(r).toMatchObject({ failed: 1, removed: 0 });
    expect(await store.get("dev1")).not.toBeNull();
  });
});
