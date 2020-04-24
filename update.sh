#!/bin/bash
set -e

echo -e "\n\n"
echo "Compiling"
npm run start

echo -e "\n\n"
cat temp.json | jq

echo "\n\n"
echo "Updating dashboard"
curl --location --request POST 'http://localhost:3000/api/dashboards/db' \
--header 'Accept: application/json' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${GRAFANA_API_TOKEN}" \
--header 'Content-Type: text/plain' \
--data-binary @./build/temp.json
