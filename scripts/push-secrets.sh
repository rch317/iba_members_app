#!/usr/bin/env bash
# Creates (or updates) a single AWS Secrets Manager secret from .env values.
#
# Usage:
#   bash scripts/push-secrets.sh [--update]
#
#   --update  : use put-secret-value to overwrite an existing secret
#               (default: create-secret — fails if secret already exists)
#
# Requires: aws CLI configured with appropriate permissions
set -euo pipefail

SECRET_NAME="iba-membership"
ENV_FILE="$(dirname "$0")/../.env"

# Keys to include — PORT and the local mongo URI are excluded
KEYS=(
  MONGO_URI
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  GOOGLE_CALLBACK_URL
  SESSION_SECRET
)

# Pull values from .env (ignores comment lines)
get_val() {
  grep -E "^${1}=" "$ENV_FILE" | head -1 | cut -d= -f2-
}

# Build JSON object
json="{"
for key in "${KEYS[@]}"; do
  val=$(get_val "$key")
  if [[ -z "$val" ]]; then
    echo "WARNING: $key is empty in .env — skipping"
    continue
  fi
  # Escape double-quotes and backslashes in the value
  val="${val//\\/\\\\}"
  val="${val//\"/\\\"}"
  json+="\"$key\":\"$val\","
done
json="${json%,}}"  # strip trailing comma and close

echo "Secret JSON (keys only):"
for key in "${KEYS[@]}"; do echo "  $key"; done
echo ""

UPDATE="${1:-}"
if [[ "$UPDATE" == "--update" ]]; then
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "$json"
  echo "Updated secret: $SECRET_NAME"
else
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "IBA Membership app environment secrets" \
    --secret-string "$json"
  echo "Created secret: $SECRET_NAME"
fi
