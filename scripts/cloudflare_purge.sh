#!/bin/bash

set -e

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "X-Auth-Key: ${CLOUDFLARE_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'