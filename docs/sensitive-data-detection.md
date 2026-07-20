# Sensitive Data Detection

AgentShield includes an advanced local sensitive-data detection system that identifies secrets, credentials, tokens, PII-like data, private keys, auth headers, environment variables, and sensitive file paths across runtime inputs/outputs, traces, and evidence.

## CLI Usage

```bash
agentshield sensitive scan <file>
agentshield sensitive verify-report <file>
```

## Supported Categories
- api_key
- bearer_token
- jwt
- private_key
- ssh_key
- password
- auth_header
- cookie
- session_token
- env_secret
- database_url
- cloud_access_key
- webhook_url
- email_address
- phone_number
- ip_address
- credit_card_like
- pii_name_like
- sensitive_file_path
- unknown_secret_like

## Redaction Behavior
AgentShield preserves the structure of JSON outputs and traces while deterministically redacting sensitive values.

## Limitations
No external DLP or cloud services are used. Detection is based on local patterns.
