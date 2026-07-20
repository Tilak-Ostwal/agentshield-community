# Taint Tracking

AgentShield uses deterministic taint tracking to follow sensitive, private, generated, and untrusted data across a session.

The goal is to detect data-flow attacks, not only dangerous tools. Examples include:

- secret -> network write
- env secret -> summarize -> network write
- browser content -> shell execution
- generated code -> shell execution
- credential -> git write or network write
- private user data -> external side effect

## Labels

Supported taint labels:

- `secret`
- `credential`
- `token`
- `api_key`
- `password`
- `private_user_data`
- `filesystem_sensitive`
- `env_secret`
- `ssh_key`
- `browser_untrusted`
- `network_untrusted`
- `prompt_injection_source`
- `external_content`
- `generated_code`
- `executable_content`
- `pii_possible`

## Sources

Taint is inferred from:

- Input keys such as `token`, `apiKey`, `password`, `secret`, `authorization`, and `cookie`
- Values that look like test API keys or tokens
- Sensitive-looking paths such as `.env`, `id_rsa`, `credentials`, `secret`, `token`, and `key`
- Capabilities such as `secret.read`, `env.read`, `browser.read`, and `network.read`
- Tool names such as `filesystem.read`, `browser.goto`, `network.get`, and `email.read`

## Propagation

The runtime taint store attaches labels to action IDs and resources. Taint propagates when:

- A later action uses the same resource
- An action references a previous action ID
- An action references a source resource

Propagation is conservative and deterministic. It does not use LLM calls.

## Sinks

Dangerous sinks include:

- `network.write`
- `external_side_effect`
- `shell.exec`
- `code_execution`
- `package.install`
- `git.write`
- `database.write`
- `browser.write`

Critical taint sink findings strengthen the runtime decision to `deny`. High severity taint sink findings strengthen `allow` to `require_human_review`. Existing denies are never weakened.

## Traces

The runtime emits:

- `taint_detected`
- `taint_propagated`
- `taint_sink_violation`

Trace data is stored through the redacting trace recorder. Raw secrets must not appear in persisted traces or adapter responses.
