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

function cmd-docker-test {
    cmd-docker-start
    tsc
    export GRAFANA_API_TOKEN="$(cat docker/api-key)"
    for file in $(ls dist/dashboards/*.js); do
        notice "Deploying '$file' " -n
        result="$(node dist/src/cli.js --no-ssl $file)"
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

function cmd-usage {
    cat <<-eof
./go [command] [options]
      cli - starts the TypedGrafana CLI (-h for help)
      docker-start - starts a Grafana / Prometheus test environment
      docker-test - starts the integration tests that run against the test environment
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
    cli) cmd-cli "${command}" "$@" ;;
    *) cmd-usage ;;
esac
