import { beforeAll, describe, expect, it } from "vitest";
import { checkCredentials, createSession, timingSafeEqual, verifySession } from "../auth";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-that-is-long-enough-0123456789";
  process.env.AUTH_USER = "demo";
  process.env.AUTH_PASSWORD = "vault-2026";
});

describe("session", () => {
  it("signs and verifies", async () => {
    const { token } = await createSession("demo");
    const s = await verifySession(token);
    expect(s?.user).toBe("demo");
  });
  it("rejects tampering and garbage", async () => {
    const { token } = await createSession("demo");
    const [user, exp, sig] = token.split(".");
    expect(await verifySession(`admin.${exp}.${sig}`)).toBeNull();
    expect(await verifySession(`${user}.${exp}.${sig}x`)).toBeNull();
    expect(await verifySession("nope")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
  it("rejects expired tokens", async () => {
    const { token } = await createSession("demo");
    const [user, , sig] = token.split(".");
    expect(await verifySession(`${user}.1000.${sig}`)).toBeNull();
  });
});

describe("credentials", () => {
  it("accepts the configured pair only", () => {
    expect(checkCredentials("demo", "vault-2026")).toBe(true);
    expect(checkCredentials("demo", "vault-2027")).toBe(false);
    expect(checkCredentials("demo ", "vault-2026")).toBe(false);
    expect(checkCredentials("", "")).toBe(false);
  });
  it("timingSafeEqual is length-strict", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "ab")).toBe(false);
  });
});
