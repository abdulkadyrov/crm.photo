#!/usr/bin/env bash
# Adds CRM host routing without replacing the existing AR Photo configuration.
set -euo pipefail
source_file=${1:?Usage: install-caddy.sh Caddyfile.crm}
config=/etc/caddy/Caddyfile
fragment=/etc/caddy/crm-photo.caddy
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup="/opt/crm-photo/backups/caddy-$stamp"
mkdir -p "$backup"
cp -a "$config" "$backup/Caddyfile"
if [[ -e "$fragment" ]]; then cp -a "$fragment" "$backup/crm-photo.caddy"; fi
restore() {
  cp -a "$backup/Caddyfile" "$config"
  if [[ -e "$backup/crm-photo.caddy" ]]; then
    cp -a "$backup/crm-photo.caddy" "$fragment"
  else
    rm -f "$fragment"
  fi
}
trap 'restore' ERR
install -m 644 "$source_file" "$fragment"
if ! grep -Fxq 'import /etc/caddy/crm-photo.caddy' "$config"; then
  printf '\nimport /etc/caddy/crm-photo.caddy\n' >> "$config"
fi
caddy validate --config "$config"
systemctl reload caddy
trap - ERR
printf 'CRM route installed. Previous configuration: %s\n' "$backup"
