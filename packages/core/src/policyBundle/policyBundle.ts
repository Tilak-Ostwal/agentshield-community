import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { canonicalJson } from "../evidence/canonicalJson.js";
import { hashCanonical } from "../evidence/hashChain.js";
import { AgentShieldSecurityError } from "../shared/securityError.js";

export const bundleKindSchema = z.enum(["policy", "registry"]);
export type BundleKind = z.infer<typeof bundleKindSchema>;

export const unsignedBundleSchema = z
  .object({
    kind: bundleKindSchema,
    version: z.literal(1),
    name: z.string().min(1),
    createdAt: z.string().datetime(),
    payload: z.record(z.string(), z.unknown())
  })
  .strict();

export const signedBundleSchema = z
  .object({
    bundle: unsignedBundleSchema,
    hash: z.string().regex(/^[a-f0-9]{64}$/),
    signature: z.string().regex(/^[a-f0-9]{64}$/)
  })
  .strict();

export type UnsignedBundle = z.infer<typeof unsignedBundleSchema>;
export type SignedBundle = z.infer<typeof signedBundleSchema>;

function hmacSha256Hex(payload: string, signingKey: string): string {
  return createHmac("sha256", signingKey).update(payload, "utf8").digest("hex");
}

function constantTimeHexEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function bundleHash(bundle: UnsignedBundle): string {
  return hashCanonical(unsignedBundleSchema.parse(bundle));
}

export function signBundle(input: unknown, signingKey: string): SignedBundle {
  const bundle = unsignedBundleSchema.parse(input);
  const hash = bundleHash(bundle);
  const signature = hmacSha256Hex(canonicalJson({ bundle, hash }), signingKey);

  return signedBundleSchema.parse({
    bundle,
    hash,
    signature
  });
}

export function verifySignedBundle(input: unknown, signingKey: string): SignedBundle {
  const parsed = signedBundleSchema.safeParse(input);

  if (!parsed.success) {
    throw new AgentShieldSecurityError({
      code: "BUNDLE_SCHEMA_INVALID",
      message: "signed bundle schema validation failed"
    });
  }

  const expectedHash = bundleHash(parsed.data.bundle);

  if (!constantTimeHexEqual(parsed.data.hash, expectedHash)) {
    throw new AgentShieldSecurityError({
      code: "BUNDLE_HASH_MISMATCH",
      message: "signed bundle hash verification failed"
    });
  }

  const expectedSignature = hmacSha256Hex(canonicalJson({ bundle: parsed.data.bundle, hash: parsed.data.hash }), signingKey);

  if (!constantTimeHexEqual(parsed.data.signature, expectedSignature)) {
    throw new AgentShieldSecurityError({
      code: "BUNDLE_SIGNATURE_MISMATCH",
      message: "signed bundle signature verification failed"
    });
  }

  return parsed.data;
}
