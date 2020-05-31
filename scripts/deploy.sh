#!/bin/bash

aws s3 sync --delete build s3://app.youka.club
aws s3 cp --content-type application/wasm  build/js/subtitles-octopus-worker.wasm s3://app.youka.club/js/subtitles-octopus-worker.wasm