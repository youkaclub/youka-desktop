#!/bin/bash

set -e

version=$(git rev-parse --short HEAD);

echo "version $version";
cd build;

for filename in static/js/*.js; do
  echo "download ${filename}";
  minified_url="https://app.youka.club/${filename}";

  curl https://api.rollbar.com/api/1/sourcemap/download \
    -F access_token="${ROLLBAR_ACCESS_TOKEN}" \
    -F version="${version}" \
    -F minified_url="${minified_url}"
done