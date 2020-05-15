#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "${SCRIPT_DIR}"

function error {
    echo -e >&2 "\033[31m${1}\033[0m";
    exit 1;
}

function notice {
    echo $2 -e >&2 "\033[33m${1}\033[0m";
}

function ensure_env {
    command -v node >/dev/null 2>&1 || error "Please install nodejs"
    command -v npm >/dev/null 2>&1 || error "Please install npm"

    if [[ ! -d "./node_modules" ]]; then
        npm install
    fi
}

function cmd-cli {
    ./node_modules/.bin/tsc
    node dist/src/cli.js "$@"
}

function cmd-docker-start {
    command -v docker >/dev/null 2>&1 || error "Please install docker"
    command -v docker-compose >/dev/null 2>&1 || error "Please install docker-compose"
    (cd docker && docker-compose up -d) || error "Failed to start docker test environment"
}

function cmd-docker-create-api-token {
    # TODO: error handling
    curl -sS -X POST -H "Content-Type: application/json" -d "{\"name\":\"key$(date +%s)\", \"role\": \"Admin\"}" http://admin:password@${GRAFANA_HOST}/api/auth/keys | jq -r .key
}

function cmd-docker-create-datasource {
    # TODO: error handling
    curl -sS -X POST -H "Content-Type: application/json" -d '{"name": "Yay Prometheus", "type": "prometheus", "access": "proxy", "url": "http://prometheus:9090"}' http://admin:password@${GRAFANA_HOST}/api/datasources 2>&1 1>/dev/null
}

function run-grafana-tests {
    for file in $(ls dist/dashboards/*.js); do
        notice "Deploying '$file' " -n
        result="$(node dist/src/cli.js --host "${GRAFANA_HOST}" --no-ssl $file)"
        status=$(echo "$result" | jq .status)
        if [[ "$status" == "\"success\"" ]]; then
            echo "✅"
        else
            echo "❌"
            echo $result
            exit 1
        fi
    done
}

function cmd-docker-test {
    cmd-docker-start
    rm -rf dist/
    tsc
    export GRAFANA_HOST="localhost:3000"
    export GRAFANA_API_TOKEN="$(cmd-docker-create-api-token)"
    run-grafana-tests
}

function cmd-ci-test {
    npm install
    npm run build
    npm run test

    export GRAFANA_HOST="grafana:3000"
    export GRAFANA_API_TOKEN="$(cmd-docker-create-api-token)"
    run-grafana-tests
}

function cmd-usage {
    cat <<-eof
./go [command] [options]
      cli - starts the TypedGrafana CLI (-h for help)
      docker-start - starts a Grafana / Prometheus test environment
      docker-test - starts the integration tests that run against the test environment
      docker-create-api-token
      docker-create-datasource
eof
}

ensure_env

command=""
if (( $# > 0 )); then
    command="${1}"
    shift
fi

case "${command}" in
    docker-start) cmd-docker-start ;;
    docker-test) cmd-docker-test ;;
    docker-create-api-token) cmd-docker-create-api-token ;;
    docker-create-datasource) cmd-docker-create-datasource ;;
    ci-test) cmd-ci-test ;;
    cli) cmd-cli "${command}" "$@" ;;
    *) cmd-usage ;;
esac
