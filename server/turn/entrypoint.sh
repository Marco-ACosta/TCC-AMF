set -eu

: "${TURN_PUBLIC_IP}"
: "${TURN_REALM}"

TURN_MIN_PORT="${TURN_MIN_PORT:-49160}"
TURN_MAX_PORT="${TURN_MAX_PORT:-49200}"
TURN_USE_AUTH_SECRET="${TURN_USE_AUTH_SECRET:-true}"
TURN_ENABLE_TLS="${TURN_ENABLE_TLS:-false}"
CONF="${TURN_CONFIG_PATH:-/tmp/turnserver.conf}"

if [ "$TURN_USE_AUTH_SECRET" = "true" ]; then
  : "${TURN_STATIC_SECRET}"
  AUTH_BLOCK="use-auth-secret
static-auth-secret=${TURN_STATIC_SECRET}"
else
  : "${TURN_USER}"
  : "${TURN_PASS}"
  AUTH_BLOCK="lt-cred-mech
user=${TURN_USER}:${TURN_PASS}"
fi

TLS_BLOCK=""
if [ "$TURN_ENABLE_TLS" = "true" ]; then
  : "${TLS_CERT_FILE}"
  : "${TLS_KEY_FILE}"
  TLS_BLOCK="tls-listening-port=5349
cert=${TLS_CERT_FILE}
pkey=${TLS_KEY_FILE}"
fi

mkdir -p "$(dirname "$CONF")"
cat >"$CONF" <<EOF
fingerprint
realm=${TURN_REALM}

listening-ip=0.0.0.0
listening-port=3478
${TLS_BLOCK}

external-ip=${TURN_PUBLIC_IP}

min-port=${TURN_MIN_PORT}
max-port=${TURN_MAX_PORT}

no-cli
no-multicast-peers

${AUTH_BLOCK}
EOF

exec "$@"
