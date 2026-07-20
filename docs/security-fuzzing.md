# Security Fuzzing

Phase 36 adds deterministic failure-mode fuzzing.

## Why Deterministic Failure-Mode Fuzzing Matters
AgentShield aims to securely evaluate inputs. Fuzzing proves it fails closed.

## Fixture Format
JSON defining the input and expected fail-closed rules.

## Mutation Model
A seeded, deterministic mutation generator checks object modifications.

## Fail-Closed Rules
Any failure to close access results in a critical violation.

## Usage
\`pnpm cli -- security-fuzz\`
