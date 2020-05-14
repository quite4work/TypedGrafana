#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "${SCRIPT_DIR}"

function error {
    echo -e >&2 "\033[31m${1}\033[0m";
    exit 1;
}

function notice {
    echo -e >&2 "\033[33m${1}\033[0m";
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

function cmd-start-docker {
    command -v docker >/dev/null 2>&1 || error "Please install docker"
    command -v docker-compose >/dev/null 2>&1 || error "Please install docker-compose"
    (cd example && docker-compose up -d)
}

ensure_env

command=""
if (( $# > 0 )); then
    command="${1}"
    shift
fi

case "${command}" in
    start-docker) cmd-start-docker ;;
    *) cmd-cli "${command}" "$@" ;;
esac
