import { describe, expect, it } from "vitest";
import { classifyKey, classifyValue, classifyFilePath } from "./sensitiveClassifier.js";

describe("sensitiveClassifier", () => {
  it("detects API key by key name", () => {
    const res = classifyKey("my_api_key");
    expect(res?.type).toBe("api_key");
    expect(res?.evidence).toBe("key_name");
  });

  it("detects bearer token", () => {
    const res = classifyValue("Bearer abcdef12345");
    expect(res?.type).toBe("bearer_token");
  });

  it("detects JWT-like token", () => {
    const res = classifyValue("eyJhbGciOiJIUzI1NiIsInR5cCI.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmF.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    expect(res?.type).toBe("jwt");
  });

  it("detects private key block", () => {
    const res = classifyValue("-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----");
    expect(res?.type).toBe("private_key");
  });

  it("detects database URL", () => {
    const res = classifyValue("postgres://user:pass@localhost:5432/db");
    expect(res?.type).toBe("database_url");
  });

  it("detects email as possible PII", () => {
    const res = classifyValue("test@example.com");
    expect(res?.type).toBe("email_address");
    expect(res?.confidence).toBe("low");
  });

  it("detects phone-like string as possible PII", () => {
    const res = classifyValue("+1234567890");
    expect(res?.type).toBe("phone_number");
  });

  it("detects sensitive file paths", () => {
    expect(classifyFilePath("/home/user/.env")?.type).toBe("sensitive_file_path");
    expect(classifyFilePath("/etc/credentials.json")?.type).toBe("sensitive_file_path");
    expect(classifyFilePath("kubeconfig")?.type).toBe("sensitive_file_path");
  });
});
